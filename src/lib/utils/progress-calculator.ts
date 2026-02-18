export function countWords(text: string): number {
  if (!text || !text.trim()) return 0
  return text.split(/[\s\n]+/).filter((w) => w.length > 0).length
}

export function formatElapsedTime(seconds: number): string {
  if (seconds < 60) return `${seconds}초`
  const min = Math.floor(seconds / 60)
  const sec = seconds % 60
  return sec > 0 ? `${min}분 ${sec}초` : `${min}분`
}

export function estimateProgress(
  currentWords: number,
  estimatedTotalWords: number
): number {
  if (estimatedTotalWords <= 0) return 0
  const progress = Math.round((currentWords / estimatedTotalWords) * 100)
  return Math.min(progress, 99)
}

export type AgentPhase = 'idle' | 'start' | 'writing' | 'complete'

export function parseAgentPhase(eventLine: string): AgentPhase | null {
  const trimmed = eventLine.trim()
  if (trimmed === 'event: start') return 'start'
  if (trimmed === 'event: writing') return 'writing'
  if (trimmed === 'event: complete') return 'complete'
  return null
}
