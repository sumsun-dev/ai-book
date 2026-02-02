'use client'

interface MemoButtonProps {
  onClick: () => void
  isActive: boolean
  memoCount: number
}

export default function MemoButton({ onClick, isActive, memoCount }: MemoButtonProps) {
  return (
    <button
      onClick={onClick}
      aria-label="메모"
      className={`
        relative flex items-center gap-2 px-4 py-2 text-sm transition-colors
        ${isActive
          ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900'
          : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
        }
      `}
    >
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
        />
      </svg>
      <span>메모</span>
      {memoCount > 0 && (
        <span className="absolute -top-1 -right-1 inline-flex items-center justify-center w-5 h-5 text-xs font-medium bg-blue-600 text-white rounded-full">
          {memoCount > 99 ? '99+' : memoCount}
        </span>
      )}
    </button>
  )
}
