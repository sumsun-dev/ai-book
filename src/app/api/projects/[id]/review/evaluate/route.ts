import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/client'
import { runAgent } from '@/lib/claude'

const CRITIC_PROMPT = `당신은 전문 출판 평론가입니다. 책 전체의 품질을 평가해주세요.

다음 기준으로 1-10점 척도로 평가해주세요:
1. **coherence (일관성)**: 전체적인 논리적 흐름과 일관성
2. **engagement (흥미도)**: 독자의 관심을 끄는 정도
3. **clarity (명확성)**: 표현의 명확성과 이해하기 쉬운 정도
4. **originality (독창성)**: 새롭고 참신한 관점이나 접근
5. **targetFit (타겟 적합도)**: 타겟 독자에게 적합한 정도

JSON 형식으로 응답해주세요:
{
  "coherence": 8,
  "engagement": 7,
  "clarity": 9,
  "originality": 7,
  "targetFit": 8,
  "feedback": "전체적인 평가와 개선 제안 (2-3문장)"
}

평가 시 다음을 고려하세요:
- 7점 이상: 출판 가능 수준
- 5-6점: 수정 필요
- 5점 미만: 대폭 수정 필요`

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // 프로젝트 및 챕터 조회
    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        chapters: {
          orderBy: { number: 'asc' }
        }
      }
    })

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      )
    }

    // 전체 콘텐츠 요약
    const contentSummary = project.chapters
      .map(ch => `## ${ch.number}. ${ch.title}\n${ch.content.substring(0, 500)}...`)
      .join('\n\n')

    // AI 평가
    const response = await runAgent(
      {
        name: 'critic',
        systemPrompt: CRITIC_PROMPT,
        temperature: 0.4
      },
      `**책 제목**: ${project.title}
**책 유형**: ${project.type}
**타겟 독자**: ${project.targetAudience || '일반 독자'}
**문체**: ${project.tone || '일반'}
**총 챕터 수**: ${project.chapters.length}

**내용 요약:**
${contentSummary}`
    )

    // JSON 파싱
    let evaluation = {
      coherence: 7,
      engagement: 7,
      clarity: 7,
      originality: 7,
      targetFit: 7,
      feedback: '평가 결과를 불러오지 못했습니다.'
    }

    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        evaluation = JSON.parse(jsonMatch[0])
      }
    } catch (parseError) {
      console.error('Failed to parse evaluation:', parseError)
    }

    // 히스토리 저장
    await prisma.editHistory.create({
      data: {
        projectId: id,
        type: 'review',
        agent: 'critic',
        afterContent: JSON.stringify(evaluation),
        feedback: evaluation.feedback
      }
    })

    return NextResponse.json({ evaluation })
  } catch (error) {
    console.error('Failed to evaluate:', error)
    return NextResponse.json(
      { error: 'Failed to evaluate' },
      { status: 500 }
    )
  }
}
