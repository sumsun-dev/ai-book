import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { axe } from 'vitest-axe'
import { AIChatInput } from '../AIChatInput'

const defaultProps = {
  onSend: vi.fn(),
  isLoading: false,
  disabled: false,
}

describe('AIChatInput a11y', () => {
  it('axe 접근성 위반이 없어야 한다', async () => {
    const { container } = render(<AIChatInput {...defaultProps} />)
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it('textarea에 aria-label이 있어야 한다', () => {
    render(<AIChatInput {...defaultProps} />)
    const textarea = screen.getByRole('textbox')
    expect(textarea).toHaveAttribute('aria-label')
    expect(textarea.getAttribute('aria-label')).toBeTruthy()
  })

  it('전송 버튼에 aria-label이 있어야 한다', () => {
    render(<AIChatInput {...defaultProps} />)
    const sendButton = screen.getByRole('button', { name: /전송|보내기|send|sendLabel/i })
    expect(sendButton).toBeInTheDocument()
  })
})
