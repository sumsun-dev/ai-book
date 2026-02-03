'use client'

import { memo } from 'react'
import type { ChatMessage } from '@/types/book'

interface AIChatMessageProps {
  message: ChatMessage
  onApply?: (content: string) => void
  onCopy?: (content: string) => void
}

function AIChatMessageComponent({ message, onApply, onCopy }: AIChatMessageProps) {
  const isUser = message.role === 'user'

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content)
    onCopy?.(message.content)
  }

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[85%] rounded-lg px-3 py-2 ${
          isUser
            ? 'bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900'
            : 'bg-neutral-100 dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100'
        }`}
      >
        <div className="text-sm whitespace-pre-wrap break-words">
          {message.content || (
            <span className="inline-flex items-center gap-1 text-neutral-400">
              <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              응답 중...
            </span>
          )}
        </div>

        {!isUser && message.content && (
          <div className="flex items-center gap-2 mt-2 pt-2 border-t border-neutral-200 dark:border-neutral-600">
            {onApply && (
              <button
                onClick={() => onApply(message.content)}
                className="px-2 py-1 text-xs font-medium bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                적용
              </button>
            )}
            <button
              onClick={handleCopy}
              className="px-2 py-1 text-xs font-medium bg-neutral-200 dark:bg-neutral-600 text-neutral-700 dark:text-neutral-200 rounded hover:bg-neutral-300 dark:hover:bg-neutral-500 transition-colors"
            >
              복사
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export const AIChatMessage = memo(AIChatMessageComponent)
