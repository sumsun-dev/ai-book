import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/client'
import { runAgent } from '@/lib/claude'
import { BookOutline } from '@/types/book'

const BOOK_TYPE_GUIDELINES: Record<string, string> = {
  'practical': `
## 실용서/자기계발서 목차 설계 원칙
1. **문제-해결 구조**: 독자의 고민 → 원인 분석 → 해결책 제시 → 실행 방법
2. **단계별 진행**: 쉬운 것에서 어려운 것으로, 기초에서 심화로
3. **실행 중심**: 각 챕터마다 즉시 적용 가능한 액션 아이템 포함
4. **사례 활용**: 실제 사례, 체크리스트, 워크시트 배치 고려
5. **동기부여**: 중간중간 성취감을 느낄 수 있는 마일스톤 배치`,

  'essay': `
## 에세이/수필 목차 설계 원칙
1. **감성적 흐름**: 주제별 묶음보다 감정/분위기의 자연스러운 흐름
2. **개인 경험**: 저자의 관점과 경험이 중심이 되는 구성
3. **여백의 미**: 짧은 챕터, 호흡 있는 구성
4. **연결고리**: 챕터 간 느슨하지만 자연스러운 연결
5. **여운**: 독자가 생각할 거리를 남기는 마무리`,

  'novel': `
## 소설/창작 목차 설계 원칙
1. **서사 구조**: 발단-전개-위기-절정-결말의 극적 흐름
2. **캐릭터 아크**: 주인공의 성장과 변화 곡선 반영
3. **갈등 배치**: 챕터마다 소규모 갈등, 전체적으로 대규모 갈등
4. **페이스 조절**: 액션과 휴식의 균형, 긴장과 이완의 리듬
5. **복선과 반전**: 독자의 기대를 조절하는 구조`,

  'technical': `
## 기술서/전문서 목차 설계 원칙
1. **선수 지식 체계**: 필요한 사전 지식을 앞에 배치
2. **개념-실습 순환**: 이론 설명 후 실습, 예제 코드 포함
3. **점진적 복잡도**: 기초 → 중급 → 고급 난이도 상승
4. **참조 용이성**: 독자가 필요한 부분만 찾아볼 수 있는 구조
5. **부록 활용**: 설치 가이드, API 레퍼런스, 트러블슈팅 분리`,

  'academic': `
## 학술서/교양서 목차 설계 원칙
1. **논증 구조**: 주장-근거-반론-재반론의 논리적 흐름
2. **역사적 맥락**: 과거에서 현재로, 또는 현재의 뿌리 탐구
3. **다양한 관점**: 여러 시각과 이론의 균형 있는 배치
4. **심화 경로**: 기본 독자와 전문 독자를 위한 이중 구조
5. **참고문헌**: 각 챕터별 더 읽을 거리 제안`,

  'biography': `
## 전기/자서전 목차 설계 원칙
1. **시간순 vs 주제순**: 연대기적 서술 또는 주제별 묶음 선택
2. **터닝 포인트**: 인생의 결정적 순간들을 중심으로 구성
3. **시대적 배경**: 개인 이야기와 시대 상황의 교차
4. **인간적 면모**: 성공뿐 아니라 실패와 고뇌도 포함
5. **교훈과 영감**: 독자가 배울 수 있는 메시지`,

  'default': `
## 일반 목차 설계 원칙
1. **논리적 흐름**: 서론-본론-결론의 기본 구조 유지
2. **독자 여정**: 호기심 유발 → 지식 전달 → 활용 방안
3. **균형**: 각 챕터의 분량과 중요도 균형
4. **독립성과 연결성**: 개별 챕터로도, 전체로도 의미 있게
5. **마무리**: 전체를 정리하고 다음 단계를 제시`
}

const OUTLINE_GENERATION_PROMPT = `당신은 20년 경력의 출판 편집자이자 베스트셀러 기획자입니다.
저자의 아이디어를 독자를 사로잡는 책으로 만드는 전문가입니다.

## 역할
- 저자의 원고 방향을 파악하고 최적의 책 구조를 설계합니다
- 독자의 관점에서 읽고 싶은 목차를 만듭니다
- 시장성과 완성도를 모두 고려합니다

## 목차 설계 프로세스
1. **독자 분석**: 타겟 독자가 무엇을 원하고, 어떤 수준인지 파악
2. **핵심 메시지**: 이 책이 전달할 가장 중요한 1가지 메시지 정의
3. **구조 설계**: 메시지를 가장 효과적으로 전달할 챕터 구성
4. **밸런스 조정**: 분량, 난이도, 흥미도의 균형 맞추기

## 출력 형식 (반드시 유효한 JSON)
{
  "synopsis": "책의 핵심 가치와 독자에게 주는 약속 (2-3문장)",
  "chapters": [
    {
      "number": 1,
      "title": "흥미를 끄는 챕터 제목",
      "summary": "이 챕터에서 독자가 얻을 것 (1-2문장)",
      "keyPoints": ["핵심 포인트 1", "핵심 포인트 2", "핵심 포인트 3"],
      "sections": [
        {
          "id": "1-1",
          "title": "섹션 제목",
          "summary": "섹션 내용 요약",
          "estimatedWords": 2000
        }
      ]
    }
  ],
  "estimatedPages": 200,
  "targetAudience": "타겟 독자 상세 설명",
  "tone": "문체 설명"
}

## 챕터 수 가이드라인
- 50-100 페이지: 4-6개 챕터 (소책자, 집중 주제)
- 150-250 페이지: 8-12개 챕터 (일반 단행본)
- 300-400 페이지: 12-16개 챕터 (전문서, 종합 가이드)
- 450+ 페이지: 15-20개 챕터 (대작, 시리즈물)

## 좋은 챕터 제목의 조건
- 호기심 유발: "왜 ~할까?" "~의 비밀" "~하는 법"
- 구체적: 막연한 표현보다 명확한 주제
- 일관성: 전체 목차의 톤 & 매너 통일
- 독립성: 제목만 봐도 내용 예측 가능`

