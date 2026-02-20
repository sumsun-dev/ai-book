import { runAgent, AgentConfig } from '@/lib/claude'

// ============================================================================
// Types
// ============================================================================

export type CorrectionCategory =
  | 'spelling'      // 맞춤법
  | 'grammar'       // 문법
  | 'punctuation'   // 구두점
  | 'word_choice'   // 어휘 선택
  | 'sentence_flow' // 문장 흐름
  | 'style'         // 문체

export type CorrectionSeverity = 'minor' | 'moderate' | 'major'

export interface DetailedCorrection {
  location: string          // 위치 (예: "2번째 문단, 3번째 문장")
  original: string          // 원문
  corrected: string         // 수정문
  category: CorrectionCategory
  severity: CorrectionSeverity
  reason: string            // 수정 이유
}

export interface GrammarCheckResult {
  totalErrors: number
  errorsByCategory: Record<CorrectionCategory, number>
  corrections: DetailedCorrection[]
}

export type QualityDecision = 'pass' | 'revise'

export interface QualityScores {
  grammar: number           // 문법/맞춤법 (1-10)
  clarity: number           // 명확성 (1-10)
  coherence: number         // 일관성 (1-10)
  engagement: number        // 몰입도 (1-10)
  targetFit: number         // 타겟 적합성 (1-10)
}

export interface QualityEvaluation {
  decision: QualityDecision
  overallScore: number
  scores: QualityScores
  strengths: string[]
  weaknesses: string[]
  priorityRevisions: string[]  // 우선순위가 높은 수정 사항
}

export interface EditorCriticResult {
  editedContent: string
  grammarCheck: GrammarCheckResult
  qualityEvaluation: QualityEvaluation
  iterationCount: number
  finalStatus: 'passed' | 'max_iterations_reached' | 'single_pass'
}

export interface FeedbackLoopOptions {
  maxIterations?: number      // 최대 반복 횟수 (기본값: 3)
  passThreshold?: number      // 통과 기준 점수 (기본값: 7)
  onIteration?: (iteration: number, result: EditorCriticResult) => void
}

// ============================================================================
// Agent Configurations
// ============================================================================

const editorCriticAgentConfig: AgentConfig = {
  name: 'Editor-Critic Agent',
  systemPrompt: `당신은 전문 편집자이자 문학 비평가입니다. 편집과 품질 평가를 동시에 수행합니다.

## 1. 편집 역할 (Editor)

### 문법/맞춤법 검사
- 한글 맞춤법 오류를 찾아 수정합니다
- 띄어쓰기 오류를 수정합니다
- 문법적 오류를 교정합니다
- 구두점 사용을 검토합니다

### 문장 교정
- 어색한 문장을 자연스럽게 다듬습니다
- 중복되는 표현을 제거합니다
- 문체의 일관성을 유지합니다
- 불필요한 수식어를 정리합니다

### 수정 분류
각 수정사항은 다음 카테고리로 분류합니다:
- spelling: 맞춤법 오류
- grammar: 문법 오류
- punctuation: 구두점 오류
- word_choice: 부적절한 어휘 선택
- sentence_flow: 문장 흐름 문제
- style: 문체 불일치

### 심각도 분류
- minor: 경미한 오류 (의미 전달에 영향 없음)
- moderate: 중간 수준 (가독성에 영향)
- major: 심각한 오류 (의미 왜곡 가능)

## 2. 비평 역할 (Critic)

### 품질 평가 기준 (각 1-10점)
1. grammar (문법/맞춤법): 언어적 정확성
2. clarity (명확성): 의미 전달의 명료함
3. coherence (일관성): 논리적 흐름
4. engagement (몰입도): 독자 관심 유지
5. targetFit (타겟 적합성): 대상 독자에 적합한지

### 결정 기준
- 평균 7점 이상: PASS (통과)
- 평균 7점 미만: REVISE (수정 필요)

## 3. 지침
- 원작자의 의도와 스타일을 최대한 존중합니다
- 수정은 필요한 경우에만 수행합니다
- 각 수정에 명확한 이유를 제시합니다
- 우선순위가 높은 수정사항을 구분합니다

## 4. 출력 형식
반드시 아래 JSON 형식으로만 응답하세요:
{
  "editedContent": "교정된 전체 내용",
  "grammarCheck": {
    "totalErrors": 발견된 총 오류 수,
    "errorsByCategory": {
      "spelling": 수,
      "grammar": 수,
      "punctuation": 수,
      "word_choice": 수,
      "sentence_flow": 수,
      "style": 수
    },
    "corrections": [
      {
        "location": "위치 설명",
        "original": "원문",
        "corrected": "수정문",
        "category": "카테고리",
        "severity": "심각도",
        "reason": "수정 이유"
      }
    ]
  },
  "qualityEvaluation": {
    "decision": "pass" 또는 "revise",
    "overallScore": 종합점수(1-10),
    "scores": {
      "grammar": 점수,
      "clarity": 점수,
      "coherence": 점수,
      "engagement": 점수,
      "targetFit": 점수
    },
    "strengths": ["강점 1", "강점 2"],
    "weaknesses": ["약점 1", "약점 2"],
    "priorityRevisions": ["우선 수정사항 1", "우선 수정사항 2"]
  }
}`,
  temperature: 0.3,
}

