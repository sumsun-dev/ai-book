import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import AuthorEditor from './AuthorEditor'
import type { Author } from '@/types/book'

describe('AuthorEditor', () => {
  const defaultProps = {
    authors: [] as Author[],
    onChange: vi.fn(),
  }

  it('빈 상태에서 안내 텍스트를 표시한다', () => {
    render(<AuthorEditor {...defaultProps} />)

    expect(screen.getByText(/저자 정보가 없습니다/)).toBeInTheDocument()
  })

  it('추가 버튼 클릭 시 빈 저자를 추가하고 편집 모드에 진입한다', () => {
    const onChange = vi.fn()
    render(<AuthorEditor authors={[]} onChange={onChange} />)

    fireEvent.click(screen.getByText('추가'))

    expect(onChange).toHaveBeenCalledWith([{ name: '', role: 'author' }])
  })

  it('이름 입력 시 onChange를 호출한다', () => {
    const onChange = vi.fn()
    const authors: Author[] = [{ name: '', role: 'author' }]
    render(<AuthorEditor authors={authors} onChange={onChange} />)

    // 편집 모드 진입
    fireEvent.click(screen.getByText('편집'))

    const nameInput = screen.getByPlaceholderText('저자 이름')
    fireEvent.change(nameInput, { target: { value: '홍길동' } })

    expect(onChange).toHaveBeenCalledWith([{ name: '홍길동', role: 'author' }])
  })

  it('역할 변경 시 onChange를 호출한다', () => {
    const onChange = vi.fn()
    const authors: Author[] = [{ name: '홍길동', role: 'author' }]
    render(<AuthorEditor authors={authors} onChange={onChange} />)

    fireEvent.click(screen.getByText('편집'))

    const roleSelect = screen.getByDisplayValue('저자')
    fireEvent.change(roleSelect, { target: { value: 'translator' } })

    expect(onChange).toHaveBeenCalledWith([{ name: '홍길동', role: 'translator' }])
  })

  it('삭제 버튼 클릭 시 해당 저자를 제거한다', () => {
    const onChange = vi.fn()
    const authors: Author[] = [
      { name: '저자1', role: 'author' },
      { name: '저자2', role: 'editor' },
    ]
    render(<AuthorEditor authors={authors} onChange={onChange} />)

    // 첫 번째 저자 편집 모드
    const editButtons = screen.getAllByText('편집')
    fireEvent.click(editButtons[0])

    fireEvent.click(screen.getByText('삭제'))

    expect(onChange).toHaveBeenCalledWith([{ name: '저자2', role: 'editor' }])
  })

  it('완료 버튼으로 편집 모드를 종료한다', () => {
    const authors: Author[] = [{ name: '홍길동', role: 'author' }]
    render(<AuthorEditor authors={authors} onChange={vi.fn()} />)

    fireEvent.click(screen.getByText('편집'))
    expect(screen.getByPlaceholderText('저자 이름')).toBeInTheDocument()

    fireEvent.click(screen.getByText('완료'))
    expect(screen.queryByPlaceholderText('저자 이름')).not.toBeInTheDocument()
  })

  it('위로/아래로 이동으로 순서를 변경한다', () => {
    const onChange = vi.fn()
    const authors: Author[] = [
      { name: '첫째', role: 'author' },
      { name: '둘째', role: 'editor' },
    ]
    render(<AuthorEditor authors={authors} onChange={onChange} />)

    // 두 번째 저자의 위로 이동 버튼 (disabled가 아닌 up 버튼)
    const upButtons = screen.getAllByRole('button').filter((btn) => {
      const svg = btn.querySelector('svg')
      return svg && !btn.hasAttribute('disabled') && btn.querySelector('path[d="M5 15l7-7 7 7"]')
    })
    // 두 번째 저자의 위로 버튼 클릭
    fireEvent.click(upButtons[0])

    expect(onChange).toHaveBeenCalledWith([
      { name: '둘째', role: 'editor' },
      { name: '첫째', role: 'author' },
    ])
  })

  it('첫 번째 저자의 위로 버튼은 비활성화된다', () => {
    const authors: Author[] = [
      { name: '첫째', role: 'author' },
      { name: '둘째', role: 'editor' },
    ]
    render(<AuthorEditor authors={authors} onChange={vi.fn()} />)

    // 위로 이동 버튼들 (M5 15l7-7 7 7 path를 가진 버튼)
    const allButtons = screen.getAllByRole('button')
    const upButtons = allButtons.filter((btn) =>
      btn.querySelector('path[d="M5 15l7-7 7 7"]'),
    )

    // 첫 번째 위로 버튼은 disabled
    expect(upButtons[0]).toBeDisabled()
    // 두 번째 위로 버튼은 활성화
    expect(upButtons[1]).not.toBeDisabled()
  })
})
