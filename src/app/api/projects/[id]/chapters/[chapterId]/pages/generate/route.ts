import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db/client'
import { streamAgent } from '@/lib/claude'
import { buildBibleContext, parseBibleJson } from '@/lib/bible-context'

// TODO: 인증 미들웨어 추가 필요 (Task #2)

type RouteParams = { params: Promise<{ id: string; chapterId: string }> }

const GeneratePageSchema = z.object({
  pageNumber: z.number().int().positive(),
  mode: z.enum(['new', 'continue', 'rewrite']),
  context: z.string().max(10000),
  currentContent: z.string().max(10000).optional(),
})

// 분야별 페이지 작성 프롬프트 (new 모드)
const PAGE_NEW_PROMPTS: Record<string, string> = {
  fiction: `당신은 노벨 문학상 후보 소설가입니다. 한 페이지의 장면을 작성하세요.

## 소설 페이지 작성

1. **장면 중심 서술**
   - 보여주기(Show), 말하지 않기(Don't Tell)
   - 인물의 행동, 대화, 표정으로 감정 전달
   - 배경 묘사는 분위기와 연결

2. **감각적 묘사**
   - 시각, 청각, 촉각, 후각, 미각 활용
   - 독자가 그 자리에 있는 듯한 몰입감
   - 과잉 묘사는 피하고 핵심만

3. **문학적 문체**
   - 시적이면서도 읽기 쉬운 문장
   - 은유와 비유의 자연스러운 활용
   - 짧은 문장으로 긴장, 긴 문장으로 서정

4. **분량**: 약 1500자`,

  nonfiction: `당신은 퓰리처상 논픽션 작가입니다. 흥미로운 한 페이지를 작성하세요.

## 논픽션 페이지 작성

1. **스토리텔링**
   - 사실을 이야기처럼 풀어내기
   - 구체적 사례로 시작하여 주제 전개
   - 독자의 호기심 유지

2. **논리적 전개**
   - 한 문단 = 하나의 핵심 아이디어
   - 증거와 예시로 뒷받침
   - 자연스러운 흐름으로 연결

3. **신뢰성 확보**
   - 구체적인 사례, 수치, 연구 결과
   - 전문가 의견이나 실제 경험
   - 출처가 명확한 정보

4. **분량**: 약 1500자`,

  selfhelp: `당신은 천만 부 판매 자기계발 작가입니다. 독자의 마음을 움직이는 한 페이지를 작성하세요.

## 자기계발 페이지 작성

1. **공감과 연결**
   - 독자의 고민 인정하며 시작
   - "당신도 이런 경험이 있을 것"
   - 저자의 경험이나 사례 공유

2. **실용적 가치**
   - 추상적 원칙 → 구체적 행동
   - 바로 실천 가능한 조언
   - 작은 변화부터 시작하도록 유도

3. **동기부여 톤**
   - 격려하고 응원하는 문체
   - 긍정적이지만 현실적
   - 변화 가능성에 대한 확신

4. **분량**: 약 1500자`,

  technical: `당신은 20년 경력 기술 작가입니다. 명확한 한 페이지를 작성하세요.

## 기술서 페이지 작성

1. **명확한 설명**
   - 전문 용어는 정의와 함께
   - 단계적으로 개념 설명
   - 비유로 추상 개념 구체화

2. **구조화된 내용**
   - 개념 → 원리 → 예시 → 응용
   - 한 문단 = 하나의 포인트
   - 논리적 순서로 전개

3. **실용적 예시**
   - 이론 후 실제 예시
   - 적용 시나리오 제시
   - 주의사항이나 팁 포함

4. **분량**: 약 1500자`,

  essay: `당신은 문학상 수상 에세이스트입니다. 깊이 있는 한 페이지를 작성하세요.

## 에세이 페이지 작성

1. **개인적 목소리**
   - 솔직하고 진솔한 1인칭
   - 자신만의 관점과 감성
   - 독자와 대화하듯

2. **일상의 통찰**
   - 사소한 것에서 의미 발견
   - 개인 경험 → 보편적 진리
   - 여운 남기는 마무리

3. **문학적 표현**
   - 서정적인 문장
   - 은유와 비유
   - 리듬감 있는 호흡

4. **분량**: 약 1500자`,

  children: `당신은 안데르센상 아동문학 작가입니다. 아이들을 위한 한 페이지를 작성하세요.

## 아동문학 페이지 작성

1. **쉬운 언어**
   - 짧은 문장, 쉬운 단어
   - 의성어, 의태어 활용
   - 어려운 개념은 비유로

2. **상상력 자극**
   - 신기하고 재미있는 요소
   - 아이가 주인공처럼 느끼게
   - 호기심 유발

3. **리듬감**
   - 소리 내어 읽기 좋은 글
   - 반복과 운율
   - 친근한 대화체

4. **분량**: 약 1000자`,

  poetry: `당신은 한국문학상 수상 시인입니다. 시적인 한 페이지를 작성하세요.

## 시적 산문 작성

1. **언어의 음악성**
   - 리듬과 운율이 느껴지는 문장
   - 소리의 조화
   - 여백도 언어의 일부

2. **이미지의 힘**
   - 추상을 구체적 이미지로
   - 오감 자극 묘사
   - 함축적 표현

3. **감정의 진정성**
   - 과장 없는 솔직한 감정
   - 공감과 울림
   - 여운 남기기

4. **분량**: 약 1000자`,
}

const OUTPUT_RULES = `

## 출력 형식 (절대 준수)
- 순수 텍스트만 출력
- 마크다운 기호 절대 금지
- 문단 구분은 빈 줄만 사용`

function getPageNewPrompt(bookType: string): string {
  const base = PAGE_NEW_PROMPTS[bookType] || PAGE_NEW_PROMPTS.nonfiction
  return base + OUTPUT_RULES
}

const PAGE_WRITER_PROMPTS = {
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

5. **분량**: 약 1500자

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

    // Bible 컨텍스트 빌드
    const bible = parseBibleJson(project.bible)
    const bibleContext = buildBibleContext(bible, {
      currentChapter: chapter.number,
      maxContextLength: 3000, // 페이지 생성 시 더 짧게
    })

    const sanitizedContext = sanitizeForPrompt(context)
    const sanitizedCurrentContent = currentContent ? sanitizeForPrompt(currentContent) : ''

    let prompt = `**책 제목**: ${sanitizeForPrompt(project.title)}
**책 유형**: ${project.type}
**타겟 독자**: ${sanitizeForPrompt(project.targetAudience || '일반 독자')}
**문체**: ${sanitizeForPrompt(project.tone || '친근체')}
${bibleContext}

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
          const systemPrompt = mode === 'new'
            ? getPageNewPrompt(project.type)
            : PAGE_WRITER_PROMPTS[mode]

          await streamAgent(
            {
              name: 'page-writer',
              systemPrompt,
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
