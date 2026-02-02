import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import AIEditModal from './AIEditModal'

describe('AIEditModal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    selectedText: '원본 텍스트입니다.',
    editInstruction: '',
    onInstructionChange: vi.fn(),
    onSubmit: vi.fn(),
    isEditing: false,
  }

  it('모달이 열려있을 때 컨텐츠를 표시한다', () => {
    render(<AIEditModal {...defaultProps} />)

    expect(screen.getByText('AI 수정 요청')).toBeInTheDocument()
    expect(screen.getByText('원본 텍스트입니다.')).toBeInTheDocument()
  })

  it('isOpen=false일 때 모달을 표시하지 않는다', () => {
    render(<AIEditModal {...defaultProps} isOpen={false} />)

    expect(screen.queryByText('AI 수정 요청')).not.toBeInTheDocument()
  })

  it('빠른 수정 버튼 클릭 시 지시를 업데이트한다', async () => {
    const user = userEvent.setup()
    const onInstructionChange = vi.fn()
    render(<AIEditModal {...defaultProps} onInstructionChange={onInstructionChange} />)

    const quickButton = screen.getByRole('button', { name: '더 간결하게' })
    await user.click(quickButton)

    expect(onInstructionChange).toHaveBeenCalledWith('더 간결하게')
  })

  it('수정 버튼 클릭 시 onSubmit이 호출된다', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    render(<AIEditModal {...defaultProps} editInstruction="더 간결하게" onSubmit={onSubmit} />)

    const submitButton = screen.getByRole('button', { name: 'AI로 수정하기' })
    await user.click(submitButton)

    expect(onSubmit).toHaveBeenCalled()
  })

  it('editInstruction이 빈 문자열이면 수정 버튼이 비활성화된다', () => {
    render(<AIEditModal {...defaultProps} editInstruction="" />)

    const submitButton = screen.getByRole('button', { name: 'AI로 수정하기' })
    expect(submitButton).toBeDisabled()
  })

  it('isEditing=true일 때 로딩 상태를 표시한다', () => {
    render(<AIEditModal {...defaultProps} isEditing={true} editInstruction="테스트" />)

    expect(screen.getByText('수정 중...')).toBeInTheDocument()
  })

  it('취소 버튼 클릭 시 onClose가 호출된다', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    render(<AIEditModal {...defaultProps} onClose={onClose} />)

    const cancelButton = screen.getByRole('button', { name: '취소' })
    await user.click(cancelButton)

    expect(onClose).toHaveBeenCalled()
  })

  it('긴 선택 텍스트는 잘린다', () => {
    const longText = 'a'.repeat(400)
    render(<AIEditModal {...defaultProps} selectedText={longText} />)

    expect(screen.getByText(/\.\.\.$/)).toBeInTheDocument()
  })

  it('지시 입력 필드가 있다', () => {
    render(<AIEditModal {...defaultProps} />)

    const textarea = screen.getByPlaceholderText(/더 생동감 있게/)
    expect(textarea).toBeInTheDocument()
  })

  it('지시 입력 시 onInstructionChange가 호출된다', async () => {
    const user = userEvent.setup()
    const onInstructionChange = vi.fn()
    render(<AIEditModal {...defaultProps} onInstructionChange={onInstructionChange} />)

    const textarea = screen.getByPlaceholderText(/더 생동감 있게/)
    await user.type(textarea, '새 지시')

    expect(onInstructionChange).toHaveBeenCalled()
  })
})
