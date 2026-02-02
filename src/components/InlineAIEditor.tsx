'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

interface InlineAIEditorProps {
  selectedText: string
  position: { x: number; y: number }
  onApply: (editedText: string) => void
  onClose: () => void
  context?: string
}

type EditState = 'input' | 'loading' | 'preview'

export function InlineAIEditor({
  selectedText,
  position,
  onApply,
  onClose,
  context,
}: InlineAIEditorProps) {
  const [instruction, setInstruction] = useState('')
  const [editedText, setEditedText] = useState('')
  const [state, setState] = useState<EditState>('input')
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose()
      }
    }

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [onClose])

  const handleSubmit = useCallback(async () => {
    if (!instruction.trim()) return

    setState('loading')
    setError(null)

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phase: 'inline-edit',
          originalText: selectedText,
          instruction: instruction.trim(),
          context,
        }),
      })

      if (!response.ok) {
        throw new Error('AI 수정 요청에 실패했습니다')
      }

      const data = await response.json()
      setEditedText(data.edited)
      setState('preview')
    } catch (err) {
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다')
      setState('input')
    }
  }, [instruction, selectedText, context])

  const handleApply = () => {
    onApply(editedText)
    onClose()
  }

  const handleRetry = () => {
    setState('input')
    setEditedText('')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      handleSubmit()
    }
  }

  // 위치 조정 (화면 밖으로 나가지 않도록)
  const adjustedPosition = {
    x: Math.min(position.x, window.innerWidth - 400),
    y: Math.min(position.y + 10, window.innerHeight - 300),
  }

  return (
    <div
      ref={panelRef}
      className="fixed z-[100] bg-gray-900 border border-gray-700 rounded-xl shadow-2xl w-96 overflow-hidden"
      style={{
        left: Math.max(10, adjustedPosition.x),
        top: Math.max(10, adjustedPosition.y),
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gray-800/50 border-b border-gray-700">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
          <span className="text-sm font-medium text-white">AI 수정</span>
        </div>
        <button
          onClick={onClose}
          className="p-1 text-gray-400 hover:text-white transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Selected Text Preview */}
      <div className="px-4 py-3 border-b border-gray-700/50">
        <p className="text-xs text-gray-500 mb-1">선택한 텍스트</p>
        <p className="text-sm text-gray-300 line-clamp-2 bg-gray-800/50 rounded px-2 py-1.5">
          {selectedText.length > 150 ? `${selectedText.slice(0, 150)}...` : selectedText}
        </p>
      </div>

      {/* Content */}
      <div className="p-4">
        {state === 'input' && (
          <div className="space-y-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1.5">어떻게 수정할까요?</label>
              <textarea
                ref={inputRef}
                value={instruction}
                onChange={(e) => setInstruction(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="예: 더 간결하게, 존댓말로 변경, 전문적인 어조로..."
                rows={2}
                className="w-full bg-gray-800 text-white rounded-lg px-3 py-2 text-sm border border-gray-700 focus:border-purple-500 focus:outline-none resize-none placeholder:text-gray-500"
              />
            </div>

            {error && (
              <p className="text-red-400 text-sm">{error}</p>
            )}

            <div className="flex gap-2">
              <button
                onClick={handleSubmit}
                disabled={!instruction.trim()}
                className="flex-1 flex items-center justify-center gap-2 bg-purple-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                수정 요청
                <kbd className="ml-1 px-1.5 py-0.5 bg-purple-700/50 rounded text-xs">Ctrl+Enter</kbd>
              </button>
            </div>

            {/* Quick Actions */}
            <div className="pt-2 border-t border-gray-700/50">
              <p className="text-xs text-gray-500 mb-2">빠른 선택</p>
              <div className="flex flex-wrap gap-1.5">
                {['더 간결하게', '존댓말로', '더 자세하게', '오타 수정', '문장 다듬기'].map((action) => (
                  <button
                    key={action}
                    onClick={() => setInstruction(action)}
                    className="px-2 py-1 bg-gray-800 text-gray-400 rounded text-xs hover:bg-gray-700 hover:text-white transition-colors"
                  >
                    {action}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {state === 'loading' && (
          <div className="flex flex-col items-center justify-center py-8">
            <svg className="w-8 h-8 animate-spin text-purple-500" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <p className="text-gray-400 text-sm mt-3">AI가 수정 중...</p>
          </div>
        )}

        {state === 'preview' && (
          <div className="space-y-3">
            <div>
              <p className="text-xs text-gray-500 mb-1.5">수정 결과</p>
              <div className="bg-gray-800/50 rounded-lg p-3 max-h-40 overflow-y-auto">
                <p className="text-sm text-green-300 whitespace-pre-wrap">{editedText}</p>
              </div>
            </div>

            {/* Diff view */}
            <div className="text-xs text-gray-500">
              <span className="text-red-400/70">원본</span>
              <span className="mx-2">→</span>
              <span className="text-green-400/70">수정됨</span>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleApply}
                className="flex-1 flex items-center justify-center gap-2 bg-green-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-green-700 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                적용
              </button>
              <button
                onClick={handleRetry}
                className="flex-1 flex items-center justify-center gap-2 bg-gray-700 text-gray-300 rounded-lg py-2 text-sm font-medium hover:bg-gray-600 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                다시 요청
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// Hook for managing text selection and showing the editor
export function useInlineAIEditor() {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedText, setSelectedText] = useState('')
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [onApplyCallback, setOnApplyCallback] = useState<((text: string) => void) | null>(null)

  const handleTextSelection = useCallback((onApply: (text: string) => void) => {
    const selection = window.getSelection()
    if (!selection || selection.isCollapsed) return

    const text = selection.toString().trim()
    if (!text) return

    const range = selection.getRangeAt(0)
    const rect = range.getBoundingClientRect()

    setSelectedText(text)
    setPosition({ x: rect.left, y: rect.bottom })
    setOnApplyCallback(() => onApply)
    setIsOpen(true)
  }, [])

  const close = useCallback(() => {
    setIsOpen(false)
    setSelectedText('')
    setOnApplyCallback(null)
  }, [])

  return {
    isOpen,
    selectedText,
    position,
    onApply: onApplyCallback,
    handleTextSelection,
    close,
  }
}
