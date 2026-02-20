import { describe, it, expect } from 'vitest'
import { analyzeStyle, formatStyleGuide } from './style-analyzer'

describe('analyzeStyle', () => {
  it('200자 미만이면 null 반환', () => {
    expect(analyzeStyle('짧은 텍스트입니다.')).toBeNull()
    expect(analyzeStyle('<p>짧은 텍스트</p>')).toBeNull()
  })

  it('짧은 문장 스타일 분석', () => {
    const shortSentences = '<p>' + Array(30).fill('짧은 문장이다.').join(' ') + '</p>'
    const result = analyzeStyle(shortSentences)
    expect(result).not.toBeNull()
    expect(result!.avgSentenceLength).toBeLessThan(20)
  })

  it('긴 문장 스타일 분석', () => {
    const longSentences = '<p>' + Array(10).fill('이것은 매우 길고 복잡한 문장으로서 독자가 읽기에 상당한 인내심이 필요한 종류의 글이며 여러 절과 구가 연결되어 있다.').join(' ') + '</p>'
    const result = analyzeStyle(longSentences)
    expect(result).not.toBeNull()
    expect(result!.avgSentenceLength).toBeGreaterThan(20)
  })

  it('대화 중심 텍스트 감지', () => {
    const dialogueText = '<p>' + Array(5).fill('"안녕하세요?" 그가 말했다. "반갑습니다." 그녀가 대답했다. "어디 가세요?" "집에 가는 길이에요." 그들은 함께 걸었다. "날씨가 좋네요." "네, 정말 좋은 날이에요." 다시 침묵이 흘렀다.').join(' ') + '</p>'
    const result = analyzeStyle(dialogueText)
    expect(result).not.toBeNull()
    expect(result!.dialogueRatio).toBeGreaterThan(0.3)
  })

  it('경어체 감지', () => {
    const formalText = '<p>' + Array(20).fill('이것은 중요한 내용입니다. 독자 여러분께서는 주의해 주세요. 다음으로 넘어가겠습니다.').join(' ') + '</p>'
    const result = analyzeStyle(formalText)
    expect(result).not.toBeNull()
    expect(result!.toneMarkers).toContain('경어체')
  })

  it('평어체 감지', () => {
    const casualText = '<p>' + Array(20).fill('이건 중요한 내용이다. 독자는 주의해야 한다. 다음으로 넘어간다.').join(' ') + '</p>'
    const result = analyzeStyle(casualText)
    expect(result).not.toBeNull()
    expect(result!.toneMarkers).toContain('평어체')
  })
})

describe('formatStyleGuide', () => {
  it('StyleProfile을 프롬프트 텍스트로 변환', () => {
    const result = formatStyleGuide({
      avgSentenceLength: 15,
      dialogueRatio: 0.4,
      toneMarkers: ['경어체'],
      paragraphCount: 10,
      sentenceCount: 30,
    })
    expect(result).toContain('평균 문장 길이')
    expect(result).toContain('대화 비율')
    expect(result).toContain('경어체')
  })

  it('null 입력 시 빈 문자열', () => {
    expect(formatStyleGuide(null)).toBe('')
  })
})
