/**
 * 규칙 기반 스타일 분석 유틸리티
 * - 실제 작성된 글의 문장 길이, 대화 비율, 어조 분석
 * - AI 호출 없이 규칙 기반으로 동작
 */

export interface StyleProfile {
  avgSentenceLength: number
  dialogueRatio: number
  toneMarkers: string[]
  paragraphCount: number
  sentenceCount: number
}

function stripHtmlForStyle(html: string): string {
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function splitSentences(text: string): string[] {
  return text
    .split(/[.!?]+/)
    .map(s => s.trim())
    .filter(s => s.length > 0)
}

function countDialogueChars(text: string): number {
  const matches = text.match(/"[^"]*"|"[^"]*"|'[^']*'|「[^」]*」|『[^』]*』/g)
  if (!matches) return 0
  return matches.reduce((sum, m) => sum + m.length, 0)
}

function detectToneMarkers(text: string): string[] {
  const markers: string[] = []

  const formalEndings = (text.match(/(?:입니다|습니다|세요|겠습니다|합니다|됩니다|주세요|드립니다)[.!?]?/g) || []).length
  const casualEndings = (text.match(/(?:이다|한다|된다|간다|온다|있다|없다|했다|였다|보다)[.!?]?/g) || []).length

  if (formalEndings > casualEndings && formalEndings >= 3) {
    markers.push('경어체')
  } else if (casualEndings > formalEndings && casualEndings >= 3) {
    markers.push('평어체')
  }

  const exclamations = (text.match(/!/g) || []).length
  const questions = (text.match(/\?/g) || []).length
  const sentences = splitSentences(text).length

  if (sentences > 0 && exclamations / sentences > 0.15) {
    markers.push('감탄 표현 빈번')
  }
  if (sentences > 0 && questions / sentences > 0.15) {
    markers.push('질문형 빈번')
  }

  return markers
}

export function analyzeStyle(htmlContent: string): StyleProfile | null {
  const text = stripHtmlForStyle(htmlContent)
  if (text.length < 200) return null

  const sentences = splitSentences(text)
  if (sentences.length === 0) return null

  const totalChars = sentences.reduce((sum, s) => sum + s.length, 0)
  const avgSentenceLength = Math.round(totalChars / sentences.length)

  const dialogueChars = countDialogueChars(text)
  const dialogueRatio = Math.round((dialogueChars / text.length) * 100) / 100

  const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim()).length || 1

  return {
    avgSentenceLength,
    dialogueRatio,
    toneMarkers: detectToneMarkers(text),
    paragraphCount: paragraphs,
    sentenceCount: sentences.length,
  }
}

export function formatStyleGuide(profile: StyleProfile | null): string {
  if (!profile) return ''

  const lines: string[] = ['**기존 글 스타일 분석:**']

  if (profile.avgSentenceLength <= 15) {
    lines.push(`- 평균 문장 길이: ${profile.avgSentenceLength}자 (짧고 간결한 문체)`)
  } else if (profile.avgSentenceLength <= 30) {
    lines.push(`- 평균 문장 길이: ${profile.avgSentenceLength}자 (보통 호흡)`)
  } else {
    lines.push(`- 평균 문장 길이: ${profile.avgSentenceLength}자 (긴 호흡의 문체)`)
  }

  if (profile.dialogueRatio >= 0.4) {
    lines.push(`- 대화 비율: ${Math.round(profile.dialogueRatio * 100)}% (대화 중심)`)
  } else if (profile.dialogueRatio >= 0.15) {
    lines.push(`- 대화 비율: ${Math.round(profile.dialogueRatio * 100)}% (대화와 서술 혼합)`)
  } else {
    lines.push(`- 대화 비율: ${Math.round(profile.dialogueRatio * 100)}% (서술 중심)`)
  }

  if (profile.toneMarkers.length > 0) {
    lines.push(`- 어조: ${profile.toneMarkers.join(', ')}`)
  }

  lines.push('- 위 스타일을 유지하며 이어서 작성해주세요.')

  return lines.join('\n')
}
