'use client'

interface ChatSearchBarProps {
  searchQuery: string
  onSearchChange: (query: string) => void
  showPinnedOnly: boolean
  onTogglePinnedOnly: () => void
  onExport: () => void
  pinnedCount: number
}

export function ChatSearchBar({
  searchQuery,
  onSearchChange,
  showPinnedOnly,
  onTogglePinnedOnly,
  onExport,
  pinnedCount,
}: ChatSearchBarProps) {
  return (
    <div className="flex items-center gap-2 px-3 py-2 border-b border-neutral-100 dark:border-neutral-700">
      {/* Search input */}
      <div className="flex-1 relative">
        <svg
          className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-neutral-400 dark:text-neutral-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
          />
        </svg>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="메시지 검색..."
          className="w-full pl-7 pr-2 py-1.5 text-xs bg-neutral-50 dark:bg-neutral-700 border border-neutral-200 dark:border-neutral-600 text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-500 rounded focus:outline-none focus:border-neutral-400 dark:focus:border-neutral-500 transition-colors"
          aria-label="메시지 검색"
        />
      </div>

      {/* Pin filter */}
      <button
        onClick={onTogglePinnedOnly}
        className={`p-1.5 rounded transition-colors ${
          showPinnedOnly
            ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400'
            : 'text-neutral-400 dark:text-neutral-500 hover:text-neutral-600 dark:hover:text-neutral-300'
        }`}
        title={showPinnedOnly ? '전체 보기' : '고정된 메시지만'}
        aria-label={showPinnedOnly ? '전체 보기' : '고정된 메시지만'}
      >
        <svg className="w-3.5 h-3.5" fill={showPinnedOnly ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
        </svg>
        {pinnedCount > 0 && (
          <span className="sr-only">({pinnedCount})</span>
        )}
      </button>

      {/* Export */}
      <button
        onClick={onExport}
        className="p-1.5 text-neutral-400 dark:text-neutral-500 hover:text-neutral-600 dark:hover:text-neutral-300 rounded transition-colors"
        title="대화 내보내기"
        aria-label="대화 내보내기"
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
      </button>
    </div>
  )
}
