import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { axe } from 'vitest-axe'
import EditStep from '../EditStep'
import type { BookOutline } from '@/types/book'

const mockOutline: BookOutline = {
  synopsis: '테스트 개요',
  chapters: [
    {
      number: 1,
      title: '첫 번째 챕터',
      summary: '첫 번째 요약',
      keyPoints: ['포인트1'],
      sections: [],
    },
    {
      number: 2,
      title: '두 번째 챕터',
      summary: '두 번째 요약',
      keyPoints: [],
      sections: [],
    },
  ],
  estimatedPages: 40,
}

const defaultProps = {
  outline: mockOutline,
  onOutlineChange: vi.fn(),
  onConfirm: vi.fn(),
  isLoading: false,
}

describe('EditStep a11y', () => {
  it('axe 접근성 위반이 없어야 한다', async () => {
    const { container } = render(<EditStep {...defaultProps} />)
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it('챕터 토글 버튼에 aria-expanded 상태가 있어야 한다', () => {
    render(<EditStep {...defaultProps} />)

    const toggleButtons = screen.getAllByRole('button', { name: /챕터.*접기|챕터.*펼치기|toggle/i })
    expect(toggleButtons.length).toBeGreaterThan(0)

    // 기본적으로 모든 챕터가 펼쳐져 있으므로 aria-expanded="true"
    toggleButtons.forEach((btn) => {
      expect(btn).toHaveAttribute('aria-expanded')
    })
  })

  it('챕터 접기/펼치기 시 aria-expanded 상태가 변경되어야 한다', () => {
    render(<EditStep {...defaultProps} />)

    const toggleButtons = screen.getAllByRole('button', { name: /챕터.*접기|챕터.*펼치기|toggle/i })
    const firstToggle = toggleButtons[0]

    expect(firstToggle).toHaveAttribute('aria-expanded', 'true')

    fireEvent.click(firstToggle)

    expect(firstToggle).toHaveAttribute('aria-expanded', 'false')
  })

  it('위로 이동 버튼에 aria-label이 있어야 한다', () => {
    render(<EditStep {...defaultProps} />)
    const upButtons = screen.getAllByRole('button', { name: /위로 이동/ })
    expect(upButtons.length).toBeGreaterThan(0)
  })

  it('아래로 이동 버튼에 aria-label이 있어야 한다', () => {
    render(<EditStep {...defaultProps} />)
    const downButtons = screen.getAllByRole('button', { name: /아래로 이동/ })
    expect(downButtons.length).toBeGreaterThan(0)
  })

  it('삭제 버튼에 aria-label이 있어야 한다', () => {
    render(<EditStep {...defaultProps} />)
    const deleteButtons = screen.getAllByRole('button', { name: /삭제/ })
    expect(deleteButtons.length).toBeGreaterThan(0)
  })

  it('새 챕터 추가 버튼에 aria-label이 있어야 한다', () => {
    render(<EditStep {...defaultProps} />)
    const addButton = screen.getByRole('button', { name: /챕터 추가/ })
    expect(addButton).toBeInTheDocument()
  })
})