const revisionAgentConfig: AgentConfig = {
  name: 'Revision Agent',
  systemPrompt: `당신은 피드백을 반영하여 글을 수정하는 전문 작가입니다.

## 역할
- 제공된 피드백과 수정 제안을 반영합니다
- 문법/맞춤법 오류를 수정합니다
- 문장을 더 명확하고 자연스럽게 다듬습니다
- 원작의 의도와 톤을 유지합니다

## 지침
- 피드백에서 지적된 문제만 수정합니다
- 과도한 변경은 피합니다
- 수정된 전체 내용만 출력합니다 (JSON 없이 텍스트만)`,
  temperature: 0.4,
}

// ============================================================================
// Helper Functions
// ============================================================================

function parseEditorCriticResponse(response: string): Omit<EditorCriticResult, 'iterationCount' | 'finalStatus'> | null {
  try {
    const jsonMatch = response.match(/```json\n?([\s\S]*?)\n?```/) ||
                      response.match(/\{[\s\S]*\}/)
    const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : response
    const parsed = JSON.parse(jsonStr)

    return {
      editedContent: parsed.editedContent || '',
      grammarCheck: {
        totalErrors: parsed.grammarCheck?.totalErrors || 0,
        errorsByCategory: {
          spelling: parsed.grammarCheck?.errorsByCategory?.spelling || 0,
          grammar: parsed.grammarCheck?.errorsByCategory?.grammar || 0,
          punctuation: parsed.grammarCheck?.errorsByCategory?.punctuation || 0,
          word_choice: parsed.grammarCheck?.errorsByCategory?.word_choice || 0,
          sentence_flow: parsed.grammarCheck?.errorsByCategory?.sentence_flow || 0,
          style: parsed.grammarCheck?.errorsByCategory?.style || 0,
        },
        corrections: parsed.grammarCheck?.corrections || [],
      },
      qualityEvaluation: {
        decision: parsed.qualityEvaluation?.decision || 'revise',
        overallScore: parsed.qualityEvaluation?.overallScore || 5,
        scores: {
          grammar: parsed.qualityEvaluation?.scores?.grammar || 5,
          clarity: parsed.qualityEvaluation?.scores?.clarity || 5,
          coherence: parsed.qualityEvaluation?.scores?.coherence || 5,
          engagement: parsed.qualityEvaluation?.scores?.engagement || 5,
          targetFit: parsed.qualityEvaluation?.scores?.targetFit || 5,
        },
        strengths: parsed.qualityEvaluation?.strengths || [],
        weaknesses: parsed.qualityEvaluation?.weaknesses || [],
        priorityRevisions: parsed.qualityEvaluation?.priorityRevisions || [],
      },
    }
  } catch {
    return null
  }
}

function createDefaultResult(content: string): Omit<EditorCriticResult, 'iterationCount' | 'finalStatus'> {
  return {
    editedContent: content,
    grammarCheck: {
      totalErrors: 0,
      errorsByCategory: {
        spelling: 0,
        grammar: 0,
        punctuation: 0,
        word_choice: 0,
        sentence_flow: 0,
        style: 0,
      },
      corrections: [],
    },
    qualityEvaluation: {
      decision: 'pass',
      overallScore: 7,
      scores: {
        grammar: 7,
        clarity: 7,
        coherence: 7,
        engagement: 7,
        targetFit: 7,
      },
      strengths: [],
      weaknesses: [],
      priorityRevisions: [],
    },
  }
}

// ============================================================================
// Main Functions
// ============================================================================

/**
 * 단일 편집-비평 패스를 실행합니다.
 * 문법/맞춤법 검사, 문장 교정, 품질 평가를 한 번에 수행합니다.
 */
