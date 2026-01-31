import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/client'
import { runAgent } from '@/lib/claude'
import { AIQuestion, UserAnswer } from '@/types/book'

const PLAN_GENERATION_PROMPT = `당신은 전문 출판 기획자입니다. 저자의 아이디어와 질문 답변을 분석하여 책의 전체적인 계획을 수립해주세요.

다음 요소들을 포함한 종합적인 계획을 작성해주세요:

1. **책 개요**: 핵심 콘셉트와 차별화 포인트
2. **타겟 독자**: 구체적인 독자층과 그들의 니즈
3. **핵심 메시지**: 책이 전달하고자 하는 주요 메시지 3-5가지
4. **예상 구조**: 대략적인 파트/챕터 구성
5. **문체 가이드**: 권장하는 어투와 표현 스타일
6. **주의사항**: 집필 시 피해야 할 점이나 유의사항

한국어로 명확하고 구체적으로 작성해주세요. 저자가 이 계획을 바탕으로 목차를 설계할 수 있도록 도와주세요.`

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { initialIdea, questions, answers } = await request.json() as {
      initialIdea: string
      questions: AIQuestion[]
      answers: UserAnswer[]
    }

    // 프로젝트 정보 조회
    const project = await prisma.project.findUnique({
      where: { id }
    })

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      )
    }

    // Q&A 컨텍스트 구성
    const qaContext = questions.map((q, i) => {
      const answer = answers.find(a => a.questionId === q.id)
      return `Q: ${q.question}\nA: ${answer?.answer || '(미답변)'}`
    }).join('\n\n')

    // AI로 계획 생성
    const response = await runAgent(
      {
        name: 'research-planner',
        systemPrompt: PLAN_GENERATION_PROMPT,
        temperature: 0.6
      },
      `**책 유형**: ${project.type}
**초기 아이디어**: ${initialIdea}

**질문과 답변**:
${qaContext}`
    )

    // ResearchData 업데이트
    await prisma.researchData.update({
      where: { projectId: id },
      data: {
        userAnswers: JSON.stringify(answers),
        findings: JSON.stringify(response)
      }
    })

    // 프로젝트 상태 업데이트
    await prisma.project.update({
      where: { id },
      data: { status: 'researching' }
    })

    return NextResponse.json({ summary: response })
  } catch (error) {
    console.error('Failed to generate plan:', error)
    return NextResponse.json(
      { error: 'Failed to generate plan' },
      { status: 500 }
    )
  }
}
