import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import NotFound from './not-found'

describe('NotFound', () => {
  it('should render 404 text', () => {
    render(<NotFound />)
    expect(screen.getByText('404')).toBeInTheDocument()
  })

  it('should render descriptive heading', () => {
    render(<NotFound />)
    expect(
      screen.getByText('페이지를 찾을 수 없습니다')
    ).toBeInTheDocument()
  })

  it('should render link to projects page', () => {
    render(<NotFound />)
    const link = screen.getByText('프로젝트 목록으로')
    expect(link.closest('a')).toHaveAttribute('href', '/projects')
  })

  it('should have dark mode classes', () => {
    const { container } = render(<NotFound />)
    const outerDiv = container.firstElementChild as HTMLElement
    expect(outerDiv.className).toContain('dark:bg-neutral-950')
  })
})
