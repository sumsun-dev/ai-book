import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/client'
import { runAgent } from '@/lib/claude'
import { EditSuggestion } from '@/types/book'

const EDITOR_PROMPT = `당신은 전문 편집자입니다. 주어진 텍스트를 분석하여 개선 제안을 제공해주세요.

다음 항목들을 검토하세요:
1. **문법 (grammar)**: 맞춤법, 띄어쓰기, 문법 오류
2. **스타일 (style)**: 문체 일관성, 어색한 표현
3. **명확성 (clarity)**: 모호한 문장, 이해하기 어려운 부분
4. **구조 (structure)**: 단락 구성, 논리적 흐름
5. **내용 (content)**: 불필요한 반복, 누락된 내용

JSON 형식으로 응답해주세요:
{
  "suggestions": [
    {
      "id": "s1",
      "chapterNumber": 1,
      "originalText": "원본 텍스트 (정확하게)",
      "suggestedText": "수정 제안 텍스트",
      "reason": "수정 이유",
      "type": "grammar|style|clarity|structure|content",
      "severity": "minor|moderate|major",
      "status": "pending"
    }
  ]
}

주의사항:
- originalText는 원문에서 정확하게 찾을 수 있어야 합니다
- 최대 10개의 제안을 제공합니다
- 중요도 순으로 정렬합니다
- 한국어 텍스트에 맞는 교정을 합니다`

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { chapterNumber, content } = await request.json()

    if (!content) {
      return NextResponse.json(
        { error: 'Content is required' },
        { status: 400 }
      )
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

    // AI 분석
    const response = await runAgent(
      {
        name: 'editor',
        systemPrompt: EDITOR_PROMPT,
        temperature: 0.3
      },
      `**책 유형**: ${project.type}
**문체**: ${project.tone || '일반'}
**챕터 번호**: ${chapterNumber}

**분석할 텍스트:**
${content.substring(0, 8000)}` // 토큰 제한
    )

    // JSON 파싱
    let suggestions: EditSuggestion[] = []
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0])
        suggestions = parsed.suggestions || []
      }
    } catch (parseError) {
      console.error('Failed to parse editor response:', parseError)
    }

    return NextResponse.json({ suggestions })
  } catch (error) {
    console.error('Failed to analyze:', error)
    return NextResponse.json(
      { error: 'Failed to analyze' },
      { status: 500 }
    )
  }
}
