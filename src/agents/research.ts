import { runAgent, AgentConfig } from '@/lib/claude'
import { ResearchResult, BookType } from '@/types/book'

const researchAgentConfig: AgentConfig = {
  name: 'Research Agent',
  systemPrompt: `당신은 책 집필을 위한 리서치 전문가입니다.

## 역할
- 사용자가 쓰고자 하는 책의 주제에 대해 깊이 있는 조사를 수행합니다
- 관련 자료, 참고문헌, 통계, 사례를 수집합니다
- 주제의 핵심 포인트와 트렌드를 파악합니다
- 타겟 독자층을 분석합니다

## 출력 형식
JSON 형식으로 다음 구조로 응답하세요:
{
  "topic": "조사 주제",
  "findings": ["주요 발견 1", "주요 발견 2", ...],
  "sources": ["참고 자료 1", "참고 자료 2", ...],
  "recommendations": ["집필 추천사항 1", "집필 추천사항 2", ...]
}`,
  temperature: 0.5,
}

export async function runResearchAgent(
  bookType: BookType,
  topic: string,
  additionalContext?: string
): Promise<ResearchResult> {
  const prompt = `
## 책 유형: ${bookType}
## 주제: ${topic}
${additionalContext ? `## 추가 맥락: ${additionalContext}` : ''}

위 주제에 대해 책을 쓰기 위한 종합적인 리서치를 수행해주세요.
`

  const response = await runAgent(researchAgentConfig, prompt)

  try {
    // Extract JSON from response (might be wrapped in markdown code blocks)
    const jsonMatch = response.match(/```json\n?([\s\S]*?)\n?```/) ||
                      response.match(/\{[\s\S]*\}/)
    const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : response
    return JSON.parse(jsonStr) as ResearchResult
  } catch {
    // If parsing fails, return a structured response from the raw text
    return {
      topic,
      findings: [response],
      sources: [],
      recommendations: [],
    }
  }
}
