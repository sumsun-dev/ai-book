import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import ISBNInput from './ISBNInput'
import { formatISBN, validateAndParseISBN, generateDraftISBN } from '@/lib/isbn'

vi.mock('@/lib/isbn', () => ({
  formatISBN: vi.fn((isbn: string) => `${isbn.slice(0, 3)}-${isbn.slice(3, 5)}-${isbn.slice(5)}`),
  validateAndParseISBN: vi.fn((isbn: string) => {
    if (isbn === '9788932920993') {
      return { isValid: true, isbn13: '9788932920993', isbn10: '8932920990' }
    }
    return { isValid: false, error: '유효하지 않은 ISBN입니다.' }
  }),
  generateDraftISBN: vi.fn(() => '9788900000001'),
}))

vi.mock('@/lib/barcode', () => ({
  generateBarcodeDataURL: vi.fn(() => 'data:image/png;base64,mock'),
  downloadBarcode: vi.fn(),
}))

const savedISBNData = {
  id: 'isbn-1',
  projectId: 'test-1',
  isbn13: '9788932920993',
  isbn10: '8932920990',
  checkDigit: '3',
  prefix: '978',
  groupCode: '89',
  registrant: '329',
  publication: '20993',
  barcodeUrl: 'data:image/png;base64,saved',
  isValid: true,
  assignedAt: '2026-01-15T00:00:00.000Z',
}

describe('ISBNInput', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(formatISBN).mockImplementation(
      (isbn: string) => `${isbn.slice(0, 3)}-${isbn.slice(3, 5)}-${isbn.slice(5)}`,
    )
    vi.mocked(validateAndParseISBN).mockImplementation((isbn: string) => {
      if (isbn === '9788932920993') {
        return {
          isValid: true,
          isbn13: '9788932920993',
          isbn10: '8932920990',
          checkDigit: '3',
          prefix: '978',
          groupCode: '89',
          registrant: '329',
          publication: '20993',
        }
      }
      return {
        isValid: false,
        error: '유효하지 않은 ISBN입니다.',
        isbn13: '',
        isbn10: '',
        checkDigit: '',
        prefix: '',
        groupCode: '',
        registrant: '',
        publication: '',
      }
    })
    vi.mocked(generateDraftISBN).mockReturnValue('9788900000001')
  })

  it('로딩 중 스피너를 표시한다', () => {
    global.fetch = vi.fn(() => new Promise(() => {})) as unknown as typeof fetch

    const { container } = render(<ISBNInput projectId="test-1" />)

    expect(container.querySelector('.animate-spin')).toBeInTheDocument()
  })

  it('저장된 ISBN이 있으면 폼에 표시한다', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      json: () => Promise.resolve({ data: savedISBNData }),
    })

    render(<ISBNInput projectId="test-1" />)

    await waitFor(() => {
      const input = screen.getByPlaceholderText('978-89-xxxxx-xx-x') as HTMLInputElement
      expect(input.value).toContain('978')
    })
  })

  it('유효한 ISBN 입력 시 체크 아이콘을 표시한다', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      json: () => Promise.resolve({ data: null }),
    })

    const { container } = render(<ISBNInput projectId="test-1" />)

    await waitFor(() => {
      expect(screen.getByPlaceholderText('978-89-xxxxx-xx-x')).toBeInTheDocument()
    })

    const input = screen.getByPlaceholderText('978-89-xxxxx-xx-x')
    fireEvent.change(input, { target: { value: '9788932920993' } })

    const checkIcon = container.querySelector('path[d="M5 13l4 4L19 7"]')
    expect(checkIcon).toBeInTheDocument()
  })

  it('잘못된 ISBN 입력 시 에러를 표시한다', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      json: () => Promise.resolve({ data: null }),
    })

    const { container } = render(<ISBNInput projectId="test-1" />)

    await waitFor(() => {
      expect(screen.getByPlaceholderText('978-89-xxxxx-xx-x')).toBeInTheDocument()
    })

    const input = screen.getByPlaceholderText('978-89-xxxxx-xx-x')
    fireEvent.change(input, { target: { value: '9781234567890' } })

    const xIcon = container.querySelector('path[d="M6 18L18 6M6 6l12 12"]')
    expect(xIcon).toBeInTheDocument()
  })

  it('저장 버튼 클릭 시 POST 요청을 보낸다', async () => {
    const fetchMock = vi.fn()
    fetchMock.mockResolvedValueOnce({
      json: () => Promise.resolve({ data: null }),
    })
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ data: savedISBNData }),
    })
    global.fetch = fetchMock

    render(<ISBNInput projectId="test-1" />)

    await waitFor(() => {
      expect(screen.getByPlaceholderText('978-89-xxxxx-xx-x')).toBeInTheDocument()
    })

    const input = screen.getByPlaceholderText('978-89-xxxxx-xx-x')
    fireEvent.change(input, { target: { value: '9788932920993' } })

    fireEvent.click(screen.getByText('저장'))

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/projects/test-1/isbn',
        expect.objectContaining({ method: 'POST' }),
      )
    })
  })

  it('테스트용 ISBN 생성 버튼이 동작한다', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      json: () => Promise.resolve({ data: null }),
    })

    render(<ISBNInput projectId="test-1" />)

    await waitFor(() => {
      expect(screen.getByText('테스트용 ISBN 생성')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('테스트용 ISBN 생성'))

    expect(generateDraftISBN).toHaveBeenCalled()

    const input = screen.getByPlaceholderText('978-89-xxxxx-xx-x') as HTMLInputElement
    expect(input.value).toContain('978')
  })

  it('삭제 확인 후 DELETE 요청을 보낸다', async () => {
    const fetchMock = vi.fn()
    fetchMock.mockResolvedValueOnce({
      json: () => Promise.resolve({ data: savedISBNData }),
    })
    fetchMock.mockResolvedValueOnce({
      ok: true,
    })
    global.fetch = fetchMock

    window.confirm = vi.fn().mockReturnValue(true)

    render(<ISBNInput projectId="test-1" />)

    await waitFor(() => {
      expect(screen.getByText('삭제')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('삭제'))

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith('/api/projects/test-1/isbn', { method: 'DELETE' })
    })
  })

  it('유효하지 않은 상태에서 저장 버튼이 비활성화되고 에러 텍스트를 표시한다', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      json: () => Promise.resolve({ data: null }),
    })

    render(<ISBNInput projectId="test-1" />)

    await waitFor(() => {
      expect(screen.getByPlaceholderText('978-89-xxxxx-xx-x')).toBeInTheDocument()
    })

    const input = screen.getByPlaceholderText('978-89-xxxxx-xx-x')
    fireEvent.change(input, { target: { value: '9781234567890' } })

    // 저장 버튼이 비활성화됨
    const saveButton = screen.getByText('저장').closest('button')
    expect(saveButton).toBeDisabled()

    // 유효성 에러 텍스트 표시
    expect(screen.getByText('유효하지 않은 ISBN입니다.')).toBeInTheDocument()
  })
})
