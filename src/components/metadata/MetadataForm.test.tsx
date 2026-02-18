import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { axe } from 'vitest-axe'
import MetadataForm from './MetadataForm'

vi.mock('./AuthorEditor', () => ({
  default: (props: Record<string, unknown>) => (
    <div data-testid="author-editor" onClick={() => (props.onChange as (v: never[]) => void)([])} />
  ),
}))

vi.mock('./CategoryEditor', () => ({
  default: (props: Record<string, unknown>) => (
    <div
      data-testid="category-editor"
      onClick={() => (props.onChange as (v: never[]) => void)([])}
    />
  ),
}))

const mockMetadata = {
  subtitle: '테스트 부제',
  authors: [{ name: '홍길동', role: 'author' }],
  publisher: '테스트출판사',
  publisherAddress: '서울시',
  publishDate: '2026-01-01T00:00:00.000Z',
  edition: '초판',
  printRun: 1000,
  categories: [],
  keywords: ['소설', '판타지'],
  language: 'ko',
  copyright: '(C) 2026',
  license: 'CC-BY',
}

describe('MetadataForm', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('로딩 중 스피너를 표시한다', () => {
    global.fetch = vi.fn(() => new Promise(() => {})) as unknown as typeof fetch

    const { container } = render(<MetadataForm projectId="test-1" />)

    expect(container.querySelector('.animate-spin')).toBeInTheDocument()
  })

  it('메타데이터를 로드하여 폼에 표시한다', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      json: () => Promise.resolve({ data: mockMetadata }),
    })

    render(<MetadataForm projectId="test-1" />)

    await waitFor(() => {
      expect(screen.getByDisplayValue('테스트 부제')).toBeInTheDocument()
    })

    expect(screen.getByDisplayValue('테스트출판사')).toBeInTheDocument()
    expect(screen.getByDisplayValue('서울시')).toBeInTheDocument()
    expect(screen.getByDisplayValue('초판')).toBeInTheDocument()
    expect(screen.getByDisplayValue('1000')).toBeInTheDocument()
    expect(screen.getByDisplayValue('소설, 판타지')).toBeInTheDocument()
    expect(screen.getByTestId('author-editor')).toBeInTheDocument()
    expect(screen.getByTestId('category-editor')).toBeInTheDocument()
  })

  it('메타데이터 로드 실패 시 에러 메시지를 표시한다', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Network error'))

    render(<MetadataForm projectId="test-1" />)

    await waitFor(() => {
      expect(screen.getByText('fetchError')).toBeInTheDocument()
    })
  })

  it('폼 제출 시 POST 요청을 보낸다', async () => {
    const fetchMock = vi.fn()
    // 첫 번째: GET 로드
    fetchMock.mockResolvedValueOnce({
      json: () => Promise.resolve({ data: null }),
    })
    // 두 번째: POST 저장
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ data: mockMetadata }),
    })
    global.fetch = fetchMock

    render(<MetadataForm projectId="test-1" />)

    await waitFor(() => {
      expect(screen.getByText('save')).toBeInTheDocument()
    })

    fireEvent.submit(screen.getByText('save').closest('form')!)

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/projects/test-1/metadata',
        expect.objectContaining({ method: 'POST' }),
      )
    })
  })

  it('저장 성공 시 onSave와 onClose를 호출한다', async () => {
    const onSave = vi.fn()
    const onClose = vi.fn()

    const fetchMock = vi.fn()
    fetchMock.mockResolvedValueOnce({
      json: () => Promise.resolve({ data: null }),
    })
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ data: mockMetadata }),
    })
    global.fetch = fetchMock

    render(<MetadataForm projectId="test-1" onSave={onSave} onClose={onClose} />)

    await waitFor(() => {
      expect(screen.getByText('save')).toBeInTheDocument()
    })

    fireEvent.submit(screen.getByText('save').closest('form')!)

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith(mockMetadata)
      expect(onClose).toHaveBeenCalled()
    })
  })

  it('저장 실패 시 에러 메시지를 표시한다', async () => {
    const fetchMock = vi.fn()
    fetchMock.mockResolvedValueOnce({
      json: () => Promise.resolve({ data: null }),
    })
    fetchMock.mockResolvedValueOnce({
      ok: false,
    })
    global.fetch = fetchMock

    render(<MetadataForm projectId="test-1" />)

    await waitFor(() => {
      expect(screen.getByText('save')).toBeInTheDocument()
    })

    fireEvent.submit(screen.getByText('save').closest('form')!)

    await waitFor(() => {
      expect(screen.getByText('saveError')).toBeInTheDocument()
    })
  })

  it('저장 중 버튼이 비활성화되고 텍스트가 변경된다', async () => {
    const fetchMock = vi.fn()
    fetchMock.mockResolvedValueOnce({
      json: () => Promise.resolve({ data: null }),
    })
    // POST가 오래 걸리는 상황 시뮬레이션
    fetchMock.mockImplementationOnce(
      () => new Promise((resolve) => setTimeout(() => resolve({ ok: true, json: () => Promise.resolve({ data: mockMetadata }) }), 1000)),
    )
    global.fetch = fetchMock

    render(<MetadataForm projectId="test-1" />)

    await waitFor(() => {
      expect(screen.getByText('save')).toBeInTheDocument()
    })

    fireEvent.submit(screen.getByText('save').closest('form')!)

    await waitFor(() => {
      const saveButton = screen.getByText('saving')
      expect(saveButton).toBeInTheDocument()
      expect(saveButton.closest('button')).toBeDisabled()
    })
  })

  it('취소 버튼 클릭 시 onClose를 호출한다', async () => {
    const onClose = vi.fn()

    global.fetch = vi.fn().mockResolvedValue({
      json: () => Promise.resolve({ data: null }),
    })

    render(<MetadataForm projectId="test-1" onClose={onClose} />)

    await waitFor(() => {
      expect(screen.getByText('cancel')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('cancel'))

    expect(onClose).toHaveBeenCalled()
  })
})

