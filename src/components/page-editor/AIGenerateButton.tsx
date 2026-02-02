'use client'

import { useState } from 'react'
import type { PageGenerateMode } from '@/types/book'

interface AIGenerateButtonProps {
  onGenerate: (mode: PageGenerateMode) => void
  isGenerating: boolean
  hasContent: boolean
}

export default function AIGenerateButton({
  onGenerate,
  isGenerating,
  hasContent,
}: AIGenerateButtonProps) {
  const [showMenu, setShowMenu] = useState(false)

  const modes = [
    {
      mode: 'new' as const,
      label: '새로 작성',
      description: '빈 페이지에 새 콘텐츠 생성',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
        </svg>
      ),
      disabled: hasContent,
    },
    {
      mode: 'continue' as const,
      label: '이어서 작성',
      description: '이전 내용에 이어서 작성',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
        </svg>
      ),
      disabled: false,
    },
    {
      mode: 'rewrite' as const,
      label: '다시 작성',
      description: '기존 내용을 개선하여 재작성',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      ),
      disabled: !hasContent,
    },
  ]

  const handleModeSelect = (mode: PageGenerateMode['mode']) => {
    setShowMenu(false)
    onGenerate({ mode })
  }

  if (isGenerating) {
    return (
      <div className="flex items-center gap-2 px-4 py-1.5 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900">
        <div className="w-4 h-4 border-2 border-current border-t-transparent animate-spin" />
        <span className="text-sm font-medium tracking-wide">AI 작성 중...</span>
      </div>
    )
  }

  return (
    <div className="relative">
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="flex items-center gap-2 px-4 py-1.5 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 hover:bg-neutral-700 dark:hover:bg-neutral-200 transition-colors"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
        </svg>
        <span className="text-sm font-medium tracking-wide">AI 작성</span>
        <svg className={`w-4 h-4 transition-transform ${showMenu ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {showMenu && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setShowMenu(false)}
          />
          <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 shadow-xl z-20">
            {modes.map(({ mode, label, description, icon, disabled }) => (
              <button
                key={mode}
                onClick={() => !disabled && handleModeSelect(mode)}
                disabled={disabled}
                className={`
                  w-full flex items-start gap-4 px-5 py-4 text-left transition-colors
                  border-b border-neutral-100 dark:border-neutral-800 last:border-0
                  ${disabled
                    ? 'opacity-40 cursor-not-allowed bg-neutral-50 dark:bg-neutral-800/50'
                    : 'hover:bg-neutral-50 dark:hover:bg-neutral-800'
                  }
                `}
              >
                <div className={`mt-0.5 ${disabled ? 'text-neutral-400' : 'text-neutral-900 dark:text-white'}`}>
                  {icon}
                </div>
                <div>
                  <div className={`text-sm font-medium ${disabled ? 'text-neutral-400' : 'text-neutral-900 dark:text-white'}`}>
                    {label}
                  </div>
                  <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                    {description}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
