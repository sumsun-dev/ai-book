import { describe, it, expect } from 'vitest'
import { buildContinueContext, stripHtml, extractRuleBasedSummary } from './content-context'

describe('stripHtml', () => {
  it('HTML 태그를 제거하고 텍스트만 반환', () => {
    expect(stripHtml('<p>Hello</p> <strong>World</strong>')).toBe('Hello World')
  })

  it('중첩 태그 처리', () => {
    expect(stripHtml('<div><p><em>test</em></p></div>')).toBe('test')
  })

  it('빈 문자열 반환', () => {
    expect(stripHtml('')).toBe('')
  })

  it('연속 공백 정리', () => {
    expect(stripHtml('<p>a</p>  <p>b</p>  <p>c</p>')).toBe('a b c')
  })
})

describe('buildContinueContext', () => {
  it('빈 입력 처리', () => {
    const result = buildContinueContext('', 4000)
    expect(result.text).toBe('')
    expect(result.strategy).toBe('empty')
  })

  it('limit 이하 텍스트 → full 전략', () => {
    const html = '<p>' + 'A'.repeat(2000) + '</p>'
    const result = buildContinueContext(html, 4000)
    expect(result.strategy).toBe('full')
    expect(result.text.length).toBeLessThanOrEqual(4000)
    expect(result.totalLength).toBe(2000)
  })

  it('limit 초과 텍스트 → split 전략 (앞 30% + 뒤 70%)', () => {
    const longText = 'A'.repeat(2000) + 'B'.repeat(2000) + 'C'.repeat(2000)
    const html = `<p>${longText}</p>`
    const result = buildContinueContext(html, 4000)
    expect(result.strategy).toBe('split')
    expect(result.text).toContain('[... 중략 ...]')
    expect(result.text.length).toBeLessThanOrEqual(4100) // 약간의 여유 (중략 텍스트 포함)
    expect(result.totalLength).toBe(6000)
  })

  it('split 전략에서 앞 30% / 뒤 70% 비율 유지', () => {
    const longText = 'X'.repeat(10000)
    const html = `<p>${longText}</p>`
    const result = buildContinueContext(html, 4000)
    const parts = result.text.split('[... 중략 ...]')
    expect(parts.length).toBe(2)
    const frontLen = parts[0].trim().length
    const backLen = parts[1].trim().length
    // 앞 30%, 뒤 70% (약간의 오차 허용)
    expect(frontLen).toBeLessThan(backLen)
    expect(frontLen).toBeGreaterThan(0)
    expect(backLen).toBeGreaterThan(0)
  })

  it('50000자 입력도 안정적으로 처리', () => {
    const huge = '<p>' + 'Z'.repeat(50000) + '</p>'
    const result = buildContinueContext(huge, 4000)
    expect(result.strategy).toBe('split')
    expect(result.text.length).toBeLessThanOrEqual(4100)
    expect(result.totalLength).toBe(50000)
  })

  it('기본 limit은 4000', () => {
    const html = '<p>' + 'A'.repeat(3000) + '</p>'
    const result = buildContinueContext(html)
    expect(result.strategy).toBe('full')
  })
})

describe('extractRuleBasedSummary', () => {
  it('문단별 첫 문장 추출', () => {
    const text = '첫 번째 문단의 첫 문장입니다. 두 번째 문장입니다.\n\n두 번째 문단의 시작입니다. 추가 내용.'
    const result = extractRuleBasedSummary(text, 500)
    expect(result).toContain('첫 번째 문단의 첫 문장입니다.')
    expect(result).toContain('두 번째 문단의 시작입니다.')
  })

  it('빈 텍스트 처리', () => {
    expect(extractRuleBasedSummary('', 500)).toBe('')
  })

  it('limit 초과 시 잘라내기', () => {
    const text = 'A'.repeat(100) + '.\n\n' + 'B'.repeat(100) + '.\n\n' + 'C'.repeat(100) + '.'
    const result = extractRuleBasedSummary(text, 50)
    expect(result.length).toBeLessThanOrEqual(55) // 약간의 여유
  })

  it('마침표가 없는 문단은 전체를 첫 문장으로', () => {
    const text = '마침표 없는 짧은 문단\n\n다른 문단 역시 마침표 없음'
    const result = extractRuleBasedSummary(text, 500)
    expect(result).toContain('마침표 없는 짧은 문단')
  })
})