describe('MetadataForm a11y', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('axe 접근성 위반이 없어야 한다', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      json: () => Promise.resolve({ data: null }),
    })

    const { container } = render(<MetadataForm projectId="test-1" />)

    await waitFor(() => {
      expect(screen.getByText('save')).toBeInTheDocument()
    })

    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it('11개 필드에 htmlFor+id 연결이 되어야 한다', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      json: () => Promise.resolve({ data: null }),
    })

    render(<MetadataForm projectId="test-1" />)

    await waitFor(() => {
      expect(screen.getByText('save')).toBeInTheDocument()
    })

    // 각 label의 텍스트로 input을 찾을 수 있어야 함 (htmlFor+id 연결)
    expect(screen.getByLabelText('fields.subtitle')).toBeInTheDocument()
    expect(screen.getByLabelText('fields.publisher')).toBeInTheDocument()
    expect(screen.getByLabelText('fields.publishDate')).toBeInTheDocument()
    expect(screen.getByLabelText('fields.publisherAddress')).toBeInTheDocument()
    expect(screen.getByLabelText('fields.edition')).toBeInTheDocument()
    expect(screen.getByLabelText('fields.printRun')).toBeInTheDocument()
    expect(screen.getByLabelText('fields.keywords')).toBeInTheDocument()
    expect(screen.getByLabelText('fields.language')).toBeInTheDocument()
    expect(screen.getByLabelText('fields.copyrightNotice')).toBeInTheDocument()
    expect(screen.getByLabelText('fields.license')).toBeInTheDocument()
  })

  it('에러 메시지에 role="alert"가 적용되어야 한다', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Network error'))

    render(<MetadataForm projectId="test-1" />)

    await waitFor(() => {
      const alert = screen.getByRole('alert')
      expect(alert).toBeInTheDocument()
      expect(alert).toHaveTextContent('fetchError')
    })
  })
})
