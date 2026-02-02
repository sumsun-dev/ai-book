import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db/client'
import { streamAgent } from '@/lib/claude'

type RouteParams = { params: Promise<{ id: string; chapterId: string }> }

const GeneratePageSchema = z.object({
  pageNumber: z.number().int().positive(),
  mode: z.enum(['new', 'continue', 'rewrite']),
  context: z.string().max(10000),
  currentContent: z.string().max(10000).optional(),
})

const PAGE_WRITER_PROMPTS = {
  new: `당신은 전문 작가입니다. 주어진 컨텍스트를 바탕으로 새 페이지의 내용을 작성해주세요.

작성 지침:
1. 약 400단어(한글 기준 1500자) 분량으로 작성합니다
2. 챕터 개요와 핵심 포인트를 반영합니다
3. 자연스러운 문장과 단락 흐름을 유지합니다
4. 문단 사이에는 빈 줄을 넣어 가독성을 높입니다

**중요 - 출력 형식:**
- 순수 텍스트로만 작성합니다
- 마크다운 문법 절대 사용 금지 (샵, 별표, 대시, 백틱, 꺾쇠 등)
- 소제목은 그냥 텍스트로 작성
- 강조는 따옴표나 문맥으로 표현`,

  continue: `당신은 전문 작가입니다. 이전 내용에 이어서 자연스럽게 작성해주세요.

작성 지침:
1. 약 400단어(한글 기준 1500자) 분량으로 작성합니다
2. 이전 내용의 문체와 톤을 유지합니다
3. 스토리나 논리적 흐름을 자연스럽게 이어갑니다
4. 문단 사이에는 빈 줄을 넣어 가독성을 높입니다

**중요 - 출력 형식:**
- 순수 텍스트로만 작성합니다
- 마크다운 문법 절대 사용 금지 (샵, 별표, 대시, 백틱, 꺾쇠 등)`,

  rewrite: `당신은 전문 편집자입니다. 기존 내용을 개선하여 다시 작성해주세요.

작성 지침:
1. 원본 내용의 핵심 의미를 유지합니다
2. 문장을 더 명확하고 읽기 쉽게 개선합니다
3. 불필요한 반복을 제거합니다
4. 약 400단어(한글 기준 1500자) 분량으로 작성합니다

**중요 - 출력 형식:**
- 순수 텍스트로만 작성합니다
- 마크다운 문법 절대 사용 금지 (샵, 별표, 대시, 백틱, 꺾쇠 등)`,
}

function sanitizeForPrompt(text: string): string {
  return text
    .replace(/```/g, '')
    .replace(/\$\{/g, '')
    .trim()
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id, chapterId } = await params
    const body = await request.json()

    const parseResult = GeneratePageSchema.safeParse(body)
    if (!parseResult.success) {
      return new Response(
        JSON.stringify({ error: 'Invalid request body', details: parseResult.error.flatten() }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const { pageNumber, mode, context, currentContent } = parseResult.data

    const chapter = await prisma.chapter.findFirst({
      where: { id: chapterId, projectId: id },
    })

    if (!chapter) {
      return new Response('Chapter not found', { status: 404 })
    }

    const project = await prisma.project.findUnique({
      where: { id },
    })

    if (!project) {
      return new Response('Project not found', { status: 404 })
    }

    const sanitizedContext = sanitizeForPrompt(context)
    const sanitizedCurrentContent = currentContent ? sanitizeForPrompt(currentContent) : ''

    let prompt = `**책 제목**: ${sanitizeForPrompt(project.title)}
**책 유형**: ${project.type}
**타겟 독자**: ${sanitizeForPrompt(project.targetAudience || '일반 독자')}
**문체**: ${sanitizeForPrompt(project.tone || '친근체')}

**챕터 정보**:
${sanitizedContext}

**현재 페이지**: ${pageNumber}페이지
`

    if (mode === 'rewrite' && sanitizedCurrentContent) {
      prompt += `
**개선할 원본 내용**:
${sanitizedCurrentContent}

위 내용을 개선하여 더 나은 버전으로 다시 작성해주세요.`
    } else if (mode === 'continue') {
      prompt += `
위 컨텍스트를 참고하여 자연스럽게 이어서 작성해주세요.`
    } else {
      prompt += `
위 컨텍스트를 참고하여 이 페이지의 내용을 작성해주세요.`
    }

    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        try {
          await streamAgent(
            {
              name: 'page-writer',
              systemPrompt: PAGE_WRITER_PROMPTS[mode],
              temperature: 0.7,
            },
            prompt,
            undefined,
            (chunk) => {
              controller.enqueue(encoder.encode(chunk))
            }
          )
          controller.close()
        } catch (error) {
          controller.error(error)
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
  } catch {
    return new Response('Failed to generate page', { status: 500 })
  }
}
