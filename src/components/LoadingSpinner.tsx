'use client'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  text?: string
}

export function LoadingSpinner({ size = 'md', text }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  }

  return (
    <div className="flex flex-col items-center justify-center gap-3">
      <div className={`${sizeClasses[size]} relative`}>
        <div className="absolute inset-0 rounded-full border-2 border-neutral-200 dark:border-neutral-700"></div>
        <div className="absolute inset-0 rounded-full border-2 border-neutral-900 dark:border-white border-t-transparent animate-spin"></div>
      </div>
      {text && <p className="text-sm text-neutral-500 dark:text-neutral-400">{text}</p>}
    </div>
  )
}