function detectBookType(type: string, description: string): string {
  const lowerType = type.toLowerCase()
  const lowerDesc = description.toLowerCase()

  if (lowerType.includes('실용') || lowerType.includes('자기계발') || lowerDesc.includes('방법') || lowerDesc.includes('노하우')) {
    return 'practical'
  }
  if (lowerType.includes('에세이') || lowerType.includes('수필')) {
    return 'essay'
  }
  if (lowerType.includes('소설') || lowerType.includes('창작') || lowerType.includes('픽션')) {
    return 'novel'
  }
  if (lowerType.includes('기술') || lowerType.includes('개발') || lowerType.includes('프로그래밍')) {
    return 'technical'
  }
  if (lowerType.includes('학술') || lowerType.includes('교양') || lowerType.includes('인문')) {
    return 'academic'
  }
  if (lowerType.includes('전기') || lowerType.includes('자서전') || lowerType.includes('인물')) {
    return 'biography'
  }
  return 'default'
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { targetAudience, targetLength, tone } = await request.json()

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

    // 책 유형 감지 및 가이드라인 선택
    const bookType = detectBookType(project.type, project.description)
    const typeGuidelines = BOOK_TYPE_GUIDELINES[bookType] || BOOK_TYPE_GUIDELINES['default']

    // 리서치 컨텍스트 구성
    let researchContext = ''
    if (project.researchData) {
      const findings = project.researchData.findings
      researchContext = `
## 리서치 결과
**초기 아이디어**: ${project.researchData.initialIdea}

**심층 분석 결과**:
${findings}

이 리서치 결과를 바탕으로 책의 방향과 구조를 설계해주세요.
`
    }

    // 문체 가이드
    const toneGuides: Record<string, string> = {
      'formal': '격식체 - 정중하고 권위 있는 어조로 독자를 존중하며 전문성을 드러내는 방식',
      'casual': '친근체 - 친구에게 이야기하듯 편안하고 따뜻한 어조로 공감대를 형성하는 방식',
      'academic': '학술체 - 논리적이고 객관적인 어조로 근거를 바탕으로 설득하는 방식',
      'narrative': '서술체 - 이야기를 들려주듯 몰입감 있게 전개하는 방식',
      'motivational': '동기부여체 - 독자를 격려하고 행동하게 만드는 에너지 있는 방식'
    }
    const toneGuide = toneGuides[tone as string] || '일반적인 문체'

    const systemPrompt = `${OUTLINE_GENERATION_PROMPT}

${typeGuidelines}`

    const userPrompt = `# 책 정보

**제목**: ${project.title}
**장르/유형**: ${project.type}
**설명**: ${project.description}

# 설정

**타겟 독자**: ${targetAudience}
**목표 분량**: ${targetLength}페이지
**문체**: ${toneGuide}

${researchContext}

---

위 정보를 바탕으로 독자를 사로잡을 수 있는 최적의 책 목차를 설계해주세요.
반드시 유효한 JSON 형식으로 응답해주세요.`

    const response = await runAgent(
      {
        name: 'outline-generator',
        systemPrompt,
        temperature: 0.7
      },
      userPrompt
    )

    // JSON 파싱
    let outline: BookOutline
    try {
      // 마크다운 코드 블록 제거
      let jsonStr = response
        .replace(/```json\s*/gi, '')
        .replace(/```\s*/g, '')
        .trim()

      // JSON 객체 추출
      const jsonMatch = jsonStr.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        throw new Error('No JSON found in response')
      }

      jsonStr = jsonMatch[0]

      // 잘린 JSON 복구 시도 - 닫히지 않은 배열/객체 처리
      let openBraces = 0
      let openBrackets = 0
      for (const char of jsonStr) {
        if (char === '{') openBraces++
        if (char === '}') openBraces--
        if (char === '[') openBrackets++
        if (char === ']') openBrackets--
      }

      // 닫히지 않은 괄호 추가
      jsonStr += ']'.repeat(Math.max(0, openBrackets))
      jsonStr += '}'.repeat(Math.max(0, openBraces))

      // trailing comma 제거
      jsonStr = jsonStr.replace(/,\s*([}\]])/g, '$1')

      outline = JSON.parse(jsonStr)

      // 필수 필드 검증
      if (!outline.chapters || !Array.isArray(outline.chapters) || outline.chapters.length === 0) {
        throw new Error('Invalid outline structure: missing chapters')
      }
    } catch (parseError) {
      console.error('Failed to parse outline:', parseError)
      console.error('Raw response (first 500 chars):', response.substring(0, 500))
      // 기본 목차 제공
      const chapterCount = Math.max(5, Math.floor(targetLength / 25))
      outline = {
        synopsis: `${project.title}은(는) ${targetAudience}를 위한 ${project.type} 도서입니다. 이 책을 통해 독자들은 새로운 관점과 실질적인 도움을 얻게 될 것입니다.`,
        chapters: Array.from({ length: Math.min(chapterCount, 15) }, (_, i) => ({
          number: i + 1,
          title: `챕터 ${i + 1}`,
          summary: '',
          keyPoints: [],
          sections: []
        })),
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
