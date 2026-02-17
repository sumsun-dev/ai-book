'use client'

import { render, screen } from '@testing-library/react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import PageEditor from './PageEditor'
import { ToastProvider } from '@/components/ui/ToastProvider'

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
      render(<ToastProvider><PageEditor {...defaultProps} /></ToastProvider>)

      // PageToolbar의 저장 버튼이 보여야 함
      expect(screen.getByRole('button', { name: /저장/i })).toBeInTheDocument()
    })

    it('StatusBar가 항상 보여야 함', () => {
      render(<ToastProvider><PageEditor {...defaultProps} /></ToastProvider>)

      // StatusBar의 단축키 안내가 보여야 함
      expect(screen.getByText(/Ctrl\+S: 저장/)).toBeInTheDocument()
      // "챕터 1"은 toolbar와 statusbar 양쪽에 존재하므로 페이지 정보 텍스트로 확인
      expect(screen.getByText(/페이지 ·/)).toBeInTheDocument()
    })

    it('AIChatPanel이 렌더링되어야 함', () => {
      render(<ToastProvider><PageEditor {...defaultProps} /></ToastProvider>)

      expect(screen.getByTestId('ai-chat-panel')).toBeInTheDocument()
    })
  })

  describe('컨테이너 높이 제약', () => {
    it('루트 컨테이너가 h-full 클래스를 가져야 함 (h-screen 아님)', () => {
      const { container } = render(<ToastProvider><PageEditor {...defaultProps} /></ToastProvider>)

      const rootDiv = container.firstChild as HTMLElement
      expect(rootDiv.className).toContain('h-full')
      expect(rootDiv.className).not.toContain('h-screen')
    })

    it('루트 컨테이너가 overflow-hidden을 가져야 함', () => {
      const { container } = render(<ToastProvider><PageEditor {...defaultProps} /></ToastProvider>)

      const rootDiv = container.firstChild as HTMLElement
      expect(rootDiv.className).toContain('overflow-hidden')
    })
  })

  describe('flex 동작', () => {
    it('루트 컨테이너가 flex flex-col을 가져야 함', () => {
      const { container } = render(<ToastProvider><PageEditor {...defaultProps} /></ToastProvider>)

      const rootDiv = container.firstChild as HTMLElement
      expect(rootDiv.className).toContain('flex')
      expect(rootDiv.className).toContain('flex-col')
    })

    it('Edit Area가 flex-1 min-h-0을 가져야 함', () => {
      render(<ToastProvider><PageEditor {...defaultProps} /></ToastProvider>)

      // PageThumbnails의 부모(inner flex)의 부모(outer flex)가 메인 콘텐츠 영역
      const innerFlex = screen.getByTestId('page-thumbnails').parentElement
      const mainContentArea = innerFlex?.parentElement
      expect(mainContentArea?.className).toContain('flex-1')
      expect(mainContentArea?.className).toContain('min-h-0')
    })

    it('PageToolbar 래퍼가 shrink-0을 가져야 함', () => {
      render(<ToastProvider><PageEditor {...defaultProps} /></ToastProvider>)

      // 저장 버튼을 통해 PageToolbar 찾기
      const saveButton = screen.getByRole('button', { name: /저장/i })
      const toolbar = saveButton.closest('[class*="shrink-0"]')

      expect(toolbar).toBeInTheDocument()
    })

    it('StatusBar가 shrink-0을 가져야 함', () => {
      render(<ToastProvider><PageEditor {...defaultProps} /></ToastProvider>)

      // StatusBar 텍스트로 찾기
      const statusText = screen.getByText(/Ctrl\+S: 저장/)
      const statusBar = statusText.closest('[class*="shrink-0"]')

      expect(statusBar).toBeInTheDocument()
    })

    it('AIChatPanel이 메인 콘텐츠 영역 안에 있어야 함', () => {
      render(<ToastProvider><PageEditor {...defaultProps} /></ToastProvider>)

      const chatPanel = screen.getByTestId('ai-chat-panel')
      // AIChatPanel은 메인 콘텐츠 영역(flex-1 min-h-0) 안에 직접 배치됨
      const mainContentArea = chatPanel.closest('[class*="min-h-0"]')
      expect(mainContentArea).toBeInTheDocument()
      expect(mainContentArea?.className).toContain('flex-1')
    })
  })

  describe('높이 명시', () => {
    it('StatusBar가 h-10 클래스를 가져야 함', () => {
      render(<ToastProvider><PageEditor {...defaultProps} /></ToastProvider>)

      const statusText = screen.getByText(/Ctrl\+S: 저장/)
      const statusBar = statusText.closest('[class*="h-10"]')

      expect(statusBar).toBeInTheDocument()
    })
  })
})
