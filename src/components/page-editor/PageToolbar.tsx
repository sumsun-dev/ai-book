'use client'

import type { ReactElement } from 'react'
import type { PageViewMode, PaperSize } from '@/types/book'
import { PAPER_SIZES } from '@/types/book'

interface PageToolbarProps {
  zoom: number
  onZoomChange: (zoom: number) => void
  viewMode: PageViewMode
  onViewModeChange: (mode: PageViewMode) => void
  paperSize: PaperSize
  onPaperSizeChange: (size: PaperSize) => void
  isSaving: boolean
  lastSaved: Date | null
  isDirty: boolean
  onSave: () => void
}

export default function PageToolbar({
  zoom,
  onZoomChange,
  viewMode,
  onViewModeChange,
  paperSize,
  onPaperSizeChange,
  isSaving,
  lastSaved,
  isDirty,
  onSave,
}: PageToolbarProps) {
  const handleZoomIn = () => {
    onZoomChange(Math.min(zoom + 10, 200))
  }

  const handleZoomOut = () => {
    onZoomChange(Math.max(zoom - 10, 30))
  }

  const viewModes: { mode: PageViewMode; label: string; icon: ReactElement }[] = [
    {
      mode: 'single',
      label: '단일',
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
    },
    {
      mode: 'spread',
      label: '펼침',
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      ),
    },
    {
      mode: 'continuous',
      label: '연속',
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      ),
    },
  ]

  const paperSizeOptions: PaperSize[] = ['a4', 'a5', 'b5', 'letter', 'novel']

  const formatLastSaved = (date: Date | null): string => {
    if (!date) return '저장되지 않음'
    const now = new Date()
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000)
    if (diff < 60) return '방금 저장됨'
    if (diff < 3600) return `${Math.floor(diff / 60)}분 전`
    return date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="flex items-center justify-between px-4 py-2 bg-white dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700">
      <div className="flex items-center gap-3">
        {/* 용지 크기 선택 */}
        <div className="flex items-center gap-2 border border-neutral-200 dark:border-neutral-700 px-3 py-1.5">
          <svg className="w-4 h-4 text-neutral-500 dark:text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <select
            value={paperSize}
            onChange={(e) => onPaperSizeChange(e.target.value as PaperSize)}
            className="text-sm bg-transparent border-0 focus:outline-none focus:ring-0 cursor-pointer text-neutral-700 dark:text-neutral-300"
          >
            {paperSizeOptions.map((size) => (
              <option key={size} value={size}>
                {PAPER_SIZES[size].name}
              </option>
            ))}
          </select>
        </div>

        {/* 확대/축소 */}
        <div className="flex items-center border border-neutral-200 dark:border-neutral-700">
          <button
            onClick={handleZoomOut}
            disabled={zoom <= 30}
            className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            title="축소"
          >
            <svg className="w-4 h-4 text-neutral-600 dark:text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" />
            </svg>
          </button>
          <span className="w-14 text-center text-sm font-medium text-neutral-700 dark:text-neutral-300 border-x border-neutral-200 dark:border-neutral-700 py-2">
            {zoom}%
          </span>
          <button
            onClick={handleZoomIn}
            disabled={zoom >= 200}
            className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            title="확대"
          >
            <svg className="w-4 h-4 text-neutral-600 dark:text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7" />
            </svg>
          </button>
        </div>

        {/* 보기 모드 */}
        <div className="flex items-center border border-neutral-200 dark:border-neutral-700">
          {viewModes.map(({ mode, label, icon }) => (
            <button
              key={mode}
              onClick={() => onViewModeChange(mode)}
              className={`p-2 transition-colors ${
                viewMode === mode
                  ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900'
                  : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-700'
              }`}
              title={label}
            >
              {icon}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-4">
        <span className="text-sm text-neutral-500 dark:text-neutral-400">
          {formatLastSaved(lastSaved)}
        </span>

        <button
          onClick={onSave}
          disabled={isSaving || !isDirty}
          className={`flex items-center gap-2 px-4 py-2 text-sm transition-colors ${
            isDirty
              ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 hover:bg-neutral-700 dark:hover:bg-neutral-200'
              : 'bg-neutral-100 dark:bg-neutral-700 text-neutral-400 dark:text-neutral-500'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {isSaving ? (
            <>
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span>저장 중</span>
            </>
          ) : isDirty ? (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>저장</span>
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>저장됨</span>
            </>
          )}
        </button>
      </div>
    </div>
  )
}
