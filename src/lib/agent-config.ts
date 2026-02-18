import type {
  AgentCustomConfig,
  WriterConfig,
  EditorConfig,
  CriticConfig,
} from '@/types/book'
import type { AgentConfig } from '@/lib/claude'

const DEFAULT_WRITER: WriterConfig = {
  styleIntensity: 'balanced',
  creativity: 0.8,
  customInstructions: '',
}

const DEFAULT_EDITOR: EditorConfig = {
  strictness: 'moderate',
  focusAreas: ['grammar', 'style', 'clarity', 'structure'],
}

const DEFAULT_CRITIC: CriticConfig = {
  evaluationFocus: 'overall',
  passThreshold: 7,
}

export function parseAgentConfig(json: string | null): AgentCustomConfig {
  if (!json) return {}
  try {
    return JSON.parse(json) as AgentCustomConfig
  } catch {
    return {}
  }
}

export function mergeWriterConfig(
  baseConfig: AgentConfig,
  custom?: Partial<WriterConfig>
): AgentConfig {
  const cfg = { ...DEFAULT_WRITER, ...custom }

  const intensityInstructions: Record<string, string> = {
    concise: '\n- 간결하고 핵심적인 문장 위주로 작성',
    balanced: '',
    detailed: '\n- 풍부한 묘사와 상세한 설명을 포함하여 작성',
  }

  return {
    ...baseConfig,
    temperature: cfg.creativity,
    systemPrompt:
      baseConfig.systemPrompt +
      intensityInstructions[cfg.styleIntensity] +
      (cfg.customInstructions
        ? `\n\n## 추가 지시사항\n${cfg.customInstructions}`
        : ''),
  }
}

export function mergeEditorConfig(
  baseConfig: AgentConfig,
  custom?: Partial<EditorConfig>
): AgentConfig {
  const cfg = { ...DEFAULT_EDITOR, ...custom }

  const strictnessMap: Record<string, number> = {
    lenient: 0.5,
    moderate: 0.3,
    strict: 0.1,
  }

  const focusInstruction =
    cfg.focusAreas.length < 4
      ? `\n\n## 집중 영역\n다음 영역에 특히 집중하세요: ${cfg.focusAreas.join(', ')}`
      : ''

  return {
    ...baseConfig,
    temperature: strictnessMap[cfg.strictness] ?? 0.3,
    systemPrompt: baseConfig.systemPrompt + focusInstruction,
  }
}

export function mergeCriticConfig(
  baseConfig: AgentConfig,
  custom?: Partial<CriticConfig>
): AgentConfig {
  const cfg = { ...DEFAULT_CRITIC, ...custom }

  const focusInstructions: Record<string, string> = {
    overall: '',
    grammar: '\n\n특히 문법과 맞춤법에 중점을 두어 평가하세요.',
    style: '\n\n특히 문체와 표현에 중점을 두어 평가하세요.',
    structure: '\n\n특히 구조와 논리적 흐름에 중점을 두어 평가하세요.',
  }

  const thresholdInstruction = `\n\n## 통과 기준\n평균 ${cfg.passThreshold}점 이상이면 PASS, 미만이면 REVISE로 판정합니다.`

  return {
    ...baseConfig,
    systemPrompt:
      baseConfig.systemPrompt +
      focusInstructions[cfg.evaluationFocus] +
      thresholdInstruction,
  }
}
