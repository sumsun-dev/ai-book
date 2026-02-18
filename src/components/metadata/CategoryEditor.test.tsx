import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import CategoryEditor from './CategoryEditor'
import type { BookCategory } from '@/types/book'

describe('CategoryEditor', () => {
  const defaultProps = {
    categories: [] as BookCategory[],
    onChange: vi.fn(),
  }

  it('빈 상태에서 안내 텍스트를 표시한다', () => {
    render(<CategoryEditor {...defaultProps} />)

    expect(screen.getByText('카테고리가 없습니다. 추가 버튼을 눌러 분류를 등록하세요.')).toBeInTheDocument()
  })

  it('추가 버튼 클릭 시 폼이 표시된다', () => {
    render(<CategoryEditor {...defaultProps} />)

    fireEvent.click(screen.getByText('추가'))

    expect(screen.getByText('분류 체계')).toBeInTheDocument()
    expect(screen.getByText('선택하세요')).toBeInTheDocument()
  })

  it('BISAC 카테고리를 추가한다', () => {
    const onChange = vi.fn()
    render(<CategoryEditor categories={[]} onChange={onChange} />)

    fireEvent.click(screen.getByText('추가'))

    // BISAC이 기본 선택
    const categorySelect = screen.getAllByRole('combobox')[1]
    fireEvent.change(categorySelect, { target: { value: 'FIC000000' } })

    // 추가 버튼 클릭 (폼 내부의 추가 버튼)
    const buttons = screen.getAllByText('추가')
    fireEvent.click(buttons[buttons.length - 1])

    expect(onChange).toHaveBeenCalledWith([
      { system: 'BISAC', code: 'FIC000000', name: 'Fiction / General' },
    ])
  })

  it('KDC 카테고리를 추가한다', () => {
    const onChange = vi.fn()
    render(<CategoryEditor categories={[]} onChange={onChange} />)

    fireEvent.click(screen.getByText('추가'))

    // 시스템을 KDC로 변경
    const systemSelect = screen.getAllByRole('combobox')[0]
    fireEvent.change(systemSelect, { target: { value: 'KDC' } })

    // KDC 카테고리 선택
    const categorySelect = screen.getAllByRole('combobox')[1]
    fireEvent.change(categorySelect, { target: { value: '800' } })

    const buttons = screen.getAllByText('추가')
    fireEvent.click(buttons[buttons.length - 1])

    expect(onChange).toHaveBeenCalledWith([
      { system: 'KDC', code: '800', name: '문학 (Literature)' },
    ])
  })

  it('custom 카테고리를 직접 입력한다', () => {
    const onChange = vi.fn()
    render(<CategoryEditor categories={[]} onChange={onChange} />)

    fireEvent.click(screen.getByText('추가'))

    // 시스템을 custom으로 변경
    const systemSelect = screen.getAllByRole('combobox')[0]
    fireEvent.change(systemSelect, { target: { value: 'custom' } })

    // 코드와 이름 입력
    const codeInput = screen.getByPlaceholderText('예: 813.6')
    const nameInput = screen.getByPlaceholderText('예: American Fiction')
    fireEvent.change(codeInput, { target: { value: 'MY001' } })
    fireEvent.change(nameInput, { target: { value: 'My Category' } })

    const buttons = screen.getAllByText('추가')
    fireEvent.click(buttons[buttons.length - 1])

    expect(onChange).toHaveBeenCalledWith([
      { system: 'custom', code: 'MY001', name: 'My Category' },
    ])
  })

  it('카테고리를 삭제한다', () => {
    const onChange = vi.fn()
    const categories: BookCategory[] = [
      { system: 'BISAC', code: 'FIC000000', name: 'Fiction / General' },
      { system: 'KDC', code: '800', name: '문학 (Literature)' },
    ]

    render(<CategoryEditor categories={categories} onChange={onChange} />)

    // 첫 번째 카테고리 삭제
    const deleteButtons = screen.getAllByRole('button', { name: /삭제/ })
    fireEvent.click(deleteButtons[0])

    expect(onChange).toHaveBeenCalledWith([
      { system: 'KDC', code: '800', name: '문학 (Literature)' },
    ])
  })

  it('기존 카테고리 목록을 렌더링한다', () => {
    const categories: BookCategory[] = [
      { system: 'BISAC', code: 'FIC000000', name: 'Fiction / General' },
    ]

    render(<CategoryEditor categories={categories} onChange={vi.fn()} />)

    expect(screen.getByText('FIC000000 - Fiction / General')).toBeInTheDocument()
    expect(screen.getByText('BISAC')).toBeInTheDocument()
  })

  it('중복 카테고리는 추가하지 않는다', () => {
    const onChange = vi.fn()
    const categories: BookCategory[] = [
      { system: 'BISAC', code: 'FIC000000', name: 'Fiction / General' },
    ]

    render(<CategoryEditor categories={categories} onChange={onChange} />)

    fireEvent.click(screen.getByText('추가'))

    const categorySelect = screen.getAllByRole('combobox')[1]
    fireEvent.change(categorySelect, { target: { value: 'FIC000000' } })

    const buttons = screen.getAllByText('추가')
    fireEvent.click(buttons[buttons.length - 1])

    expect(onChange).not.toHaveBeenCalled()
  })

  it('취소 버튼으로 폼을 닫는다', () => {
    render(<CategoryEditor {...defaultProps} />)

    fireEvent.click(screen.getByText('추가'))
    expect(screen.getByText('분류 체계')).toBeInTheDocument()

    fireEvent.click(screen.getByText('취소'))
    expect(screen.queryByText('분류 체계')).not.toBeInTheDocument()
  })

  it('빈 custom 입력은 추가하지 않는다', () => {
    const onChange = vi.fn()
    render(<CategoryEditor categories={[]} onChange={onChange} />)

    fireEvent.click(screen.getByText('추가'))

    const systemSelect = screen.getAllByRole('combobox')[0]
    fireEvent.change(systemSelect, { target: { value: 'custom' } })

    // 빈 상태에서 추가 시도
    const buttons = screen.getAllByText('추가')
    fireEvent.click(buttons[buttons.length - 1])

    expect(onChange).not.toHaveBeenCalled()
  })

  it('DDC 시스템은 직접 입력 폼을 표시한다', () => {
    render(<CategoryEditor {...defaultProps} />)

    fireEvent.click(screen.getByText('추가'))

    const systemSelect = screen.getAllByRole('combobox')[0]
    fireEvent.change(systemSelect, { target: { value: 'DDC' } })

    expect(screen.getByPlaceholderText('예: 813.6')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('예: American Fiction')).toBeInTheDocument()
  })

  it('선택 없이 추가 버튼은 작동하지 않는다', () => {
    const onChange = vi.fn()
    render(<CategoryEditor categories={[]} onChange={onChange} />)

    fireEvent.click(screen.getByText('추가'))

    // 카테고리 미선택 상태에서 추가 시도
    const buttons = screen.getAllByText('추가')
    fireEvent.click(buttons[buttons.length - 1])

    expect(onChange).not.toHaveBeenCalled()
  })
})
