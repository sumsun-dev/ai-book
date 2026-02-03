'use client'

import { render, screen } from '@testing-library/react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import PageEditor from './PageEditor'

// Mock dependencies
vi.mock('./PageThumbnails', () => ({
  default: function MockPageThumbnails() {
    return <div data-testid="page-thumbnails">Thumbnails</div>
  },
}))

vi.mock('./PageCanvas', () => ({
  default: function MockPageCanvas() {
    return <div data-testid="page-canvas">Canvas</div>
  },
}))

vi.mock('./SourcesCollapsible', () => ({
  default: function MockSourcesCollapsible() {
    return <div data-testid="sources-collapsible">Sources</div>
  },
}))

vi.mock('@/components/ai-chat', () => ({
  AIChatPanel: function MockAIChatPanel() {
    return (
      <div data-testid="ai-chat-panel">
        AI Chat
      </div>
    )
  },
}))

const defaultProps = {
  projectId: 'test-project',
  chapterId: 'test-chapter',
  chapterNumber: 1,
  chapterTitle: 'Test Chapter',
  initialContent: 'Test content',
  onSave: vi.fn().mockResolvedValue(undefined),
  onAIGenerate: vi.fn().mockResolvedValue('Generated content'),
}

describe('PageEditor Layout', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('고정 요소 가시성', () => {
    it('PageToolbar가 항상 보여야 함', () => {
      render(<PageEditor {...defaultProps} />)

      // PageToolbar의 저장 버튼이 보여야 함
      expect(screen.getByRole('button', { name: /저장/i })).toBeInTheDocument()
    })

    it('StatusBar가 항상 보여야 함', () => {
      render(<PageEditor {...defaultProps} />)

      // StatusBar의 단축키 안내가 보여야 함
      expect(screen.getByText(/Ctrl\+S: 저장/)).toBeInTheDocument()
      expect(screen.getByText(/챕터 1/)).toBeInTheDocument()
    })

    it('AIChatPanel이 렌더링되어야 함', () => {
      render(<PageEditor {...defaultProps} />)

      expect(screen.getByTestId('ai-chat-panel')).toBeInTheDocument()
    })
  })

  describe('컨테이너 높이 제약', () => {
    it('루트 컨테이너가 h-full 클래스를 가져야 함 (h-screen 아님)', () => {
      const { container } = render(<PageEditor {...defaultProps} />)

      const rootDiv = container.firstChild as HTMLElement
      expect(rootDiv.className).toContain('h-full')
      expect(rootDiv.className).not.toContain('h-screen')
    })

    it('루트 컨테이너가 overflow-hidden을 가져야 함', () => {
      const { container } = render(<PageEditor {...defaultProps} />)

      const rootDiv = container.firstChild as HTMLElement
      expect(rootDiv.className).toContain('overflow-hidden')
    })
  })

  describe('flex 동작', () => {
    it('루트 컨테이너가 flex flex-col을 가져야 함', () => {
      const { container } = render(<PageEditor {...defaultProps} />)

      const rootDiv = container.firstChild as HTMLElement
      expect(rootDiv.className).toContain('flex')
      expect(rootDiv.className).toContain('flex-col')
    })

    it('Edit Area가 flex-1 min-h-0을 가져야 함', () => {
      render(<PageEditor {...defaultProps} />)

      // PageThumbnails와 PageCanvas를 포함하는 컨테이너 찾기
      const editArea = screen.getByTestId('page-thumbnails').parentElement
      expect(editArea?.className).toContain('flex-1')
      expect(editArea?.className).toContain('min-h-0')
    })

    it('PageToolbar 래퍼가 shrink-0을 가져야 함', () => {
      render(<PageEditor {...defaultProps} />)

      // 저장 버튼을 통해 PageToolbar 찾기
      const saveButton = screen.getByRole('button', { name: /저장/i })
      const toolbar = saveButton.closest('[class*="shrink-0"]')

      expect(toolbar).toBeInTheDocument()
    })

    it('StatusBar가 shrink-0을 가져야 함', () => {
      render(<PageEditor {...defaultProps} />)

      // StatusBar 텍스트로 찾기
      const statusText = screen.getByText(/Ctrl\+S: 저장/)
      const statusBar = statusText.closest('[class*="shrink-0"]')

      expect(statusBar).toBeInTheDocument()
    })

    it('AIChatPanel 래퍼가 shrink-0을 가져야 함', () => {
      render(<PageEditor {...defaultProps} />)

      const chatPanel = screen.getByTestId('ai-chat-panel')
      const wrapper = chatPanel.parentElement

      expect(wrapper?.className).toContain('shrink-0')
    })
  })

  describe('높이 명시', () => {
    it('StatusBar가 h-10 클래스를 가져야 함', () => {
      render(<PageEditor {...defaultProps} />)

      const statusText = screen.getByText(/Ctrl\+S: 저장/)
      const statusBar = statusText.closest('[class*="h-10"]')

      expect(statusBar).toBeInTheDocument()
    })
  })
})
