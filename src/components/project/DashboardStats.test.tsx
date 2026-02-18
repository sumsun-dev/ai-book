import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { DashboardStats } from './DashboardStats'
import type { ProjectStats } from '@/lib/utils/project-stats'

const mockStats: ProjectStats = {
  totalChapters: 10,
  completedChapters: 3,
  totalWords: 15000,
  completionPercent: 30,
  statusBreakdown: { pending: 5, writing: 2, approved: 3 },
}

describe('DashboardStats', () => {
  it('should render 4 stat cards', () => {
    render(<DashboardStats stats={mockStats} />)
    expect(screen.getByText('전체 챕터')).toBeInTheDocument()
    expect(screen.getByText('완료된 챕터')).toBeInTheDocument()
    expect(screen.getByText('총 단어 수')).toBeInTheDocument()
    expect(screen.getByText('진행률')).toBeInTheDocument()
  })

  it('should display formatted values', () => {
    render(<DashboardStats stats={mockStats} />)
    expect(screen.getByText('10개')).toBeInTheDocument()
    expect(screen.getByText('3개')).toBeInTheDocument()
    expect(screen.getByText('15,000')).toBeInTheDocument()
    expect(screen.getByText('30%')).toBeInTheDocument()
  })

  it('should render with dark mode classes', () => {
    const { container } = render(<DashboardStats stats={mockStats} />)
    const card = container.querySelector('.border-neutral-200')
    expect(card?.className).toContain('dark:border-neutral-800')
  })

  it('should handle zero values', () => {
    const zeroStats: ProjectStats = {
      totalChapters: 0,
      completedChapters: 0,
      totalWords: 0,
      completionPercent: 0,
      statusBreakdown: {},
    }
    render(<DashboardStats stats={zeroStats} />)
    const zeroElements = screen.getAllByText('0개')
    expect(zeroElements.length).toBe(2)
    expect(screen.getByText('0%')).toBeInTheDocument()
  })
})
