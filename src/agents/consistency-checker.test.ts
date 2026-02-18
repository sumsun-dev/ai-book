import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/claude', () => ({
  runAgent: vi.fn(),
}))

import { runConsistencyCheck } from './consistency-checker'
import { runAgent } from '@/lib/claude'

describe('runConsistencyCheck', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return empty issues for less than 2 chapters', async () => {
    const result = await runConsistencyCheck([
      { number: 1, title: 'Ch 1', content: 'Content' },
    ])

    expect(result.issues).toEqual([])
    expect(result.chapterCount).toBe(1)
  })

  it('should parse valid consistency issues from agent response', async () => {
    vi.mocked(runAgent).mockResolvedValue(JSON.stringify({
      issues: [
        {
          type: 'character_name',
          severity: 'error',
          chapterA: 1,
          chapterB: 2,
          title: 'Name inconsistency',
          description: 'Character Kim is called Lee in chapter 2',
          suggestion: 'Use consistent name',
        },
      ],
      summary: 'Found 1 issue',
    }))

    const result = await runConsistencyCheck([
      { number: 1, title: 'Ch 1', content: 'Kim went to school.' },
      { number: 2, title: 'Ch 2', content: 'Lee went to school.' },
    ])

    expect(result.issues).toHaveLength(1)
    expect(result.issues[0].type).toBe('character_name')
    expect(result.issues[0].severity).toBe('error')
  })

  it('should handle agent response with no issues', async () => {
    vi.mocked(runAgent).mockResolvedValue(JSON.stringify({
      issues: [],
      summary: 'No issues found',
    }))

    const result = await runConsistencyCheck([
      { number: 1, title: 'Ch 1', content: 'Consistent content' },
      { number: 2, title: 'Ch 2', content: 'Also consistent' },
    ])

    expect(result.issues).toEqual([])
  })

  it('should handle JSON parse errors gracefully', async () => {
    vi.mocked(runAgent).mockResolvedValue('invalid json response')

    const result = await runConsistencyCheck([
      { number: 1, title: 'Ch 1', content: 'Content 1' },
      { number: 2, title: 'Ch 2', content: 'Content 2' },
    ])

    expect(result.issues).toEqual([])
  })
})
