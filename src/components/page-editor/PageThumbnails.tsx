'use client'

import { useMemo } from 'react'
import type { Page, PageStatus } from '@/types/book'

interface PageThumbnailsProps {
  pages: Page[]
  currentPage: number
  onPageSelect: (pageNumber: number) => void
}

function getStatusStyles(status: PageStatus, isActive: boolean) {
  if (isActive) {
    return 'border-neutral-900 dark:border-white bg-white dark:bg-neutral-800'
  }
  switch (status) {
    case 'complete':
      return 'border-emerald-400 dark:border-emerald-600 bg-emerald-50 dark:bg-emerald-950/30'
    case 'draft':
      return 'border-amber-400 dark:border-amber-600 bg-amber-50 dark:bg-amber-950/30'
    default:
      return 'border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900'
  }
}

export default function PageThumbnails({
  pages,
  currentPage,
  onPageSelect,
}: PageThumbnailsProps) {
  const sortedPages = useMemo(
    () => [...pages].sort((a, b) => a.pageNumber - b.pageNumber),
    [pages]
  )

  return (
    <div className="w-36 h-full bg-neutral-100 dark:bg-neutral-900 border-r border-neutral-200 dark:border-neutral-800 flex flex-col transition-colors duration-500">
      {/* 고정 헤더 */}
      <div className="text-xs tracking-widest uppercase text-neutral-500 dark:text-neutral-400 px-4 py-3 border-b border-neutral-200 dark:border-neutral-700 shrink-0">
        페이지 ({pages.length})
      </div>

      {/* 스크롤 가능한 썸네일 목록 */}
      <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-3 min-h-0">
        {sortedPages.map((page) => {
        const isActive = page.pageNumber === currentPage
        const preview = page.content.substring(0, 50).replace(/\n/g, ' ') || '빈 페이지'

        return (
          <button
            key={page.id || page.pageNumber}
            onClick={() => onPageSelect(page.pageNumber)}
            className={`
              relative w-full aspect-[3/4] border-2 p-2 text-left transition-all duration-300
              ${getStatusStyles(page.status, isActive)}
              hover:border-neutral-400 dark:hover:border-neutral-500
            `}
          >
            {/* 페이지 번호 */}
            <div className="absolute top-2 left-2 flex items-center gap-1.5">
              <span className={`
                text-[10px] font-medium
                ${isActive ? 'text-neutral-900 dark:text-white' : 'text-neutral-500 dark:text-neutral-400'}
              `}>
                {page.pageNumber}
              </span>
              {page.status === 'complete' && (
                <svg className="w-3 h-3 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              )}
              {page.status === 'draft' && (
                <svg className="w-3 h-3 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              )}
            </div>

            {/* 미리보기 텍스트 */}
            <div className="mt-5 text-[8px] text-neutral-500 dark:text-neutral-400 line-clamp-4 leading-relaxed overflow-hidden">
              {preview}
            </div>

            {/* 단어 수 */}
            {page.wordCount > 0 && (
              <div className="absolute bottom-1.5 right-1.5 text-[8px] text-neutral-400 dark:text-neutral-500">
                {page.wordCount}자
              </div>
            )}
          </button>
        )
      })}

        {/* 새 페이지 추가 */}
        <button
          onClick={() => onPageSelect(pages.length + 1)}
          className="w-full aspect-[3/4] border-2 border-dashed border-neutral-300 dark:border-neutral-700 flex items-center justify-center text-neutral-400 dark:text-neutral-500 hover:border-neutral-400 dark:hover:border-neutral-500 hover:text-neutral-500 dark:hover:text-neutral-400 transition-all duration-300 shrink-0"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>
    </div>
  )
}
