'use client'

import { memo } from 'react'
import type { Page } from '@/types/book'

interface ChapterPageSelectorProps {
  pages: Page[]
  selectedPage: number | null // null = 전체
  onPageChange: (pageNumber: number | null) => void
}

function ChapterPageSelectorComponent({
  pages,
  selectedPage,
  onPageChange,
}: ChapterPageSelectorProps) {
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="text-neutral-500 dark:text-neutral-400">컨텍스트:</span>
      <select
        value={selectedPage ?? 'all'}
        onChange={(e) => {
          const value = e.target.value
          onPageChange(value === 'all' ? null : Number(value))
        }}
        className="px-2 py-1 bg-neutral-100 dark:bg-neutral-700 border border-neutral-200 dark:border-neutral-600 rounded text-neutral-700 dark:text-neutral-300 focus:outline-none focus:ring-1 focus:ring-neutral-400"
      >
        <option value="all">전체 챕터</option>
        {pages.map((p) => (
          <option key={p.pageNumber} value={p.pageNumber}>
            Page {p.pageNumber}
          </option>
        ))}
      </select>
    </div>
  )
}

export const ChapterPageSelector = memo(ChapterPageSelectorComponent)
