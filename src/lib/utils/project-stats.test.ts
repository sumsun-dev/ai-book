import { describe, it, expect } from 'vitest'
import {
  calculateProjectStats,
  getStageLabel,
  formatDate,
  getChapterStatusLabel,
} from './project-stats'
import type { Chapter } from '@/types/book'

const createChapter = (
  overrides: Partial<Chapter> = {}
): Chapter => ({
  number: 1,
  title: 'Chapter 1',
  content: '',
  status: 'pending',
  revisions: [],
  ...overrides,
})

describe('calculateProjectStats', () => {
  it('should return zero stats for empty chapters', () => {
    const stats = calculateProjectStats([])
    expect(stats.totalChapters).toBe(0)
    expect(stats.completedChapters).toBe(0)
    expect(stats.totalWords).toBe(0)
    expect(stats.completionPercent).toBe(0)
  })

  it('should count completed chapters', () => {
    const chapters = [
      createChapter({ status: 'approved' }),
      createChapter({ number: 2, status: 'writing' }),
      createChapter({ number: 3, status: 'approved' }),
    ]
    const stats = calculateProjectStats(chapters)
    expect(stats.totalChapters).toBe(3)
    expect(stats.completedChapters).toBe(2)
    expect(stats.completionPercent).toBe(67)
  })

  it('should count total words', () => {
    const chapters = [
      createChapter({ content: '첫 번째 챕터 내용' }),
      createChapter({ number: 2, content: '두 번째' }),
    ]
    const stats = calculateProjectStats(chapters)
    expect(stats.totalWords).toBe(6)
  })

  it('should calculate status breakdown', () => {
    const chapters = [
      createChapter({ status: 'pending' }),
      createChapter({ number: 2, status: 'pending' }),
      createChapter({ number: 3, status: 'approved' }),
    ]
    const stats = calculateProjectStats(chapters)
    expect(stats.statusBreakdown).toEqual({ pending: 2, approved: 1 })
  })
})

describe('getStageLabel', () => {
  it('should return Korean labels', () => {
    expect(getStageLabel('research')).toBe('리서치')
    expect(getStageLabel('write')).toBe('집필')
  })

  it('should return input for unknown stage', () => {
    expect(getStageLabel('unknown')).toBe('unknown')
  })
})

describe('formatDate', () => {
  it('should format Date object', () => {
    const result = formatDate(new Date('2024-03-15'))
    expect(result).toContain('2024')
    expect(result).toContain('3')
    expect(result).toContain('15')
  })
})

describe('getChapterStatusLabel', () => {
  it('should return Korean labels', () => {
    expect(getChapterStatusLabel('pending')).toBe('대기')
    expect(getChapterStatusLabel('approved')).toBe('완료')
  })
})
