import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useStreamingGeneration } from './useStreamingGeneration'
import { createMockOutline, createMockChapterOutline } from '@/test/fixtures/outline'

beforeEach(() => {
  vi.restoreAllMocks()
})

describe('useStreamingGeneration', () => {
  it('초기 상태를 반환한다', () => {
    const { result } = renderHook(() => useStreamingGeneration())

    expect(result.current.isStreaming).toBe(false)
    expect(result.current.currentChapter).toBeNull()
    expect(result.current.streamedText).toBe('')
    expect(result.current.error).toBeNull()
  })

  it('resetStreaming으로 상태를 초기화한다', () => {
    const { result } = renderHook(() => useStreamingGeneration())

    act(() => {
      result.current.resetStreaming()
    })

    expect(result.current.isStreaming).toBe(false)
    expect(result.current.streamedText).toBe('')
    expect(result.current.error).toBeNull()
  })

  it('stopStreaming으로 스트리밍을 중단한다', () => {
    const { result } = renderHook(() => useStreamingGeneration())

    act(() => {
      result.current.stopStreaming()
    })

    expect(result.current.isStreaming).toBe(false)
  })

  it('startStreaming이 fetch 실패 시 에러를 설정한다', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
    })

    const { result } = renderHook(() => useStreamingGeneration())

    const outline = createMockOutline(1)
    const chapter = createMockChapterOutline(1)

    await act(async () => {
      try {
        await result.current.startStreaming('fiction', outline, chapter)
      } catch {
        // expected
      }
    })

    expect(result.current.isStreaming).toBe(false)
    expect(result.current.error).toBeDefined()
  })

  it('startStreaming이 응답 본문이 없으면 에러를 던진다', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      body: null,
    })

    const { result } = renderHook(() => useStreamingGeneration())

    const outline = createMockOutline(1)
    const chapter = createMockChapterOutline(1)

    await act(async () => {
      try {
        await result.current.startStreaming('fiction', outline, chapter)
      } catch {
        // expected
      }
    })

    expect(result.current.error).toContain('스트림')
  })

  it('startStreaming이 성공적으로 스트리밍한다', async () => {
    const encoder = new TextEncoder()
    const chunks = [
      encoder.encode('data: {"text":"Hello "}\n\n'),
      encoder.encode('data: {"text":"World"}\n\n'),
    ]

    let chunkIndex = 0
    const mockReader = {
      read: vi.fn().mockImplementation(() => {
        if (chunkIndex < chunks.length) {
          return Promise.resolve({ done: false, value: chunks[chunkIndex++] })
        }
        return Promise.resolve({ done: true, value: undefined })
      }),
    }

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      body: { getReader: () => mockReader },
    })

    const { result } = renderHook(() => useStreamingGeneration())

    const outline = createMockOutline(1)
    const chapter = createMockChapterOutline(1)

    let content: string = ''
    await act(async () => {
      content = await result.current.startStreaming('fiction', outline, chapter)
    })

    expect(content).toBe('Hello World')
    expect(result.current.isStreaming).toBe(false)
  })
})
