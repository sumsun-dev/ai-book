import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import ErrorPage from './error'

describe('ErrorPage', () => {
  const defaultProps = {
    error: new Error('테스트 에러'),
    reset: vi.fn(),
  }

  it('should render error message', () => {
    render(<ErrorPage {...defaultProps} />)
    expect(screen.getByText('테스트 에러')).toBeInTheDocument()
  })

  it('should render default message when error has no message', () => {
    render(<ErrorPage error={new Error('')} reset={vi.fn()} />)
    expect(
      screen.getByText('fallback')
    ).toBeInTheDocument()
  })

  it('should call reset when retry button is clicked', () => {
    const reset = vi.fn()
    render(<ErrorPage error={new Error('err')} reset={reset} />)
    fireEvent.click(screen.getByText('retry'))
    expect(reset).toHaveBeenCalledOnce()
  })

  it('should render link to projects page', () => {
    render(<ErrorPage {...defaultProps} />)
    const link = screen.getByText('goHome')
    expect(link).toBeInTheDocument()
    expect(link.closest('a')).toHaveAttribute('href', '/projects')
  })

  it('should render error icon', () => {
    render(<ErrorPage {...defaultProps} />)
    const svg = document.querySelector('svg')
    expect(svg).toBeInTheDocument()
  })
})
