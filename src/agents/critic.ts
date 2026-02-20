import { runAgent, AgentConfig } from '@/lib/claude'
import { mergeCriticConfig } from '@/lib/agent-config'
import type { CriticConfig } from '@/types/book'

type CriticDecision = 'pass' | 'revise'

interface CriticResult {
  decision: CriticDecision
  overallScore: number
  scores: {
    coherence: number
    engagement: number
    clarity: number
    originality: number
    targetFit: number
  }
  strengths: string[]
  weaknesses: string[]
  revisionSuggestions: string[]
}

const criticAgentConfig: AgentConfig = {
  name: 'Critic Agent',
  systemPrompt: `당신은 엄격하지만 건설적인 문학 비평가입니다.

## 역할
- 작성된 내용의 품질을 평가합니다
- 강점과 약점을 명확히 파악합니다
- Pass 또는 Revise 결정을 내립니다
- 구체적인 개선 방향을 제시합니다

## 평가 기준 (각 1-10점)
1. 일관성 (coherence): 논리적 흐름과 구조
2. 몰입도 (engagement): 독자의 관심 유지
3. 명확성 (clarity): 표현의 명료함
4. 독창성 (originality): 신선한 관점과 표현
5. 타겟 적합성 (targetFit): 대상 독자층에 맞는지

## 결정 기준
- 평균 7점 이상: PASS
- 평균 7점 미만: REVISE

## 출력 형식
JSON 형식으로 응답하세요:
{
  "decision": "pass" 또는 "revise",
  "overallScore": 종합점수(1-10),
  "scores": {
    "coherence": 점수,
    "engagement": 점수,
    "clarity": 점수,
    "originality": 점수,
    "targetFit": 점수
  },
  "strengths": ["강점 1", "강점 2", ...],
  "weaknesses": ["약점 1", "약점 2", ...],
  "revisionSuggestions": ["수정 제안 1", "수정 제안 2", ...]
}`,
  temperature: 0.4,
}

export async function runCriticAgent(
  content: string,
  chapterTitle: string,
  targetAudience: string,
  expectedTone: string,
  customConfig?: Partial<CriticConfig>
): Promise<CriticResult> {
  const prompt = `
## 챕터 제목: ${chapterTitle}
## 타겟 독자: ${targetAudience}
## 기대 톤: ${expectedTone}

## 평가 대상 내용:
${content}

위 내용을 종합적으로 평가해주세요.
`

  const config = customConfig
    ? mergeCriticConfig(criticAgentConfig, customConfig)
    : criticAgentConfig

  const agentResult = await runAgent(config, prompt)
  const response = agentResult.text

  try {
    const jsonMatch = response.match(/```json\n?([\s\S]*?)\n?```/) ||
                      response.match(/\{[\s\S]*\}/)
    const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : response
    const parsed = JSON.parse(jsonStr) as CriticResult
    return Object.assign(parsed, { _usage: agentResult.usage })
  } catch {
    const fallback: CriticResult = {
      decision: 'pass',
      overallScore: 7,
      scores: {
        coherence: 7,
        engagement: 7,
        clarity: 7,
        originality: 7,
        targetFit: 7,
      },
      strengths: [],
      weaknesses: [],
      revisionSuggestions: [response],
    }
    return Object.assign(fallback, { _usage: agentResult.usage })
  }
}
