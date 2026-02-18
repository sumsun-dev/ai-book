import { describe, it, expect } from 'vitest'
import {
  countWords,
  formatElapsedTime,
  estimateProgress,
  parseAgentPhase,
} from './progress-calculator'

describe('countWords', () => {
  it('should count English words', () => {
    expect(countWords('hello world')).toBe(2)
  })

  it('should count Korean words separated by spaces', () => {
    expect(countWords('안녕 하세요 반갑습니다')).toBe(3)
  })

  it('should handle empty string', () => {
    expect(countWords('')).toBe(0)
  })

  it('should handle newlines as separators', () => {
    expect(countWords('첫 줄\n둘째 줄\n셋째')).toBe(5)
  })
})

describe('formatElapsedTime', () => {
  it('should format seconds only', () => {
    expect(formatElapsedTime(30)).toBe('30초')
  })

  it('should format minutes and seconds', () => {
    expect(formatElapsedTime(90)).toBe('1분 30초')
  })

  it('should format exact minutes', () => {
    expect(formatElapsedTime(120)).toBe('2분')
  })
})

describe('estimateProgress', () => {
  it('should calculate percentage', () => {
    expect(estimateProgress(50, 100)).toBe(50)
  })

  it('should cap at 99', () => {
    expect(estimateProgress(150, 100)).toBe(99)
  })

  it('should handle zero total', () => {
    expect(estimateProgress(50, 0)).toBe(0)
  })
})

describe('parseAgentPhase', () => {
  it('should parse start event', () => {
    expect(parseAgentPhase('event: start')).toBe('start')
  })

  it('should parse writing event', () => {
    expect(parseAgentPhase('event: writing')).toBe('writing')
  })

  it('should parse complete event', () => {
    expect(parseAgentPhase('event: complete')).toBe('complete')
  })

  it('should return null for unknown event', () => {
    expect(parseAgentPhase('event: unknown')).toBeNull()
  })
})
