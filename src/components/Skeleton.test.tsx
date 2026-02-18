import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import {
  Skeleton,
  SkeletonText,
  SkeletonCard,
  SkeletonAvatar,
  SkeletonButton,
} from './Skeleton'

describe('Skeleton', () => {
  it('should render with role="status"', () => {
    render(<Skeleton />)
    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('should apply custom className', () => {
    render(<Skeleton className="h-8 w-32" />)
    const el = screen.getByRole('status')
    expect(el.className).toContain('h-8')
    expect(el.className).toContain('w-32')
  })

  it('should have animate-pulse and dark mode classes', () => {
    render(<Skeleton />)
    const el = screen.getByRole('status')
    expect(el.className).toContain('animate-pulse')
    expect(el.className).toContain('bg-neutral-200')
    expect(el.className).toContain('dark:bg-neutral-700')
  })
})

describe('SkeletonText', () => {
  it('should render default 3 lines', () => {
    render(<SkeletonText />)
    const container = screen.getByRole('status')
    expect(container.children).toHaveLength(3)
  })

  it('should render last line at 75% width', () => {
    render(<SkeletonText lines={2} />)
    const container = screen.getByRole('status')
    const lastLine = container.children[1] as HTMLElement
    expect(lastLine.className).toContain('w-3/4')
  })
})

describe('SkeletonCard', () => {
  it('should render cover placeholder and text lines', () => {
    render(<SkeletonCard />)
    const container = screen.getByRole('status')
    const cover = container.querySelector('.aspect-\\[3\\/4\\]')
    expect(cover).toBeInTheDocument()
  })

  it('should have animate-pulse on cover', () => {
    render(<SkeletonCard />)
    const container = screen.getByRole('status')
    const cover = container.children[0] as HTMLElement
    expect(cover.className).toContain('animate-pulse')
  })
})

describe('SkeletonAvatar', () => {
  it('should render with rounded-full', () => {
    render(<SkeletonAvatar />)
    const el = screen.getByRole('status')
    expect(el.className).toContain('rounded-full')
  })

  it('should apply size classes', () => {
    const { rerender } = render(<SkeletonAvatar size="sm" />)
    expect(screen.getByRole('status').className).toContain('w-8')

    rerender(<SkeletonAvatar size="lg" />)
    expect(screen.getByRole('status').className).toContain('w-16')
  })
})

describe('SkeletonButton', () => {
  it('should render with default width', () => {
    render(<SkeletonButton />)
    const el = screen.getByRole('status')
    expect(el.style.width).toBe('120px')
  })
})
