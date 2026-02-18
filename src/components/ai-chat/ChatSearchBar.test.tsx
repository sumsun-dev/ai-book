import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ChatSearchBar } from './ChatSearchBar'

const defaultProps = {
  searchQuery: '',
  onSearchChange: vi.fn(),
  showPinnedOnly: false,
  onTogglePinnedOnly: vi.fn(),
  onExport: vi.fn(),
  pinnedCount: 0,
}

describe('ChatSearchBar', () => {
  it('should render search input', () => {
    render(<ChatSearchBar {...defaultProps} />)
    expect(screen.getByLabelText('메시지 검색')).toBeInTheDocument()
  })

  it('should call onSearchChange on input', () => {
    const onSearchChange = vi.fn()
    render(<ChatSearchBar {...defaultProps} onSearchChange={onSearchChange} />)
    fireEvent.change(screen.getByLabelText('메시지 검색'), {
      target: { value: '테스트' },
    })
    expect(onSearchChange).toHaveBeenCalledWith('테스트')
  })

  it('should call onTogglePinnedOnly on pin button click', () => {
    const onTogglePinnedOnly = vi.fn()
    render(
      <ChatSearchBar {...defaultProps} onTogglePinnedOnly={onTogglePinnedOnly} />
    )
    fireEvent.click(screen.getByLabelText('고정된 메시지만'))
    expect(onTogglePinnedOnly).toHaveBeenCalledOnce()
  })

  it('should call onExport on export button click', () => {
    const onExport = vi.fn()
    render(<ChatSearchBar {...defaultProps} onExport={onExport} />)
    fireEvent.click(screen.getByLabelText('대화 내보내기'))
    expect(onExport).toHaveBeenCalledOnce()
  })
})
