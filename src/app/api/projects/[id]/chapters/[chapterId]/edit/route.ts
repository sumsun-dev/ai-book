import { NextRequest } from 'next/server'
import { requireAuth, projectOwnerWhere } from '@/lib/auth/auth-utils'
import { z } from 'zod'
import { prisma } from '@/lib/db/client'
import { streamAgent } from '@/lib/claude'
import { checkQuota, recordUsage } from '@/lib/token-quota'
import { AppError, ERROR_CODES } from '@/lib/errors'

type RouteParams = { params: Promise<{ id: string; chapterId: string }> }

const EditRequestSchema = z.object({
  selectedText: z.string().min(1).max(10000),
  instruction: z.string().min(1).max(1000),
  context: z.string().max(5000).optional(),
})

function sanitizeForPrompt(text: string): string {
  return text
    .replace(/```/g, '')
    .replace(/\$\{/g, '')
    .trim()
}

const EDIT_SYSTEM_PROMPT = `당신은 베테랑 편집자입니다. 사용자가 선택한 텍스트를 지시에 따라 수정해주세요.

## 편집 원칙

1. **지시 충실**
   - 사용자의 수정 요청을 정확히 반영
   - 요청하지 않은 부분은 최대한 유지

2. **문맥 유지**
   - 전후 맥락과 어울리는 자연스러운 수정
   - 문체와 톤 일관성 유지

3. **품질 향상**
   - 더 명확하고 읽기 쉬운 표현
   - 불필요한 반복 제거
   - 적절한 문단 구분

## 출력 형식 (절대 준수)
- 수정된 텍스트만 출력
- 마크다운 기호 절대 금지
- 설명이나 주석 없이 순수 텍스트만
- 문단 구분은 빈 줄만 사용`

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { userId, error: authError } = await requireAuth()
    if (authError) return authError

    await checkQuota(userId!)

    const { id, chapterId } = await params
    const body = await request.json()

    const parseResult = EditRequestSchema.safeParse(body)
    if (!parseResult.success) {
      return new Response(
        JSON.stringify({ error: 'Invalid request body', details: z.flattenError(parseResult.error) }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const { selectedText, instruction, context } = parseResult.data

    const chapter = await prisma.chapter.findFirst({
      where: {
        id: chapterId,
        project: projectOwnerWhere(id, userId!),
      },
      include: { project: true },
    })

    if (!chapter) {
      return new Response(
        JSON.stringify({ error: 'Chapter not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const project = chapter.project

    const prompt = `**책 제목**: ${sanitizeForPrompt(project.title)}
**책 유형**: ${project.type}
**문체**: ${sanitizeForPrompt(project.tone || '친근체')}

${context ? `**주변 맥락**:\n${sanitizeForPrompt(context)}\n` : ''}
**수정할 텍스트**:
${sanitizeForPrompt(selectedText)}

**수정 지시**:
${sanitizeForPrompt(instruction)}

위 텍스트를 지시에 따라 수정해주세요.`

    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        let usage = { inputTokens: 0, outputTokens: 0 }
        try {
          const result = await streamAgent(
            {
              name: 'text-editor',
              systemPrompt: EDIT_SYSTEM_PROMPT,
              temperature: 0.5,
            },
            prompt,
            undefined,
            (chunk) => {
              controller.enqueue(encoder.encode(chunk))
            }
          )
          usage = result.usage
          controller.close()
        } catch (error) {
          controller.error(error)
        } finally {
          if (usage.inputTokens > 0 || usage.outputTokens > 0) {
            recordUsage(userId!, 'text-editor', usage, id).catch(() => {})
          }
        }
      },
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    })
  } catch (error) {
    if (error instanceof AppError) {
      const status = error.code === ERROR_CODES.QUOTA_EXCEEDED ? 429 : 400
      return new Response(
        JSON.stringify({ error: error.message, code: error.code }),
        { status, headers: { 'Content-Type': 'application/json' } }
      )
    }
    return new Response(
      JSON.stringify({ error: 'Failed to edit text' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}
