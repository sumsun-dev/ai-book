/**
 * 이어쓰기(continue writing) 컨텍스트 구성 유틸리티
 * - 긴 챕터에서 앞쪽+뒷쪽 2단계 전략으로 컨텍스트 전달
 * - 규칙 기반 요약 추출
 */

export interface ContinueContext {
  text: string
  strategy: 'empty' | 'full' | 'split'
  totalLength: number
}

export function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function buildContinueContext(
  htmlContent: string,
  limit: number = 4000
): ContinueContext {
  const plainText = stripHtml(htmlContent)

  if (!plainText) {
    return { text: '', strategy: 'empty', totalLength: 0 }
  }

  if (plainText.length <= limit) {
    return { text: plainText, strategy: 'full', totalLength: plainText.length }
  }

  const frontLimit = Math.floor(limit * 0.3)
  const backLimit = limit - frontLimit
  const front = plainText.substring(0, frontLimit)
  const back = plainText.substring(plainText.length - backLimit)

  return {
    text: `${front}\n\n[... 중략 ...]\n\n${back}`,
    strategy: 'split',
    totalLength: plainText.length,
  }
}

export function extractRuleBasedSummary(text: string, limit: number): string {
  if (!text.trim()) return ''

  const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim())
  const firstSentences: string[] = []
  let totalLength = 0

  for (const paragraph of paragraphs) {
    const trimmed = paragraph.trim()
    const periodMatch = trimmed.match(/^[^.!?]*[.!?]/)
    const sentence = periodMatch ? periodMatch[0].trim() : trimmed

    if (totalLength + sentence.length > limit) break
    firstSentences.push(sentence)
    totalLength += sentence.length
  }

  return firstSentences.join(' ')
}