export async function runEditorCriticAgent(
  content: string,
  chapterTitle: string,
  targetAudience: string,
  targetTone: string
): Promise<Omit<EditorCriticResult, 'iterationCount' | 'finalStatus'>> {
  const prompt = `
## 챕터 제목: ${chapterTitle}
## 타겟 독자: ${targetAudience}
## 목표 톤: ${targetTone}

## 편집/평가 대상 내용:
${content}

위 내용에 대해:
1. 문법/맞춤법 검사 및 교정을 수행하세요
2. 문장을 자연스럽게 다듬으세요
3. 품질을 평가하고 Pass/Revise 결정을 내리세요

JSON 형식으로 응답해주세요.
`

  const agentResult = await runAgent(editorCriticAgentConfig, prompt)
  const parsed = parseEditorCriticResponse(agentResult.text)

  const base = parsed || createDefaultResult(content)
  return Object.assign(base, { _usage: agentResult.usage })
}

/**
 * 피드백을 기반으로 내용을 수정합니다.
 */
async function applyRevisions(
  content: string,
  chapterTitle: string,
  targetTone: string,
  feedback: QualityEvaluation,
  corrections: DetailedCorrection[]
): Promise<string> {
  const feedbackSummary = `
## 수정 필요 사항

### 약점
${feedback.weaknesses.map((w, i) => `${i + 1}. ${w}`).join('\n')}

### 우선 수정 사항
${feedback.priorityRevisions.map((r, i) => `${i + 1}. ${r}`).join('\n')}

### 문법/맞춤법 수정 사항
${corrections.slice(0, 10).map((c, i) =>
  `${i + 1}. [${c.category}/${c.severity}] "${c.original}" → "${c.corrected}" (${c.reason})`
).join('\n')}
`

  const prompt = `
## 챕터 제목: ${chapterTitle}
## 목표 톤: ${targetTone}

${feedbackSummary}

## 원본 내용:
${content}

위 피드백을 반영하여 내용을 수정해주세요. 수정된 전체 내용만 출력하세요.
`

  const result = await runAgent(revisionAgentConfig, prompt)
  return result.text
}

/**
 * 피드백 루프를 통해 내용이 품질 기준을 통과할 때까지 반복적으로 편집/수정합니다.
 */
export async function runEditorCriticLoop(
  content: string,
  chapterTitle: string,
  targetAudience: string,
  targetTone: string,
  options: FeedbackLoopOptions = {}
): Promise<EditorCriticResult> {
  const {
    maxIterations = 3,
    passThreshold = 7,
    onIteration
  } = options

  let currentContent = content
  let iterationCount = 0
  let lastResult: Omit<EditorCriticResult, 'iterationCount' | 'finalStatus'>

  while (iterationCount < maxIterations) {
    iterationCount++

    // 편집 및 평가 실행
    lastResult = await runEditorCriticAgent(
      currentContent,
      chapterTitle,
      targetAudience,
      targetTone
    )

    const fullResult: EditorCriticResult = {
      ...lastResult,
      iterationCount,
      finalStatus: lastResult.qualityEvaluation.decision === 'pass' ? 'passed' : 'max_iterations_reached',
    }

    // 콜백 호출
    onIteration?.(iterationCount, fullResult)

    // 통과 조건 체크
    if (lastResult.qualityEvaluation.overallScore >= passThreshold &&
        lastResult.qualityEvaluation.decision === 'pass') {
      return {
        ...lastResult,
        iterationCount,
        finalStatus: 'passed',
      }
    }

    // 마지막 반복이 아니면 수정 적용
    if (iterationCount < maxIterations) {
      currentContent = await applyRevisions(
        lastResult.editedContent,
        chapterTitle,
        targetTone,
        lastResult.qualityEvaluation,
        lastResult.grammarCheck.corrections
      )
    }
  }

  // 최대 반복 횟수 도달
  return {
    ...lastResult!,
    iterationCount,
    finalStatus: 'max_iterations_reached',
  }
}

/**
 * 단일 패스 편집-비평을 실행합니다 (피드백 루프 없음).
 * 기존 editor/critic 워크플로우와 호환됩니다.
 */
export async function runSinglePassEditorCritic(
  content: string,
  chapterTitle: string,
  targetAudience: string,
  targetTone: string
): Promise<EditorCriticResult> {
  const result = await runEditorCriticAgent(
    content,
    chapterTitle,
    targetAudience,
    targetTone
  )

  return {
    ...result,
    iterationCount: 1,
    finalStatus: 'single_pass',
  }
}
