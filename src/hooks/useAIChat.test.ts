import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useAIChat } from './useAIChat'

beforeEach(() => {
  vi.restoreAllMocks()
})

describe('useAIChat', () => {
  it('초기 상태를 반환한다', () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: [] }),
    })

    const { result } = renderHook(() =>
      useAIChat({ projectId: 'p1', chapterId: 'ch1' })
    )

    expect(result.current.messages).toEqual([])
    expect(result.current.isLoading).toBe(false)
  })

  it('chapterId가 null이면 메시지를 비운다', () => {
    global.fetch = vi.fn()

    const { result } = renderHook(() =>
      useAIChat({ projectId: 'p1', chapterId: null })
    )

    expect(result.current.messages).toEqual([])
    expect(global.fetch).not.toHaveBeenCalled()
  })

  it('chapterId가 있으면 히스토리를 로드한다', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          data: [
            {
              id: 'msg-1',
              role: 'user',
              content: '안녕',
              createdAt: '2026-01-01T00:00:00Z',
            },
          ],
        }),
    })

    const { result } = renderHook(() =>
      useAIChat({ projectId: 'p1', chapterId: 'ch1' })
    )

    await waitFor(() => {
      expect(result.current.messages).toHaveLength(1)
    })

    expect(result.current.messages[0].content).toBe('안녕')
  })

  it('sendMessage가 chapterId 없으면 아무것도 하지 않는다', async () => {
    global.fetch = vi.fn()

    const { result } = renderHook(() =>
      useAIChat({ projectId: 'p1', chapterId: null })
    )

    await act(async () => {
      await result.current.sendMessage('hello', {
        chapterNumber: 1,
      })
    })

    expect(result.current.messages).toEqual([])
  })

  it('sendMessage가 빈 메시지를 무시한다', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: [] }),
    })

    const { result } = renderHook(() =>
      useAIChat({ projectId: 'p1', chapterId: 'ch1' })
    )

    await act(async () => {
      await result.current.sendMessage('   ', { chapterNumber: 1 })
    })

    expect(result.current.messages).toEqual([])
  })

  it('clearMessages가 메시지를 비운다', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: [] }),
    })

    const { result } = renderHook(() =>
      useAIChat({ projectId: 'p1', chapterId: 'ch1' })
    )

    await act(async () => {
      await result.current.clearMessages()
    })

    expect(result.current.messages).toEqual([])
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/chat'),
      expect.objectContaining({ method: 'DELETE' })
    )
  })

  it('chapterId가 null이면 clearMessages가 fetch를 호출하지 않는다', async () => {
    const mockFetch = vi.fn()
    global.fetch = mockFetch

    const { result } = renderHook(() =>
      useAIChat({ projectId: 'p1', chapterId: null })
    )

    await act(async () => {
      await result.current.clearMessages()
    })

    expect(mockFetch).not.toHaveBeenCalled()
  })
})
