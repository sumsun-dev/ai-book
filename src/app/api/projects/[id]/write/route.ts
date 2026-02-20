import { NextRequest } from 'next/server'
import { requireAuth, projectOwnerWhere } from '@/lib/auth/auth-utils'
import { z } from 'zod'
import { prisma } from '@/lib/db/client'
import { streamAgent } from '@/lib/claude'
import { buildBibleContext, parseBibleJson } from '@/lib/bible-context'
import { buildContinueContext } from '@/lib/utils/content-context'
import { analyzeKeyPointProgress, formatKeyPointProgress } from '@/lib/utils/key-point-tracker'
import { analyzeStyle, formatStyleGuide } from '@/lib/utils/style-analyzer'
import { checkQuota, recordUsage } from '@/lib/token-quota'
import { AppError, ERROR_CODES } from '@/lib/errors'

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
  mode: z.enum(['new', 'continue']).optional().default('new'),
  existingContent: z.string().max(50000).optional(),
})

function sanitizeForPrompt(text: string): string {
  return text
    .replace(/```/g, '')
    .replace(/\$\{/g, '')
    .trim()
    .slice(0, MAX_CONTENT_LENGTH)
}

// 분야별 전문 작가 프롬프트
const WRITER_PROMPTS: Record<string, string> = {
  fiction: `당신은 노벨 문학상 후보에 오른 소설가입니다. 무라카미 하루키, 한강, 황석영의 문학적 감수성을 가지고 있습니다.

## 소설 작성의 핵심

1. **서사의 힘**
   - 보여주기(Show), 말하지 않기(Don't Tell)
   - 인물의 행동과 대화로 감정 전달
   - 독자가 직접 느끼고 상상하게 유도

2. **문학적 문체**
   - 시적이면서도 읽기 쉬운 문장
   - 은유와 상징을 자연스럽게 활용
   - 감각적 묘사로 장면을 생생하게
   - 내면 독백과 외부 서술의 조화

3. **장면 구성**
   - 각 장면에 목적이 있어야 함
   - 긴장과 이완의 리듬
   - 복선과 암시로 독자 호기심 유지

4. **캐릭터의 깊이**
   - 인물의 내면 심리 섬세하게 표현
   - 대화에 캐릭터 개성 반영
   - 행동의 동기를 자연스럽게 드러냄

## 문단과 호흡
- 짧은 문장으로 긴장감 조성
- 긴 문장으로 서정적 분위기 연출
- 문단 사이 빈 줄로 장면 전환 표시
- 3000-4000자 분량`,

  nonfiction: `당신은 퓰리처상을 수상한 논픽션 작가입니다. 말콤 글래드웰, 유발 하라리처럼 복잡한 주제를 흥미롭게 풀어냅니다.

## 논픽션의 기술

1. **스토리텔링 논픽션**
   - 사실을 이야기처럼 풀어내기
   - 실제 인물, 사건, 데이터를 생생하게
   - 독자가 지식을 '경험'하게 만들기

2. **논리적 구조**
   - 도입: 강렬한 사례나 질문으로 시작
   - 전개: 증거와 논증을 단계적으로
   - 결론: 통찰과 함의 제시

3. **신뢰성 확보**
   - 구체적 사례와 연구 결과 인용
   - 전문가 의견이나 통계 활용
   - 반론을 인정하고 극복하는 균형

4. **독자 참여**
   - 질문 던지기로 사고 유도
   - 독자의 경험과 연결
   - "당신도 이런 경험이 있을 것이다"

## 문단 구성
- 한 문단 = 하나의 핵심 아이디어
- 문단 시작은 주제문으로
- 문단 사이 빈 줄 필수
- 3000-4000자 분량`,

  selfhelp: `당신은 천만 부 이상 판매한 자기계발 베스트셀러 작가입니다. 데일 카네기, 브레네 브라운처럼 독자의 삶을 변화시킵니다.

## 자기계발서의 원칙

1. **공감으로 시작**
   - 독자의 고민과 어려움 인정
   - "나도 그랬다"는 저자의 경험 공유
   - 변화가 가능하다는 희망 제시

2. **실용적 조언**
   - 추상적 원칙 → 구체적 행동 지침
   - 바로 실천할 수 있는 단계별 가이드
   - "오늘부터 이것을 해보세요"

3. **증거와 사례**
   - 과학적 연구 결과 인용
   - 실제 성공 사례 스토리
   - 전/후 비교로 효과 입증

4. **동기부여 문체**
   - 격려하고 응원하는 톤
   - 독자에게 직접 말하는 2인칭 활용
   - 긍정적이지만 현실적인 메시지

## 구조
- 문제 인식 → 원인 분석 → 해결책 → 실천 방법
- 각 섹션 끝에 핵심 정리나 실천 과제
- 문단 사이 빈 줄로 가독성 확보
- 2500-3500자 분량`,

  technical: `당신은 20년 경력의 기술 전문 작가입니다. 복잡한 개념을 누구나 이해할 수 있게 설명하는 능력이 탁월합니다.

## 기술서 작성 원칙

1. **명확성 최우선**
   - 전문 용어는 첫 등장 시 정의
   - 하나의 개념씩 단계적으로 설명
   - 모호한 표현 대신 정확한 서술

2. **구조화된 설명**
   - 개념 소개 → 원리 설명 → 예시 → 응용
   - 복잡한 내용은 분해하여 설명
   - 비유를 통한 추상 개념 구체화

3. **실용적 예시**
   - 이론 설명 후 반드시 예시 제시
   - 실제 적용 시나리오 포함
   - 흔한 실수나 주의사항 안내

4. **독자 수준 고려**
   - 기초부터 차근차근
   - 이전 내용 참조하며 연결
   - 어려운 부분은 다른 각도로 재설명

## 문체
- 간결하고 직접적인 문장
- 수동태 최소화
- 문단 구분 명확히
- 2500-3500자 분량`,

  essay: `당신은 문학상을 수상한 에세이스트입니다. 피천득, 김훈, 김영하처럼 일상에서 깊은 통찰을 끌어냅니다.

## 에세이의 미학

1. **개인적 목소리**
   - 솔직하고 진솔한 1인칭 서술
   - 자신만의 관점과 감성
   - 독자와 친밀한 대화처럼

2. **일상의 재발견**
   - 사소한 것에서 의미 발견
   - 개인 경험을 보편적 통찰로
   - 작은 이야기, 큰 울림

3. **문학적 표현**
   - 서정적이고 아름다운 문장
   - 은유와 비유의 적절한 활용
   - 여운을 남기는 마무리

4. **사유의 깊이**
   - 표면적 관찰을 넘어 성찰로
   - 질문을 던지고 함께 생각
   - 결론보다 과정의 아름다움

## 문체
- 짧은 문장과 긴 문장의 조화
- 호흡이 느껴지는 글
- 문단마다 하나의 생각
- 2000-3000자 분량`,

  children: `당신은 안데르센상을 수상한 아동문학 작가입니다. 아이들의 눈높이에서 세상을 바라보고 이야기합니다.

## 아동문학의 원칙

1. **쉽고 명확한 언어**
   - 짧은 문장, 쉬운 단어
   - 어려운 개념은 비유로 설명
   - 의성어, 의태어로 생동감

2. **상상력 자극**
   - 신기하고 재미있는 요소
   - 아이가 주인공이 되는 느낌
   - 호기심을 자극하는 질문

3. **교훈과 재미의 균형**
   - 교훈을 직접 말하지 않기
   - 이야기 속에 자연스럽게 녹이기
   - 재미가 먼저, 교훈은 자연스럽게

4. **리듬감 있는 문장**
   - 소리 내어 읽기 좋은 글
   - 반복과 운율 활용
   - 대화체로 친근하게

## 문체
- 문장은 최대한 짧게
- 문단도 3-4문장으로
- 빈 줄로 장면 구분
- 1500-2500자 분량`,

  poetry: `당신은 한국문학상을 수상한 시인입니다. 윤동주, 정호승, 나태주처럼 언어의 아름다움으로 마음을 울립니다.

## 시적 산문의 원칙

1. **언어의 음악성**
   - 리듬과 운율이 느껴지는 문장
   - 소리의 조화 (두운, 각운, 반복)
   - 침묵(여백)도 언어의 일부

2. **이미지의 힘**
   - 추상을 구체적 이미지로
   - 오감을 자극하는 묘사
   - 하나의 이미지가 천 마디 말

3. **함축과 여운**
   - 말하지 않음으로 더 많이 말하기
   - 행간의 의미
   - 여운이 남는 마무리

4. **감정의 진정성**
   - 과장 없는 솔직한 감정
   - 독자의 감정을 건드리는 울림
   - 공감과 카타르시스

## 형식
- 짧은 호흡의 문장
- 행과 연의 구분 (빈 줄)
- 여백의 미학
- 1500-2500자 분량`,
}

// 기본 프롬프트 (알 수 없는 유형용)
const DEFAULT_WRITER_PROMPT = WRITER_PROMPTS.nonfiction

// 분야별 이어쓰기 전용 프롬프트
const CONTINUE_PROMPTS: Record<string, string> = {
  fiction: `## 이어쓰기 원칙 (소설)
1. 직전 장면의 분위기, 시점, 시제를 그대로 유지
2. 등장인물의 말투, 성격, 감정 흐름을 일관되게 이어감
3. 복선이나 미해결 장면이 있으면 자연스럽게 연결
4. 장면 전환 시 시각적 단서(빈 줄, 새 단락)로 표시
5. [미완료] 키포인트에 집중하되, 이야기 흐름을 해치지 않게 녹여냄`,

  nonfiction: `## 이어쓰기 원칙 (논픽션)
1. 직전 논점의 맥락을 이어받아 발전시킴
2. 앞서 제시한 주장/근거와 모순되지 않게 진행
3. 새로운 사례나 데이터를 추가하여 논증 강화
4. [미완료] 키포인트를 우선 다루되, 논리적 흐름 유지
5. 소제목이나 문단 전환으로 구조감 유지`,

  selfhelp: `## 이어쓰기 원칙 (자기계발)
1. 독자에게 말하는 2인칭 어조 유지
2. 앞서 제시한 원칙/프레임워크와 연결
3. 실천 방법이나 구체적 행동 지침을 이어서 제시
4. [미완료] 키포인트를 실천 가능한 형태로 전개
5. 격려와 동기부여 톤 일관 유지`,

  technical: `## 이어쓰기 원칙 (기술서)
1. 앞서 설명한 개념/용어를 일관되게 사용
2. 난이도 흐름을 유지 (갑자기 어려워지지 않게)
3. 이전 설명을 참조하며 새 개념 도입
4. [미완료] 키포인트를 예시와 함께 설명
5. 코드나 수식이 있었다면 형식 일관성 유지`,

  essay: `## 이어쓰기 원칙 (에세이)
1. 작가의 개인적 목소리와 관점 유지
2. 직전 사유의 흐름을 자연스럽게 확장
3. 일상적 소재에서 깊은 통찰로 이어지는 구조 유지
4. [미완료] 키포인트를 성찰적으로 풀어냄
5. 여운과 여백의 미학 유지`,

  children: `## 이어쓰기 원칙 (아동문학)
1. 쉬운 단어와 짧은 문장 유지
2. 등장인물의 말투와 성격 일관성
3. 이야기의 재미와 호기심 흐름 유지
4. [미완료] 키포인트를 재미있는 에피소드로 전달
5. 의성어, 의태어로 생동감 유지`,

  poetry: `## 이어쓰기 원칙 (시/산문시)
1. 기존 리듬과 운율 패턴 유지
2. 이미지와 상징의 일관된 세계관
3. 호흡과 여백의 감각 유지
4. [미완료] 키포인트를 시적 이미지로 표현
5. 감정의 흐름과 강도를 자연스럽게 이어감`,
}

const DEFAULT_CONTINUE_PROMPT = CONTINUE_PROMPTS.nonfiction

// 공통 출력 형식 규칙
const OUTPUT_FORMAT_RULES = `

## 출력 형식 (절대 준수)

- HTML 태그를 사용하여 서식을 적용할 것
- 허용 태그: <h2>, <h3>, <p>, <strong>, <em>, <ul>, <ol>, <li>, <blockquote>
- 마크다운 기호 절대 금지 (#, *, -, \`\`\`, > 등 직접 사용 금지)
- 모든 문단은 <p> 태그로 감쌀 것
- 소제목은 <h3> 태그 사용 (챕터 제목은 별도 표시되므로 <h2>는 드물게)
- 강조할 핵심 문구는 <strong> 태그 사용
- 나열이 필요하면 <ul>/<ol> + <li> 태그 사용
- 인용구는 <blockquote> 태그 사용
- <script>, <style>, <iframe> 등 위험 태그 절대 금지`

function getWriterPrompt(bookType: string): string {
  const basePrompt = WRITER_PROMPTS[bookType] || DEFAULT_WRITER_PROMPT
  return basePrompt + OUTPUT_FORMAT_RULES
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId, error: authError } = await requireAuth()
    if (authError) return authError

    await checkQuota(userId!)

    const { id } = await params
    const body = await request.json()

    const parseResult = WriteChapterSchema.safeParse(body)
    if (!parseResult.success) {
      return new Response(
        JSON.stringify({ error: 'Invalid request body', details: parseResult.error.flatten() }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const { chapterNumber, chapterOutline, previousChapters, mode, existingContent } = parseResult.data

    const project = await prisma.project.findFirst({
      where: projectOwnerWhere(id, userId!),
      select: {
        id: true,
        title: true,
        type: true,
        targetAudience: true,
        tone: true,
        customTone: true,
        bible: true,
      }
    })

    if (!project) {
      return new Response(
        JSON.stringify({ error: 'Project not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Bible 컨텍스트 빌드
    const bible = parseBibleJson(project.bible)
    const bibleContext = buildBibleContext(bible, {
      currentChapter: chapterNumber,
      maxContextLength: 4000,
    })

    const previousContext = previousChapters.length > 0
      ? '\n\n**이전 챕터 요약:**\n' +
        previousChapters.map(ch =>
          `- ${ch.number}. ${sanitizeForPrompt(ch.title)}: ${sanitizeForPrompt(ch.summary)}`
        ).join('\n')
      : ''

    // continue 모드: 컨텍스트 + 스타일 + 키포인트 추적
    let existingContentContext = ''
    let styleContext = ''
    let keyPointContext = ''
    let continuePromptContext = ''

    if (mode === 'continue' && existingContent) {
      const context = buildContinueContext(existingContent, 4000)
      if (context.text) {
        existingContentContext = `\n\n**현재까지 작성된 내용** (총 ${context.totalLength}자, ${context.strategy === 'split' ? '앞뒤 발췌' : '전문'}):\n${sanitizeForPrompt(context.text)}`
      }

      const styleProfile = analyzeStyle(existingContent)
      styleContext = formatStyleGuide(styleProfile)
      if (styleContext) {
        styleContext = '\n\n' + styleContext
      }

      if (chapterOutline.keyPoints && chapterOutline.keyPoints.length > 0) {
        const progress = analyzeKeyPointProgress(context.text, chapterOutline.keyPoints)
        const formatted = formatKeyPointProgress(progress)
        if (formatted) {
          keyPointContext = `\n**키포인트 진행 상황:**\n${formatted}`
        }
      }

      continuePromptContext = '\n\n' + (CONTINUE_PROMPTS[project.type] || DEFAULT_CONTINUE_PROMPT)
    }

    const writeInstruction = mode === 'continue'
      ? '위 정보를 바탕으로 기존 내용에 이어서 자연스럽게 계속 작성해주세요. 기존 내용을 다시 쓰지 말고 새로운 부분만 작성하세요.'
      : '위 정보를 바탕으로 이 챕터의 본문을 작성해주세요.'

    // 문체 설명 생성
    const toneDescription = project.tone === 'custom' && project.customTone
      ? `사용자 지정 문체: ${sanitizeForPrompt(project.customTone)}`
      : sanitizeForPrompt(project.tone || '친근체')

    const prompt = `**책 제목**: ${sanitizeForPrompt(project.title)}
**책 유형**: ${project.type}
**타겟 독자**: ${sanitizeForPrompt(project.targetAudience || '일반 독자')}
**문체**: ${toneDescription}
${bibleContext}${styleContext}
${previousContext}

**현재 챕터 정보:**
- 챕터 번호: ${chapterNumber}
- 챕터 제목: ${sanitizeForPrompt(chapterOutline.title)}
- 챕터 요약: ${sanitizeForPrompt(chapterOutline.summary)}
- 핵심 포인트: ${chapterOutline.keyPoints?.map(sanitizeForPrompt).join(', ') || '없음'}${keyPointContext}
${existingContentContext}${continuePromptContext}

${writeInstruction}`

    // 스트리밍 응답 생성
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        let usage = { inputTokens: 0, outputTokens: 0 }
        try {
          const result = await streamAgent(
            {
              name: 'chapter-writer',
              systemPrompt: getWriterPrompt(project.type),
              temperature: 0.8
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
            recordUsage(userId!, 'chapter-writer', usage, id).catch(console.error)
          }
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
    if (error instanceof AppError) {
      const status = error.code === ERROR_CODES.QUOTA_EXCEEDED ? 429 : 400
      return new Response(
        JSON.stringify({ error: error.message, code: error.code }),
        { status, headers: { 'Content-Type': 'application/json' } }
      )
    }
    return new Response(
      JSON.stringify({ error: 'Failed to write chapter' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}
