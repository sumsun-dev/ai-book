import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import SourcesCollapsible from './SourcesCollapsible'

// Mock fetch
const mockFetch = vi.fn()
global.fetch = mockFetch

const mockSources = [
  {
    id: 'source-1',
    projectId: 'project-1',
    title: '참고 도서',
    author: '홍길동',
    url: 'https://example.com',
    type: 'book',
    notes: '좋은 자료',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'source-2',
    projectId: 'project-1',
    title: '웹사이트',
    author: null,
    url: 'https://web.com',
    type: 'website',
    notes: null,
    createdAt: '2024-01-02T00:00:00.000Z',
    updatedAt: '2024-01-02T00:00:00.000Z',
  },
]

describe('SourcesCollapsible', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true, data: mockSources }),
    })
  })

  it('접힌 상태에서 출처 개수를 표시한다', async () => {
    render(<SourcesCollapsible projectId="project-1" />)

    await waitFor(() => {
      expect(screen.getByText(/출처/)).toBeInTheDocument()
      expect(screen.getByText('2')).toBeInTheDocument()
    })
  })

  it('버튼 클릭 시 패널이 펼쳐진다', async () => {
    const user = userEvent.setup()
    render(<SourcesCollapsible projectId="project-1" />)

    await waitFor(() => {
      expect(screen.getByText(/출처/)).toBeInTheDocument()
    })

    const toggleButton = screen.getByRole('button', { name: /출처/ })
    await user.click(toggleButton)

    await waitFor(() => {
      expect(screen.getByText('참고 도서')).toBeInTheDocument()
      // '웹사이트'는 타입 라벨과 제목 모두에 표시되므로 getAllByText 사용
      expect(screen.getAllByText('웹사이트')).toHaveLength(2)
    })
  })

  it('출처 목록을 표시한다', async () => {
    const user = userEvent.setup()
    render(<SourcesCollapsible projectId="project-1" />)

    await waitFor(() => {
      expect(screen.getByText(/출처/)).toBeInTheDocument()
    })

    const toggleButton = screen.getByRole('button', { name: /출처/ })
    await user.click(toggleButton)

    await waitFor(() => {
      expect(screen.getByText('참고 도서')).toBeInTheDocument()
      expect(screen.getByText('홍길동')).toBeInTheDocument()
    })
  })

  it('출처 추가 버튼을 표시한다', async () => {
    const user = userEvent.setup()
    render(<SourcesCollapsible projectId="project-1" />)

    await waitFor(() => {
      expect(screen.getByText(/출처/)).toBeInTheDocument()
    })

    const toggleButton = screen.getByRole('button', { name: /출처/ })
    await user.click(toggleButton)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /추가/ })).toBeInTheDocument()
    })
  })

  it('출처 추가 폼이 표시된다', async () => {
    const user = userEvent.setup()
    render(<SourcesCollapsible projectId="project-1" />)

    await waitFor(() => {
      expect(screen.getByText(/출처/)).toBeInTheDocument()
    })

    const toggleButton = screen.getByRole('button', { name: /출처/ })
    await user.click(toggleButton)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /추가/ })).toBeInTheDocument()
    })

    const addButton = screen.getByRole('button', { name: /추가/ })
    await user.click(addButton)

    expect(screen.getByPlaceholderText(/제목/)).toBeInTheDocument()
  })

  it('출처 추가 시 API를 호출한다', async () => {
    const user = userEvent.setup()
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true, data: mockSources }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          data: {
            id: 'source-3',
            title: '새 출처',
            type: 'book',
          },
        }),
      })

    render(<SourcesCollapsible projectId="project-1" />)

    await waitFor(() => {
      expect(screen.getByText(/출처/)).toBeInTheDocument()
    })

    const toggleButton = screen.getByRole('button', { name: /출처/ })
    await user.click(toggleButton)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /추가/ })).toBeInTheDocument()
    })

    const addButton = screen.getByRole('button', { name: /추가/ })
    await user.click(addButton)

    const titleInput = screen.getByPlaceholderText(/제목/)
    await user.type(titleInput, '새 출처')

    const saveButton = screen.getByRole('button', { name: /저장/ })
    await user.click(saveButton)

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/projects/project-1/sources',
        expect.objectContaining({ method: 'POST' })
      )
    })
  })

  it('출처가 없으면 빈 상태 메시지를 표시한다', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true, data: [] }),
    })

    const user = userEvent.setup()
    render(<SourcesCollapsible projectId="project-1" />)

    await waitFor(() => {
      expect(screen.getByText(/출처/)).toBeInTheDocument()
    })

    const toggleButton = screen.getByRole('button', { name: /출처/ })
    await user.click(toggleButton)

    await waitFor(() => {
      expect(screen.getByText(/등록된 출처가 없습니다/)).toBeInTheDocument()
    })
  })

  it('출처 삭제 시 API를 호출한다', async () => {
    const user = userEvent.setup()
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true, data: mockSources }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      })

    // Mock window.confirm
    vi.spyOn(window, 'confirm').mockReturnValue(true)

    render(<SourcesCollapsible projectId="project-1" />)

    await waitFor(() => {
      expect(screen.getByText(/출처/)).toBeInTheDocument()
    })

    const toggleButton = screen.getByRole('button', { name: /출처/ })
    await user.click(toggleButton)

    await waitFor(() => {
      expect(screen.getByText('참고 도서')).toBeInTheDocument()
    })

    const deleteButtons = screen.getAllByRole('button', { name: /삭제/ })
    await user.click(deleteButtons[0])

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/projects/project-1/sources?sourceId=source-1',
        expect.objectContaining({ method: 'DELETE' })
      )
    })
  })
})
