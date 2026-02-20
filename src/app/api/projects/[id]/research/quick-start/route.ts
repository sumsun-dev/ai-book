import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, projectOwnerWhere } from '@/lib/auth/auth-utils'
import { handleApiError } from '@/lib/api-utils'
import { prisma } from '@/lib/db/client'
import { runAgent } from '@/lib/claude'
import { AIQuestion, UserAnswer } from '@/types/book'
import { checkQuota, recordUsage } from '@/lib/token-quota'

const QUESTION_GENERATION_PROMPT = `당신은 전문 출판 컨설턴트입니다. 저자가 제시한 책 아이디어를 바탕으로, 책의 방향을 구체화하기 위한 핵심 질문들을 생성해주세요.

다음 카테고리별로 질문을 생성해주세요:
1. audience (타겟 독자): 누가 이 책을 읽을 것인가?
2. theme (핵심 주제): 책의 핵심 메시지는 무엇인가?
3. structure (구조): 어떤 형식과 구조가 적합한가?
4. style (문체): 어떤 톤과 스타일로 쓸 것인가?
5. content (내용): 반드시 포함해야 할 내용은 무엇인가?

JSON 형식으로 응답해주세요:
{
  "questions": [
    {
      "id": "q1",
      "question": "질문 내용",
      "category": "audience|theme|structure|style|content",
      "priority": 1-5
    }
  ]
}

총 5-7개의 질문을 생성해주세요. 질문은 한국어로 작성하고, 저자가 쉽게 답할 수 있도록 구체적으로 작성해주세요.`

const AUTO_ANSWER_PROMPT = `당신은 전문 출판 컨설턴트입니다. 저자의 초기 아이디어를 바탕으로, 아래 질문들에 대해 합리적이고 구체적인 답변을 생성해주세요.

저자의 아이디어에서 추론할 수 있는 내용을 바탕으로 답변하되, 창의적이면서도 현실적인 답변을 작성해주세요.

JSON 형식으로 응답해주세요:
{
  "answers": [
    {
      "questionId": "질문 ID",
      "answer": "답변 내용"
    }
  ]
}

각 답변은 2-4문장으로 구체적으로 작성해주세요. 한국어로 작성해주세요.`

const PLAN_GENERATION_PROMPT = `당신은 전문 출판 기획자입니다. 저자의 아이디어와 질문 답변을 분석하여 책의 전체적인 계획을 수립해주세요.

다음 요소들을 포함한 종합적인 계획을 작성해주세요:

1. **책 개요**: 핵심 콘셉트와 차별화 포인트
2. **타겟 독자**: 구체적인 독자층과 그들의 니즈
3. **핵심 메시지**: 책이 전달하고자 하는 주요 메시지 3-5가지
4. **예상 구조**: 대략적인 파트/챕터 구성
5. **문체 가이드**: 권장하는 어투와 표현 스타일
6. **주의사항**: 집필 시 피해야 할 점이나 유의사항

한국어로 명확하고 구체적으로 작성해주세요. 저자가 이 계획을 바탕으로 목차를 설계할 수 있도록 도와주세요.`

const FALLBACK_QUESTIONS: AIQuestion[] = [
  { id: 'q1', question: '이 책의 주요 독자층은 누구인가요?', category: 'audience', priority: 1 },
  { id: 'q2', question: '독자들이 이 책을 통해 얻기를 바라는 것은 무엇인가요?', category: 'theme', priority: 2 },
  { id: 'q3', question: '책의 예상 분량은 어느 정도인가요?', category: 'structure', priority: 3 },
  { id: 'q4', question: '어떤 문체로 글을 쓰고 싶으신가요?', category: 'style', priority: 4 },
  { id: 'q5', question: '반드시 다루어야 할 핵심 내용이나 챕터가 있나요?', category: 'content', priority: 5 },
]

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId, error: authError } = await requireAuth()
    if (authError) return authError

    await checkQuota(userId!)

    const { id } = await params
    const { initialIdea } = await request.json()

    if (!initialIdea) {
      return NextResponse.json(
        { error: 'Initial idea is required' },
        { status: 400 }
      )
    }

    const project = await prisma.project.findFirst({
      where: projectOwnerWhere(id, userId!),
    })

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      )
    }

    // Step 1: 질문 생성
    let questions: AIQuestion[] = []
    try {
      const questionResult = await runAgent(
        {
          name: 'research-questioner',
          systemPrompt: QUESTION_GENERATION_PROMPT,
          temperature: 0.7,
        },
        `저자의 책 아이디어:\n${initialIdea}\n\n책 유형: ${project.type}`
      )

      recordUsage(userId!, 'research-questioner', questionResult.usage, id).catch(console.error)

      const jsonMatch = questionResult.text.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0])
        questions = parsed.questions
      }
    } catch {
      // fallback
    }

    if (questions.length === 0) {
      questions = FALLBACK_QUESTIONS
    }

    // Step 2: AI 답변 생성
    let answers: UserAnswer[] = []
    try {
      const questionsContext = questions
        .map((q) => `- [${q.id}] ${q.question} (${q.category})`)
        .join('\n')

      const answerResult = await runAgent(
        {
          name: 'research-auto-answerer',
          systemPrompt: AUTO_ANSWER_PROMPT,
          temperature: 0.7,
        },
        `저자의 책 아이디어:\n${initialIdea}\n\n책 유형: ${project.type}\n\n질문 목록:\n${questionsContext}`
      )

      recordUsage(userId!, 'research-auto-answerer', answerResult.usage, id).catch(console.error)

      const jsonMatch = answerResult.text.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0])
        answers = parsed.answers.map((a: { questionId: string; answer: string }) => ({
          questionId: a.questionId,
          answer: a.answer,
          timestamp: new Date(),
          source: 'ai' as const,
        }))
      }
    } catch {
      // fallback
    }

    if (answers.length === 0) {
      answers = questions.map((q) => ({
        questionId: q.id,
        answer: `"${initialIdea}" 주제에 대해 AI가 자동 생성한 답변입니다.`,
        timestamp: new Date(),
        source: 'ai' as const,
      }))
    }

    // Step 3: 계획 수립
    const qaContext = questions
      .map((q) => {
        const answer = answers.find((a) => a.questionId === q.id)
        return `Q: ${q.question}\nA: ${answer?.answer || '(미답변)'}`
      })
      .join('\n\n')

    const planResult = await runAgent(
      {
        name: 'research-planner',
        systemPrompt: PLAN_GENERATION_PROMPT,
        temperature: 0.6,
      },
      `**책 유형**: ${project.type}\n**초기 아이디어**: ${initialIdea}\n\n**질문과 답변**:\n${qaContext}`
    )
    const planResponse = planResult.text
    recordUsage(userId!, 'research-planner', planResult.usage, id).catch(console.error)

    // DB 저장
    await prisma.researchData.upsert({
      where: { projectId: id },
      create: {
        projectId: id,
        initialIdea,
        aiQuestions: JSON.stringify(questions),
        userAnswers: JSON.stringify(answers),
        findings: JSON.stringify(planResponse),
        references: '[]',
      },
      update: {
        initialIdea,
        aiQuestions: JSON.stringify(questions),
        userAnswers: JSON.stringify(answers),
        findings: JSON.stringify(planResponse),
      },
    })

    await prisma.project.update({
      where: { id },
      data: { status: 'researching' },
    })

    return NextResponse.json({
      questions,
      answers,
      summary: planResponse,
    })
  } catch (error) {
    return handleApiError(error, { route: 'projects/[id]/research/quick-start', method: 'POST' })
  }
}
