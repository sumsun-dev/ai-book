/**
 * keyPoint 진행 상황 추적 유틸리티
 * - 규칙 기반 키워드 매칭으로 keyPoint 완료 여부 판별
 */

export type KeyPointStatus = 'completed' | 'partial' | 'pending'

export interface KeyPointProgress {
  keyPoint: string
  status: KeyPointStatus
}

const KOREAN_SUFFIXES = /[은는이가을를의에서도로와과만에게까지부터으로처럼보다마다밖에](을|를)?$/

function extractKeywords(text: string): string[] {
  return text
    .replace(/[.,!?;:'"()\[\]{}<>]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length >= 2)
    .map(w => w.replace(KOREAN_SUFFIXES, ''))
    .filter(w => w.length >= 2)
}

export function analyzeKeyPointProgress(
  content: string,
  keyPoints: string[]
): KeyPointProgress[] {
  if (keyPoints.length === 0) return []

  const contentLower = content.toLowerCase()
  const contentKeywords = new Set(extractKeywords(contentLower))

  return keyPoints.map(keyPoint => {
    const kpKeywords = extractKeywords(keyPoint.toLowerCase())
    if (kpKeywords.length === 0) {
      return { keyPoint, status: 'pending' as const }
    }

    let matchCount = 0
    for (const keyword of kpKeywords) {
      if (contentKeywords.has(keyword) || contentLower.includes(keyword)) {
        matchCount++
      }
    }

    const matchRatio = matchCount / kpKeywords.length

    if (matchRatio >= 0.7) {
      return { keyPoint, status: 'completed' as const }
    }
    if (matchRatio >= 0.3) {
      return { keyPoint, status: 'partial' as const }
    }
    return { keyPoint, status: 'pending' as const }
  })
}

export function formatKeyPointProgress(statuses: KeyPointProgress[]): string {
  if (statuses.length === 0) return ''

  const labels: Record<KeyPointStatus, string> = {
    completed: '[완료]',
    partial: '[진행중]',
    pending: '[미완료]',
  }

  return statuses
    .map(s => `  ${labels[s.status]} ${s.keyPoint}`)
    .join('\n')
}
