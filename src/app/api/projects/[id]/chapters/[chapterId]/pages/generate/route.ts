import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db/client'
import { streamAgent } from '@/lib/claude'

// TODO: 인증 미들웨어 추가 필요 (Task #2)

type RouteParams = { params: Promise<{ id: string; chapterId: string }> }

const GeneratePageSchema = z.object({
  pageNumber: z.number().int().positive(),
  mode: z.enum(['new', 'continue', 'rewrite']),
  context: z.string().max(10000),
  currentContent: z.string().max(10000).optional(),
})

const PAGE_WRITER_PROMPTS = {
  new: `당신은 베스트셀러 작가입니다. 독자를 사로잡는 한 페이지를 작성하세요.

## 페이지 작성 원칙

1. **몰입감 있는 시작**
   - 첫 문장으로 독자의 주목을 끌기
   - 궁금증이나 공감을 유발

2. **명확한 문단 구조**
   - 한 문단 = 하나의 아이디어 (3-5문장)
   - 문단과 문단 사이에 반드시 빈 줄 삽입
   - 논리적 흐름으로 문단 연결

3. **생동감 있는 문장**
   - 짧은 문장과 긴 문장의 조화로 리듬감 부여
   - 구체적인 예시와 비유로 이해도 향상
   - 감각적 표현으로 생생함 전달

4. **분량**: 약 1500자 (400단어)

## 출력 형식 (절대 준수)
- 순수 텍스트만 출력
- 마크다운 기호 절대 금지
- 문단 구분은 빈 줄만 사용`,

  continue: `당신은 베스트셀러 작가입니다. 이전 내용에 자연스럽게 이어지는 다음 페이지를 작성하세요.

## 이어쓰기 원칙

1. **자연스러운 연결**
   - 이전 내용의 마지막 문맥을 파악
   - 갑작스러운 전환 없이 부드럽게 이어가기
   - 앞에서 언급한 내용 참조하며 전개

2. **일관된 문체 유지**
   - 이전 글의 어조와 분위기 계승
   - 문장 길이와 리듬 패턴 유지
   - 동일한 서술 시점 유지

3. **발전적 전개**
   - 단순 반복이 아닌 내용의 심화
   - 새로운 정보나 관점 추가
   - 독자의 기대에 부응하면서도 신선함 제공

4. **명확한 문단 구조**
   - 문단과 문단 사이에 반드시 빈 줄 삽입
   - 한 문단 = 하나의 아이디어

5. **분량**: 약 1500자 (400단어)

## 출력 형식 (절대 준수)
- 순수 텍스트만 출력
- 마크다운 기호 절대 금지
- 문단 구분은 빈 줄만 사용`,

  rewrite: `당신은 베테랑 편집자입니다. 원고를 더 나은 버전으로 다듬어주세요.

## 편집 원칙

1. **핵심 보존**
   - 원본의 주요 메시지와 의도 유지
   - 작가의 목소리와 스타일 존중

2. **문장 개선**
   - 장황한 문장을 간결하게
   - 수동태를 능동태로 전환
   - 불필요한 부사와 형용사 제거
   - 구체적이고 명확한 표현으로 교체

3. **구조 개선**
   - 논리적 흐름 강화
   - 문단 재구성으로 가독성 향상
   - 문단과 문단 사이에 반드시 빈 줄 삽입
   - 각 문단의 첫 문장을 핵심 문장으로

4. **독자 경험 향상**
   - 읽기 쉬운 리듬감 부여
   - 적절한 예시나 비유 보강
   - 지루한 부분 제거 또는 압축

5. **분량**: 원본과 유사하게 (약 1500자)

## 출력 형식 (절대 준수)
- 순수 텍스트만 출력
- 마크다운 기호 절대 금지
- 문단 구분은 빈 줄만 사용`,
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

    // N+1 방지: chapter와 project를 한 번에 조회
    const chapter = await prisma.chapter.findFirst({
      where: { id: chapterId, projectId: id },
      include: { project: true },
    })

    if (!chapter) {
      return new Response(
        JSON.stringify({ error: 'Chapter not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const project = chapter.project

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
    return new Response(
      JSON.stringify({ error: 'Failed to generate page' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}
