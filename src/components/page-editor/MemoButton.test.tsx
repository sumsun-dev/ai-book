import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import MemoButton from './MemoButton'

describe('MemoButton', () => {
  it('메모 아이콘을 표시한다', () => {
    render(<MemoButton onClick={() => {}} isActive={false} memoCount={0} />)

    const button = screen.getByRole('button', { name: /메모/ })
    expect(button).toBeInTheDocument()
  })

  it('메모 개수가 0보다 크면 배지를 표시한다', () => {
    render(<MemoButton onClick={() => {}} isActive={false} memoCount={5} />)

    expect(screen.getByText('5')).toBeInTheDocument()
  })

  it('메모 개수가 0이면 배지를 표시하지 않는다', () => {
    render(<MemoButton onClick={() => {}} isActive={false} memoCount={0} />)

    expect(screen.queryByText('0')).not.toBeInTheDocument()
  })

  it('클릭 시 onClick을 호출한다', async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()
    render(<MemoButton onClick={onClick} isActive={false} memoCount={0} />)

    const button = screen.getByRole('button', { name: /메모/ })
    await user.click(button)

    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('isActive=true일 때 활성 스타일이 적용된다', () => {
    render(<MemoButton onClick={() => {}} isActive={true} memoCount={0} />)

    const button = screen.getByRole('button', { name: /메모/ })
    expect(button).toHaveClass('bg-neutral-900')
  })

  it('isActive=false일 때 비활성 스타일이 적용된다', () => {
    render(<MemoButton onClick={() => {}} isActive={false} memoCount={0} />)

    const button = screen.getByRole('button', { name: /메모/ })
    expect(button).not.toHaveClass('bg-neutral-900')
  })
})
