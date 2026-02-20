import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/claude', () => ({
  runAgent: vi.fn(),
}))

import { runCriticAgent } from './critic'
import { runAgent } from '@/lib/claude'

const mockRunAgent = vi.mocked(runAgent)

const mockUsage = { inputTokens: 0, outputTokens: 0 }

beforeEach(() => {
  vi.clearAllMocks()
})

describe('runCriticAgent', () => {
  it('JSON 응답을 파싱한다', async () => {
    mockRunAgent.mockResolvedValue({
      text: JSON.stringify({
        decision: 'pass',
        overallScore: 8,
        scores: {
          coherence: 8,
          engagement: 8,
          clarity: 9,
          originality: 7,
          targetFit: 8,
        },
        strengths: ['잘 씀'],
        weaknesses: [],
        revisionSuggestions: [],
      }),
      usage: mockUsage,
    })

    const result = await runCriticAgent('내용', '제목', '독자', '톤')

    expect(result.decision).toBe('pass')
    expect(result.overallScore).toBe(8)
    expect(result.strengths).toEqual(['잘 씀'])
  })

  it('코드 블록 안의 JSON을 파싱한다', async () => {
    const json = {
      decision: 'revise',
      overallScore: 5,
      scores: { coherence: 5, engagement: 5, clarity: 5, originality: 5, targetFit: 5 },
      strengths: [],
      weaknesses: ['구성 부족'],
      revisionSuggestions: ['수정 필요'],
    }
    mockRunAgent.mockResolvedValue({ text: `\`\`\`json\n${JSON.stringify(json)}\n\`\`\``, usage: mockUsage })

    const result = await runCriticAgent('내용', '제목', '독자', '톤')
    expect(result.decision).toBe('revise')
  })

  it('파싱 실패 시 기본 pass를 반환한다', async () => {
    mockRunAgent.mockResolvedValue({ text: '파싱 불가 텍스트', usage: mockUsage })

    const result = await runCriticAgent('내용', '제목', '독자', '톤')

    expect(result.decision).toBe('pass')
    expect(result.overallScore).toBe(7)
    expect(result.revisionSuggestions).toEqual(['파싱 불가 텍스트'])
  })

  it('프롬프트에 파라미터를 포함한다', async () => {
    mockRunAgent.mockResolvedValue({ text: '{"decision":"pass","overallScore":7,"scores":{"coherence":7,"engagement":7,"clarity":7,"originality":7,"targetFit":7},"strengths":[],"weaknesses":[],"revisionSuggestions":[]}', usage: mockUsage })

    await runCriticAgent('내용', '제목입니다', '20대', '전문적')

    expect(mockRunAgent).toHaveBeenCalledWith(
      expect.any(Object),
      expect.stringContaining('제목입니다')
    )
  })
})
