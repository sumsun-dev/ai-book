import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { GenerationProgress } from './GenerationProgress'

describe('GenerationProgress', () => {
  const defaultProps = {
    isStreaming: true,
    streamedText: '테스트 텍스트 입니다 총 네 단어',
    agentPhase: 'writing' as const,
    estimatedTotalWords: 100,
    onStop: vi.fn(),
  }

  it('should not render when not streaming', () => {
    const { container } = render(
      <GenerationProgress {...defaultProps} isStreaming={false} />
    )
    expect(container.firstChild).toBeNull()
  })

  it('should show phase label', () => {
    render(<GenerationProgress {...defaultProps} />)
    expect(screen.getByText('집필 중...')).toBeInTheDocument()
  })

  it('should show progress bar', () => {
    render(<GenerationProgress {...defaultProps} />)
    const progressbar = screen.getByRole('progressbar')
    expect(progressbar).toBeInTheDocument()
  })

  it('should call onStop when cancel button clicked', () => {
    const onStop = vi.fn()
    render(<GenerationProgress {...defaultProps} onStop={onStop} />)
    fireEvent.click(screen.getByText('생성 중단'))
    expect(onStop).toHaveBeenCalledOnce()
  })

  it('should display word count', () => {
    render(
      <GenerationProgress
        {...defaultProps}
        streamedText="하나 둘 셋 넷 다섯"
      />
    )
    expect(screen.getByText('5단어')).toBeInTheDocument()
  })
})
