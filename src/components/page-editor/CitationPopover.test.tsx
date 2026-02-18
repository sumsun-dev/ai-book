import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { CitationPopover } from './CitationPopover'
import type { SourceInfo } from '@/lib/citation'

const mockSources: SourceInfo[] = [
  {
    id: 'src-1',
    title: '테스트 출처',
    author: '김저자',
    url: 'https://example.com',
    type: 'book',
    notes: '테스트 노트',
  },
]

const defaultProps = {
  sourceId: 'src-1',
  index: 1,
  sources: mockSources,
  position: { top: 100, left: 200 },
  onClose: vi.fn(),
}

describe('CitationPopover', () => {
  it('should render source title', () => {
    render(<CitationPopover {...defaultProps} />)
    expect(screen.getByText('테스트 출처')).toBeInTheDocument()
  })

  it('should render author', () => {
    render(<CitationPopover {...defaultProps} />)
    expect(screen.getByText('김저자')).toBeInTheDocument()
  })

  it('should render URL as link', () => {
    render(<CitationPopover {...defaultProps} />)
    const link = screen.getByText('https://example.com')
    expect(link.closest('a')).toHaveAttribute('href', 'https://example.com')
  })

  it('should render citation index', () => {
    render(<CitationPopover {...defaultProps} />)
    expect(screen.getByText('[1]')).toBeInTheDocument()
  })

  it('should return null when source not found', () => {
    const { container } = render(
      <CitationPopover {...defaultProps} sourceId="nonexistent" />
    )
    expect(container.firstChild).toBeNull()
  })
})
