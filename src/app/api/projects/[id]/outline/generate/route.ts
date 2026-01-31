import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/client'
import { runAgent } from '@/lib/claude'
import { BookOutline, ChapterOutline } from '@/types/book'

const OUTLINE_GENERATION_PROMPT = `당신은 전문 출판 편집자입니다. 저자의 책 정보와 리서치 결과를 바탕으로 상세한 책 목차를 설계해주세요.

다음 형식으로 JSON 응답을 제공해주세요:
{
  "synopsis": "책의 전체 개요 (2-3문장)",
  "chapters": [
    {
      "number": 1,
      "title": "챕터 제목",
      "summary": "챕터 요약 (1-2문장)",
      "keyPoints": ["핵심 포인트 1", "핵심 포인트 2"],
      "sections": [
        {
          "id": "1-1",
          "title": "섹션 제목",
          "summary": "섹션 요약",
          "estimatedWords": 2000
        }
      ]
    }
  ],
  "estimatedPages": 200,
  "targetAudience": "타겟 독자 설명",
  "tone": "문체 설명"
}

목차 설계 시 다음 사항을 고려하세요:
1. 타겟 독자의 수준과 관심사
2. 목표 분량에 맞는 챕터 수 (50-100페이지: 5-7챕터, 200페이지: 10-12챕터, 300페이지+: 15챕터 이상)
3. 논리적인 흐름과 학습 곡선
4. 각 챕터의 균형잡힌 분량
5. 독자의 흥미를 유지할 수 있는 구성`

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { targetAudience, targetLength, tone } = await request.json()

    // 프로젝트 및 리서치 데이터 조회
    const project = await prisma.project.findUnique({
      where: { id },
      include: { researchData: true }
    })

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      )
    }

    // 리서치 컨텍스트 구성
    let researchContext = ''
    if (project.researchData) {
      const findings = project.researchData.findings
      researchContext = `
리서치 결과:
- 초기 아이디어: ${project.researchData.initialIdea}
- 분석 결과: ${findings}
`
    }

    // AI로 목차 생성
    const response = await runAgent(
      {
        name: 'outline-generator',
        systemPrompt: OUTLINE_GENERATION_PROMPT,
        temperature: 0.7
      },
      `**책 제목**: ${project.title}
**책 유형**: ${project.type}
**책 설명**: ${project.description}
**타겟 독자**: ${targetAudience}
**목표 분량**: ${targetLength}페이지
**문체**: ${tone}
${researchContext}`
    )

    // JSON 파싱
    let outline: BookOutline
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        outline = JSON.parse(jsonMatch[0])
      } else {
        throw new Error('No JSON found in response')
      }
    } catch (parseError) {
      console.error('Failed to parse outline:', parseError)
      // 기본 목차 제공
      outline = {
        synopsis: `${project.title}은(는) ${targetAudience}를 위한 ${project.type} 도서입니다.`,
        chapters: [
          { number: 1, title: '시작하며', summary: '책의 소개와 목적', keyPoints: [], sections: [] },
          { number: 2, title: '기본 개념', summary: '핵심 개념 설명', keyPoints: [], sections: [] },
          { number: 3, title: '심화 내용', summary: '상세한 내용 탐구', keyPoints: [], sections: [] },
          { number: 4, title: '실전 적용', summary: '실제 사례와 적용', keyPoints: [], sections: [] },
          { number: 5, title: '마무리', summary: '정리 및 다음 단계', keyPoints: [], sections: [] }
        ],
        estimatedPages: targetLength,
        targetAudience,
        tone
      }
    }

    // 프로젝트 업데이트
    await prisma.project.update({
      where: { id },
      data: {
        outline: JSON.stringify(outline),
        targetAudience,
        targetLength,
        tone,
        status: 'outlining'
      }
    })

    return NextResponse.json({ outline })
  } catch (error) {
    console.error('Failed to generate outline:', error)
    return NextResponse.json(
      { error: 'Failed to generate outline' },
      { status: 500 }
    )
  }
}
