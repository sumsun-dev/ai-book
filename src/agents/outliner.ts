import { runAgent, AgentConfig } from '@/lib/claude'
import { BookOutline, BookType, ResearchResult } from '@/types/book'

const outlinerAgentConfig: AgentConfig = {
  name: 'Outliner Agent',
  systemPrompt: `당신은 책의 구조를 설계하는 전문가입니다.

## 역할
- 리서치 결과를 바탕으로 책의 전체 구조를 설계합니다
- 논리적이고 흡입력 있는 챕터 구성을 만듭니다
- 각 챕터의 핵심 포인트를 정리합니다
- 독자의 여정을 고려한 흐름을 설계합니다

## 출력 형식
JSON 형식으로 다음 구조로 응답하세요:
{
  "synopsis": "책의 전체 개요 (2-3문장)",
  "chapters": [
    {
      "number": 1,
      "title": "챕터 제목",
      "summary": "챕터 요약",
      "keyPoints": ["핵심 포인트 1", "핵심 포인트 2"]
    }
  ],
  "estimatedPages": 예상 페이지 수,
  "targetAudience": "타겟 독자",
  "tone": "문체/톤"
}`,
  temperature: 0.6,
}

export async function runOutlinerAgent(
  bookType: BookType,
  title: string,
  description: string,
  research: ResearchResult
): Promise<BookOutline> {
  const prompt = `
## 책 유형: ${bookType}
## 제목: ${title}
## 설명: ${description}

## 리서치 결과:
${JSON.stringify(research, null, 2)}

위 정보를 바탕으로 책의 상세한 아웃라인을 작성해주세요.
`

  const response = await runAgent(outlinerAgentConfig, prompt)

  try {
    const jsonMatch = response.match(/```json\n?([\s\S]*?)\n?```/) ||
                      response.match(/\{[\s\S]*\}/)
    const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : response
    return JSON.parse(jsonStr) as BookOutline
  } catch {
    return {
      synopsis: description,
      chapters: [{
        number: 1,
        title: '서론',
        summary: response,
        keyPoints: [],
      }],
      estimatedPages: 100,
      targetAudience: '일반 독자',
      tone: '친근한',
    }
  }
}
