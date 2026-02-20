'use client'

import { useEffect, useRef } from 'react'
import type { SourceInfo } from '@/lib/citation'

interface CitationPopoverProps {
  sourceId: string
  index: number
  sources: SourceInfo[]
  position: { top: number; left: number }
  onClose: () => void
}

export function CitationPopover({
  sourceId,
  index,
  sources,
  position,
  onClose,
}: CitationPopoverProps) {
  const ref = useRef<HTMLDivElement>(null)
  const source = sources.find((s) => s.id === sourceId)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose()
      }
    }
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [onClose])

  if (!source) return null

  return (
    <div
      ref={ref}
      className="absolute z-50 w-72 p-4 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg shadow-lg"
      style={{ top: position.top, left: position.left }}
      role="tooltip"
      tabIndex={-1}
    >
      <div className="flex items-start justify-between mb-2">
        <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
          [{index}]
        </span>
        <button
          onClick={onClose}
          className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
          aria-label="닫기"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <h4 className="text-sm font-medium text-neutral-900 dark:text-white mb-1">
        {source.title}
      </h4>

      {source.author && (
        <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">
          {source.author}
        </p>
      )}

      {source.url && (
        <a
          href={source.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-blue-600 dark:text-blue-400 hover:underline break-all"
        >
          {source.url}
        </a>
      )}

      {source.notes && (
        <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-2">
          {source.notes}
        </p>
      )}
    </div>
  )
}
