import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/claude', () => ({
  runAgent: vi.fn(),
}))

import { runResearchAgent } from './research'
import { runAgent } from '@/lib/claude'

const mockRunAgent = vi.mocked(runAgent)

const mockUsage = { inputTokens: 0, outputTokens: 0 }

beforeEach(() => {
  vi.clearAllMocks()
})

describe('runResearchAgent', () => {
  it('JSON 응답을 파싱한다', async () => {
    const mockResponse = JSON.stringify({
      topic: 'AI',
      findings: ['발견 1'],
      sources: ['출처 1'],
      recommendations: ['추천 1'],
    })
    mockRunAgent.mockResolvedValue({ text: mockResponse, usage: mockUsage })

    const result = await runResearchAgent('fiction', 'AI 주제')

    expect(result.topic).toBe('AI')
    expect(result.findings).toEqual(['발견 1'])
    expect(result.sources).toEqual(['출처 1'])
    expect(result.recommendations).toEqual(['추천 1'])
  })

  it('코드 블록 안의 JSON을 파싱한다', async () => {
    const mockResponse = '```json\n{"topic": "테스트", "findings": ["f1"], "sources": [], "recommendations": []}\n```'
    mockRunAgent.mockResolvedValue({ text: mockResponse, usage: mockUsage })

    const result = await runResearchAgent('nonfiction', '테스트')
    expect(result.topic).toBe('테스트')
  })

  it('파싱 실패 시 fallback 구조를 반환한다', async () => {
    mockRunAgent.mockResolvedValue({ text: '이것은 JSON이 아닌 텍스트입니다.', usage: mockUsage })

    const result = await runResearchAgent('fiction', 'AI 주제')

    expect(result.topic).toBe('AI 주제')
    expect(result.findings).toEqual(['이것은 JSON이 아닌 텍스트입니다.'])
    expect(result.sources).toEqual([])
    expect(result.recommendations).toEqual([])
  })

  it('additionalContext를 프롬프트에 포함한다', async () => {
    mockRunAgent.mockResolvedValue({ text: '{"topic":"t","findings":[],"sources":[],"recommendations":[]}', usage: mockUsage })

    await runResearchAgent('fiction', 'topic', '추가 맥락')

    expect(mockRunAgent).toHaveBeenCalledWith(
      expect.any(Object),
      expect.stringContaining('추가 맥락')
    )
  })

  it('bookType을 프롬프트에 포함한다', async () => {
    mockRunAgent.mockResolvedValue({ text: '{"topic":"t","findings":[],"sources":[],"recommendations":[]}', usage: mockUsage })

    await runResearchAgent('technical', 'topic')

    expect(mockRunAgent).toHaveBeenCalledWith(
      expect.any(Object),
      expect.stringContaining('technical')
    )
  })
})
