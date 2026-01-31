import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/client'
import { runAgent } from '@/lib/claude'
import { AIQuestion } from '@/types/book'

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

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { initialIdea } = await request.json()

    if (!initialIdea) {
      return NextResponse.json(
        { error: 'Initial idea is required' },
        { status: 400 }
      )
    }

    // 프로젝트 존재 확인
    const project = await prisma.project.findUnique({
      where: { id }
    })

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      )
    }

    // AI로 질문 생성
    const response = await runAgent(
      {
        name: 'research-questioner',
        systemPrompt: QUESTION_GENERATION_PROMPT,
        temperature: 0.7
      },
      `저자의 책 아이디어:\n${initialIdea}\n\n책 유형: ${project.type}`
    )

    // JSON 파싱
    let questions: AIQuestion[] = []
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0])
        questions = parsed.questions
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError)
      // 기본 질문 제공
      questions = [
        { id: 'q1', question: '이 책의 주요 독자층은 누구인가요?', category: 'audience', priority: 1 },
        { id: 'q2', question: '독자들이 이 책을 통해 얻기를 바라는 것은 무엇인가요?', category: 'theme', priority: 2 },
        { id: 'q3', question: '책의 예상 분량은 어느 정도인가요?', category: 'structure', priority: 3 },
        { id: 'q4', question: '어떤 문체로 글을 쓰고 싶으신가요? (예: 격식체, 친근한 대화체 등)', category: 'style', priority: 4 },
        { id: 'q5', question: '반드시 다루어야 할 핵심 내용이나 챕터가 있나요?', category: 'content', priority: 5 }
      ]
    }

    // ResearchData 저장 또는 업데이트
    await prisma.researchData.upsert({
      where: { projectId: id },
      create: {
        projectId: id,
        initialIdea,
        aiQuestions: JSON.stringify(questions),
        userAnswers: '[]',
        findings: '',
        references: '[]'
      },
      update: {
        initialIdea,
        aiQuestions: JSON.stringify(questions)
      }
    })

    return NextResponse.json({ questions })
  } catch (error) {
    console.error('Failed to generate questions:', error)
    return NextResponse.json(
      { error: 'Failed to generate questions' },
      { status: 500 }
    )
  }
}
