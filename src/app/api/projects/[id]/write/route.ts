import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db/client'
import { streamAgent } from '@/lib/claude'
import { ChapterOutline } from '@/types/book'

const WRITER_PROMPT = `당신은 전문 작가입니다. 주어진 챕터 개요를 바탕으로 완성도 높은 내용을 작성해주세요.

작성 지침:
1. 챕터 개요의 핵심 포인트를 모두 다룹니다
2. 자연스러운 문장과 단락 흐름을 유지합니다
3. 독자의 이해를 돕는 예시와 설명을 포함합니다
4. 이전 챕터와의 연결성을 고려합니다
5. 최소 2000자 이상 작성합니다

**중요 - 출력 형식:**
- 순수 텍스트로만 작성합니다
- 마크다운 문법(#, *, -, ```, > 등) 절대 사용 금지
- 소제목이 필요하면 그냥 텍스트로 작성 (예: "첫 번째 이야기" 처럼)
- 단락 구분은 빈 줄로만 합니다
- 목록이 필요하면 "첫째, 둘째" 또는 "1. 2. 3." 형태로 문장 안에 포함

문체와 톤:
- 책의 전체 톤과 일관성을 유지합니다
- 타겟 독자의 수준에 맞춥니다`

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { chapterNumber, chapterOutline, previousChapters } = await request.json() as {
      chapterNumber: number
      chapterOutline: ChapterOutline
      previousChapters: { number: number; title: string; summary: string }[]
    }

    // 프로젝트 정보 조회
    const project = await prisma.project.findUnique({
      where: { id }
    })

    if (!project) {
      return new Response('Project not found', { status: 404 })
    }

    // 이전 챕터 컨텍스트 구성
    let previousContext = ''
    if (previousChapters.length > 0) {
      previousContext = '\n\n**이전 챕터 요약:**\n' +
        previousChapters.map(ch => `- ${ch.number}. ${ch.title}: ${ch.summary}`).join('\n')
    }

    const prompt = `**책 제목**: ${project.title}
**책 유형**: ${project.type}
**타겟 독자**: ${project.targetAudience || '일반 독자'}
**문체**: ${project.tone || '친근체'}
${previousContext}

**현재 챕터 정보:**
- 챕터 번호: ${chapterNumber}
- 챕터 제목: ${chapterOutline.title}
- 챕터 요약: ${chapterOutline.summary}
- 핵심 포인트: ${chapterOutline.keyPoints?.join(', ') || '없음'}

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
  } catch (error) {
    console.error('Failed to write chapter:', error)
    return new Response('Failed to write chapter', { status: 500 })
  }
}
