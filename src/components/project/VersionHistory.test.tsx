import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { VersionHistory } from './VersionHistory'

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

describe('VersionHistory', () => {
  beforeEach(() => {
    mockFetch.mockReset()
    mockFetch.mockResolvedValue({
      json: () => Promise.resolve({ success: true, data: mockSnapshots }),
    })
  })

  it('should render snapshot list', async () => {
    render(<VersionHistory projectId="proj-1" />)
    await waitFor(() => {
      expect(screen.getByText('리서치 완료')).toBeInTheDocument()
    })
  })

  it('should render create snapshot input', () => {
    render(<VersionHistory projectId="proj-1" />)
    expect(screen.getByLabelText('스냅샷 레이블')).toBeInTheDocument()
  })

  it('should render empty state when no snapshots', async () => {
    mockFetch.mockResolvedValue({
      json: () => Promise.resolve({ success: true, data: [] }),
    })
    render(<VersionHistory projectId="proj-1" />)
    await waitFor(() => {
      expect(screen.getByText('저장된 버전이 없습니다')).toBeInTheDocument()
    })
  })

  it('should show restore and delete buttons', async () => {
    render(<VersionHistory projectId="proj-1" />)
    await waitFor(() => {
      expect(screen.getByText('복원')).toBeInTheDocument()
      expect(screen.getByText('삭제')).toBeInTheDocument()
    })
  })
})
