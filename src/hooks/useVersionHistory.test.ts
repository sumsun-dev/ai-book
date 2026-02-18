import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useVersionHistory } from './useVersionHistory'

const mockSnapshots = [
  {
    id: 'snap-1',
    projectId: 'proj-1',
    label: '리서치 완료',
    stage: 'research',
    outlineData: null,
    chaptersData: '[]',
    bibleData: null,
    createdAt: '2024-01-01T00:00:00.000Z',
  },
]

const mockFetch = vi.fn()
global.fetch = mockFetch

describe('useVersionHistory', () => {
  beforeEach(() => {
    mockFetch.mockReset()
    mockFetch.mockResolvedValue({
      json: () => Promise.resolve({ success: true, data: mockSnapshots }),
    })
  })

  it('should load snapshots on mount', async () => {
    const { result } = renderHook(() =>
      useVersionHistory({ projectId: 'proj-1' })
    )

    await waitFor(() => {
      expect(result.current.snapshots).toHaveLength(1)
    })
    expect(result.current.snapshots[0].label).toBe('리서치 완료')
  })

  it('should create a snapshot', async () => {
    const { result } = renderHook(() =>
      useVersionHistory({ projectId: 'proj-1' })
    )

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    await act(async () => {
      await result.current.createSnapshot('수동 저장')
    })

    expect(mockFetch).toHaveBeenCalledWith(
      '/api/projects/proj-1/snapshots',
      expect.objectContaining({ method: 'POST' })
    )
  })

  it('should restore a snapshot', async () => {
    const { result } = renderHook(() =>
      useVersionHistory({ projectId: 'proj-1' })
    )

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    await act(async () => {
      await result.current.restoreSnapshot('snap-1')
    })

    expect(mockFetch).toHaveBeenCalledWith(
      '/api/projects/proj-1/snapshots/snap-1/restore',
      expect.objectContaining({ method: 'POST' })
    )
  })

  it('should delete a snapshot', async () => {
    const { result } = renderHook(() =>
      useVersionHistory({ projectId: 'proj-1' })
    )

    await waitFor(() => expect(result.current.snapshots).toHaveLength(1))

    await act(async () => {
      await result.current.deleteSnapshot('snap-1')
    })

    expect(result.current.snapshots).toHaveLength(0)
  })
})
