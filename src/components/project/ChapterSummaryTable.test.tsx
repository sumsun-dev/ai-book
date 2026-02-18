import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ChapterSummaryTable } from './ChapterSummaryTable'
import type { Chapter } from '@/types/book'

const mockChapters: Chapter[] = [
  {
    id: 'ch1',
    number: 1,
    title: '시작',
    content: '첫 번째 챕터 내용입니다',
    status: 'approved',
    revisions: [],
  },
  {
    id: 'ch2',
    number: 2,
    title: '전개',
    content: '두 번째',
    status: 'writing',
    revisions: [],
  },
]

describe('ChapterSummaryTable', () => {
  it('should render chapter rows', () => {
    render(<ChapterSummaryTable chapters={mockChapters} />)
    expect(screen.getByText('시작')).toBeInTheDocument()
    expect(screen.getByText('전개')).toBeInTheDocument()
  })

  it('should show empty state when no chapters', () => {
    render(<ChapterSummaryTable chapters={[]} />)
    expect(screen.getByText('아직 챕터가 없습니다')).toBeInTheDocument()
  })

  it('should show status labels in Korean', () => {
    render(<ChapterSummaryTable chapters={mockChapters} />)
    expect(screen.getByText('완료')).toBeInTheDocument()
    expect(screen.getByText('집필 중')).toBeInTheDocument()
  })

  it('should call onChapterClick when row is clicked', () => {
    const onClick = vi.fn()
    render(
      <ChapterSummaryTable
        chapters={mockChapters}
        onChapterClick={onClick}
      />
    )
    fireEvent.click(screen.getByText('시작'))
    expect(onClick).toHaveBeenCalledWith(1)
  })
})
