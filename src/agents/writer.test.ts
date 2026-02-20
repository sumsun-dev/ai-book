import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/claude', () => ({
  streamAgent: vi.fn(),
}))

import { runWriterAgent, writeFullBook } from './writer'
import { streamAgent } from '@/lib/claude'
import { createMockOutline } from '@/test/fixtures/outline'

const mockStreamAgent = vi.mocked(streamAgent)

const mockUsage = { inputTokens: 0, outputTokens: 0 }

beforeEach(() => {
  vi.clearAllMocks()
})

describe('runWriterAgent', () => {
  it('스트리밍 에이전트를 호출하고 결과를 반환한다', async () => {
    mockStreamAgent.mockResolvedValue({ text: '챕터 본문입니다.', usage: mockUsage })

    const outline = createMockOutline(3)
    const result = await runWriterAgent(
      'fiction',
      outline,
      outline.chapters[0]
    )

    expect(result).toBe('챕터 본문입니다.')
    expect(mockStreamAgent).toHaveBeenCalled()
  })

  it('onChunk 콜백을 전달한다', async () => {
    mockStreamAgent.mockResolvedValue({ text: '결과', usage: mockUsage })
    const onChunk = vi.fn()

    const outline = createMockOutline(1)
    await runWriterAgent('fiction', outline, outline.chapters[0], undefined, onChunk)

    expect(mockStreamAgent).toHaveBeenCalledWith(
      expect.any(Object),
      expect.any(String),
      undefined,
      onChunk
    )
  })

  it('이전 챕터 요약을 포함한다', async () => {
    mockStreamAgent.mockResolvedValue({ text: '결과', usage: mockUsage })

    const outline = createMockOutline(2)
    await runWriterAgent('fiction', outline, outline.chapters[1], '이전 요약 내용')

    expect(mockStreamAgent).toHaveBeenCalledWith(
      expect.any(Object),
      expect.stringContaining('이전 요약 내용'),
      undefined,
      undefined,
    )
  })

  it('bookType과 outline 정보를 프롬프트에 포함한다', async () => {
    mockStreamAgent.mockResolvedValue({ text: '결과', usage: mockUsage })

    const outline = createMockOutline(1)
    await runWriterAgent('technical', outline, outline.chapters[0])

    expect(mockStreamAgent).toHaveBeenCalledWith(
      expect.any(Object),
      expect.stringContaining('technical'),
      undefined,
      undefined,
    )
  })
})

describe('writeFullBook', () => {
  it('모든 챕터를 작성하고 Map으로 반환한다', async () => {
    mockStreamAgent.mockResolvedValueOnce({ text: '챕터 1 내용', usage: mockUsage })
    mockStreamAgent.mockResolvedValueOnce({ text: '챕터 2 내용', usage: mockUsage })

    const outline = createMockOutline(2)
    const chapters = await writeFullBook('fiction', outline)

    expect(chapters.size).toBe(2)
    expect(chapters.get(1)).toBe('챕터 1 내용')
    expect(chapters.get(2)).toBe('챕터 2 내용')
  })

  it('onChapterStart 콜백을 호출한다', async () => {
    mockStreamAgent.mockResolvedValue({ text: '내용', usage: mockUsage })
    const onStart = vi.fn()

    const outline = createMockOutline(2)
    await writeFullBook('fiction', outline, onStart)

    expect(onStart).toHaveBeenCalledWith(1)
    expect(onStart).toHaveBeenCalledWith(2)
  })

  it('onChapterComplete 콜백을 호출한다', async () => {
    mockStreamAgent.mockResolvedValueOnce({ text: '내용1', usage: mockUsage })
    mockStreamAgent.mockResolvedValueOnce({ text: '내용2', usage: mockUsage })
    const onComplete = vi.fn()

    const outline = createMockOutline(2)
    await writeFullBook('fiction', outline, undefined, onComplete)

    expect(onComplete).toHaveBeenCalledWith(1, '내용1')
    expect(onComplete).toHaveBeenCalledWith(2, '내용2')
  })
})
