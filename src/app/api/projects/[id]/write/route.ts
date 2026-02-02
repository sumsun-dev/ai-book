import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db/client'
import { streamAgent } from '@/lib/claude'

// TODO: 인증 미들웨어 추가 필요 (Task #2)

const MAX_CONTENT_LENGTH = 10000

const ChapterOutlineSchema = z.object({
  title: z.string().max(200),
  summary: z.string().max(MAX_CONTENT_LENGTH),
  keyPoints: z.array(z.string().max(500)).optional(),
})

const PreviousChapterSchema = z.object({
  number: z.number().int().positive(),
  title: z.string().max(200),
  summary: z.string().max(MAX_CONTENT_LENGTH),
})

const WriteChapterSchema = z.object({
  chapterNumber: z.number().int().positive(),
  chapterOutline: ChapterOutlineSchema,
  previousChapters: z.array(PreviousChapterSchema).max(50),
})

function sanitizeForPrompt(text: string): string {
  return text
    .replace(/```/g, '')
    .replace(/\$\{/g, '')
    .trim()
    .slice(0, MAX_CONTENT_LENGTH)
}

const WRITER_PROMPT = `당신은 베스트셀러 작가입니다. 수십 권의 책을 출간한 경험으로, 독자를 사로잡는 글을 씁니다.

## 글쓰기 철학

좋은 글은 독자와의 대화입니다. 독자가 페이지를 넘기고 싶게 만드세요.

## 구조 (반드시 따르세요)

1. **도입부** (전체의 10-15%)
   - 호기심을 자극하는 첫 문장으로 시작
   - 이 챕터에서 다룰 핵심 주제를 암시
   - 독자가 "더 읽고 싶다"고 느끼게 유도

2. **전개부** (전체의 70-75%)
   - 3-5개의 소주제로 나누어 전개
   - 각 소주제는 빈 줄로 명확히 구분
   - 추상적 개념 → 구체적 예시 → 독자 적용 순서로 전개
   - 적절한 비유와 은유로 이해를 도움

3. **마무리** (전체의 10-15%)
   - 핵심 내용을 새로운 관점으로 정리
   - 다음 챕터로의 자연스러운 연결
   - 독자에게 생각할 거리 제공

## 문단 작성 규칙 (매우 중요)

- 한 문단은 3-6문장으로 구성
- 문단과 문단 사이는 반드시 빈 줄 하나로 구분
- 한 문단 = 하나의 아이디어
- 문단 첫 문장은 그 문단의 핵심을 담음

## 문장 작성 규칙

- 짧은 문장과 긴 문장을 번갈아 사용하여 리듬감 부여
- 수동태보다 능동태 선호
- "~것이다", "~되었다" 같은 딱딱한 표현 최소화
- 독자에게 직접 말하듯 친근하게 (타겟 독자에 따라 조절)

## 디테일과 예시

- 추상적 개념에는 반드시 구체적 예시 제시
- "예를 들어", "가령", "실제로" 등으로 예시 도입
- 숫자, 통계, 실제 사례로 신뢰성 확보
- 감각적 묘사(시각, 청각, 촉각)로 생동감 부여

## 출력 형식 (절대 준수)

- 순수 텍스트만 출력
- 마크다운 기호 절대 금지 (샵, 별표, 대시, 백틱, 꺾쇠 등)
- 소제목이 필요하면 일반 텍스트로 작성
- 문단 구분은 빈 줄 하나만 사용
- 최소 2500자, 권장 3000-4000자`

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    const parseResult = WriteChapterSchema.safeParse(body)
    if (!parseResult.success) {
      return new Response(
        JSON.stringify({ error: 'Invalid request body', details: parseResult.error.flatten() }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const { chapterNumber, chapterOutline, previousChapters } = parseResult.data

    const project = await prisma.project.findUnique({
      where: { id }
    })

    if (!project) {
      return new Response(
        JSON.stringify({ error: 'Project not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const previousContext = previousChapters.length > 0
      ? '\n\n**이전 챕터 요약:**\n' +
        previousChapters.map(ch =>
          `- ${ch.number}. ${sanitizeForPrompt(ch.title)}: ${sanitizeForPrompt(ch.summary)}`
        ).join('\n')
      : ''

    const prompt = `**책 제목**: ${sanitizeForPrompt(project.title)}
**책 유형**: ${project.type}
**타겟 독자**: ${sanitizeForPrompt(project.targetAudience || '일반 독자')}
**문체**: ${sanitizeForPrompt(project.tone || '친근체')}
${previousContext}

**현재 챕터 정보:**
- 챕터 번호: ${chapterNumber}
- 챕터 제목: ${sanitizeForPrompt(chapterOutline.title)}
- 챕터 요약: ${sanitizeForPrompt(chapterOutline.summary)}
- 핵심 포인트: ${chapterOutline.keyPoints?.map(sanitizeForPrompt).join(', ') || '없음'}

위 정보를 바탕으로 이 챕터의 본문을 작성해주세요.`

    // 스트리밍 응답 생성
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        try {
          await streamAgent(
            {
              name: 'chapter-writer',
              systemPrompt: WRITER_PROMPT,
              temperature: 0.8
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
      }
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      }
    })
  } catch {
    return new Response(
      JSON.stringify({ error: 'Failed to write chapter' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}
