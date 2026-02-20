'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { AIChatMessage } from './AIChatMessage'
import { AIChatInput } from './AIChatInput'
import { ChapterPageSelector } from './ChapterPageSelector'
import { ChatSearchBar } from './ChatSearchBar'
import { useAIChat } from '@/hooks/useAIChat'
import { formatChatAsTxt, downloadAsFile } from '@/lib/utils/chat-export'
import type { Page, ChatContext } from '@/types/book'

const AI_PANEL_EXPANDED_KEY = 'ai-panel-expanded'

interface AIChatPanelProps {
  projectId: string
  chapterId: string
  chapterNumber: number
  pages: Page[]
  getPageContent: (pageNumber: number | null) => string
  onApplyContent?: (content: string) => void
}

export function AIChatPanel({
  projectId,
  chapterId,
  chapterNumber,
  pages,
  getPageContent,
  onApplyContent,
}: AIChatPanelProps) {
  const [isExpanded, setIsExpanded] = useState(() => {
    if (typeof window === 'undefined') return true
    const saved = localStorage.getItem(AI_PANEL_EXPANDED_KEY)
    return saved !== null ? saved === 'true' : true
  })
  const [selectedPage, setSelectedPage] = useState<number | null>(null)
  const [showOnboardingTip, setShowOnboardingTip] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const toggleExpanded = useCallback(() => {
    setIsExpanded((prev) => {
      const newValue = !prev
      localStorage.setItem(AI_PANEL_EXPANDED_KEY, String(newValue))
      return newValue
    })
  }, [])

  /* eslint-disable react-hooks/exhaustive-deps */
  useEffect(() => {
    const hasSeenTip = localStorage.getItem('ai-panel-onboarding-seen')
    if (!hasSeenTip && isExpanded) {
      setShowOnboardingTip(true)
      const timer = setTimeout(() => {
        setShowOnboardingTip(false)
        localStorage.setItem('ai-panel-onboarding-seen', 'true')
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [])
  /* eslint-enable react-hooks/exhaustive-deps */

  const {
    messages,
    filteredMessages,
    isLoading,
    searchQuery,
    setSearchQuery,
    showPinnedOnly,
    togglePinnedOnly,
    sendMessage,
    clearMessages,
    togglePin,
    pinnedCount,
    exportMessages,
  } = useAIChat({
    projectId,
    chapterId,
  })

  useEffect(() => {
    if (isExpanded && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, isExpanded])

  const handleSend = async (message: string) => {
    const context: ChatContext = {
      chapterNumber,
      pageNumber: selectedPage ?? undefined,
      fullContent: getPageContent(selectedPage),
    }
    await sendMessage(message, context)
  }

  const handleApply = (content: string) => {
    onApplyContent?.(content)
  }

  const handleCopy = () => {
    // 복사 완료 피드백
  }

  const handleExport = () => {
    const msgs = exportMessages()
    if (msgs.length === 0) return
    const txt = formatChatAsTxt(msgs)
    downloadAsFile(txt, `chat-ch${chapterNumber}.txt`)
  }

  return (
    <div
      className={`flex flex-col h-full bg-white dark:bg-neutral-800 border-l border-neutral-200 dark:border-neutral-700 transition-all duration-200 ${
        isExpanded ? 'w-80' : 'w-10'
      }`}
    >
      {/* 헤더 - 토글 버튼 (세로) */}
      <button
        onClick={toggleExpanded}
        className={`shrink-0 flex items-center gap-2 text-sm hover:bg-neutral-50 dark:hover:bg-neutral-750 transition-colors ${
          isExpanded ? 'px-4 py-3 justify-between' : 'h-full py-4 justify-center'
        }`}
        style={!isExpanded ? { writingMode: 'vertical-rl' } : undefined}
      >
        {isExpanded ? (
          <>
            <div className="flex items-center gap-2 text-neutral-600 dark:text-neutral-400">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
              <span className="font-medium">AI 어시스턴트</span>
              {messages.length > 0 && (
                <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-medium bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 rounded-full">
                  {messages.length}
                </span>
              )}
            </div>
            <svg
              className="w-4 h-4 text-neutral-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </>
        ) : (
          <div className="flex items-center gap-2 text-neutral-600 dark:text-neutral-400">
            <svg className="w-4 h-4 rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
            <span className="font-medium text-xs tracking-wider">AI</span>
            {messages.length > 0 && (
              <span className="inline-flex items-center justify-center w-4 h-4 text-[10px] font-medium bg-blue-500 text-white rounded-full">
                {messages.length}
              </span>
            )}
          </div>
        )}
      </button>

      {/* 펼쳐진 패널 */}
      {isExpanded && (
        <>
          {/* Search/Pin/Export bar */}
          {messages.length > 0 && (
            <ChatSearchBar
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              showPinnedOnly={showPinnedOnly}
              onTogglePinnedOnly={togglePinnedOnly}
              onExport={handleExport}
              pinnedCount={pinnedCount}
            />
          )}

          {/* 페이지 선택 + Clear */}
          <div className="shrink-0 px-4 py-2 border-t border-neutral-100 dark:border-neutral-700 flex items-center justify-between">
            <ChapterPageSelector
              pages={pages}
              selectedPage={selectedPage}
              onPageChange={setSelectedPage}
            />
            {messages.length > 0 && (
              <button
                onClick={clearMessages}
                className="px-2 py-1 text-xs text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded transition-colors"
              >
                Clear
              </button>
            )}
          </div>

          {/* 온보딩 팁 */}
          {showOnboardingTip && messages.length === 0 && (
            <div className="mx-4 mt-2 p-3 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg">
              <p className="text-xs text-blue-700 dark:text-blue-300">
                <strong>Tip:</strong> AI 어시스턴트에게 글쓰기 도움을 요청하세요. 문장 개선, 아이디어 제안, 맞춤법 검사 등을 지원합니다.
              </p>
            </div>
          )}

          {/* 메시지 목록 */}
          <div className="flex-1 min-h-0 overflow-y-auto px-4 py-3 space-y-3 border-t border-neutral-100 dark:border-neutral-700">
            {messages.length === 0 ? (
              <div className="text-center py-8">
                <svg className="w-10 h-10 mx-auto mb-3 text-neutral-300 dark:text-neutral-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">
                  편집에 대해 질문하거나<br />도움을 요청하세요
                </p>
              </div>
            ) : (
              filteredMessages.map((message) => (
                <AIChatMessage
                  key={message.id}
                  message={message}
                  onApply={handleApply}
                  onCopy={handleCopy}
                  onTogglePin={togglePin}
                />
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* 입력창 */}
          <div className="shrink-0 px-4 py-3 border-t border-neutral-100 dark:border-neutral-700">
            <AIChatInput
              onSend={handleSend}
              isLoading={isLoading}
            />
          </div>
        </>
      )}
    </div>
  )
}
