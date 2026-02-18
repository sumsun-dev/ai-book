'use client'

import { useState, useCallback, KeyboardEvent } from 'react'
import { useTranslations } from 'next-intl'

interface QuickPrompt {
  label: string
  prompt: string
}

const QUICK_PROMPTS: QuickPrompt[] = [
  { label: '간결하게', prompt: '이 내용을 더 간결하게 수정해줘' },
  { label: '상세하게', prompt: '이 내용을 더 상세하게 설명해줘' },
  { label: '문법검토', prompt: '이 내용의 문법과 맞춤법을 검토해줘' },
]

interface AIChatInputProps {
  onSend: (message: string) => void
  isLoading: boolean
  disabled?: boolean
}

export function AIChatInput({ onSend, isLoading, disabled }: AIChatInputProps) {
  const [input, setInput] = useState('')
  const t = useTranslations('chat')

  const handleSend = useCallback(() => {
    if (!input.trim() || isLoading || disabled) return
    onSend(input.trim())
    setInput('')
  }, [input, isLoading, disabled, onSend])

  const handleKeyDown = useCallback((e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }, [handleSend])

  const handleQuickPrompt = useCallback((prompt: string) => {
    if (isLoading || disabled) return
    onSend(prompt)
  }, [isLoading, disabled, onSend])

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {QUICK_PROMPTS.map((qp) => (
          <button
            key={qp.label}
            onClick={() => handleQuickPrompt(qp.prompt)}
            disabled={isLoading || disabled}
            className="px-2 py-1 text-xs bg-neutral-100 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300 rounded hover:bg-neutral-200 dark:hover:bg-neutral-600 disabled:opacity-50 transition-colors"
          >
            {qp.label}
          </button>
        ))}
      </div>

      <div className="flex items-end gap-2">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="메시지 입력... (Shift+Enter: 줄바꿈)"
          disabled={isLoading || disabled}
          rows={1}
          aria-label={t('inputLabel')}
          className="flex-1 min-h-[36px] max-h-24 px-3 py-2 text-sm bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-600 rounded-lg resize-none focus:outline-none focus:ring-1 focus:ring-neutral-400 disabled:opacity-50"
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || isLoading || disabled}
          aria-label={t('sendLabel')}
          className="flex items-center justify-center w-9 h-9 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-lg hover:bg-neutral-700 dark:hover:bg-neutral-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? (
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          )}
        </button>
      </div>
    </div>
  )
}
