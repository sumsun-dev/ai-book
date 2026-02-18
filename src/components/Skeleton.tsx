'use client'

interface SkeletonProps {
  className?: string
  width?: string
  height?: string
}

export function Skeleton({ className = '', width, height }: SkeletonProps) {
  return (
    <div
      role="status"
      aria-label="loading"
      className={`animate-pulse bg-neutral-200 dark:bg-neutral-700 rounded ${className}`}
      style={{ width, height }}
    />
  )
}

interface SkeletonTextProps {
  lines?: number
  className?: string
}

export function SkeletonText({ lines = 3, className = '' }: SkeletonTextProps) {
  return (
    <div role="status" aria-label="loading" className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className={`animate-pulse bg-neutral-200 dark:bg-neutral-700 rounded h-4 ${
            i === lines - 1 ? 'w-3/4' : 'w-full'
          }`}
        />
      ))}
    </div>
  )
}

interface SkeletonCardProps {
  className?: string
}

export function SkeletonCard({ className = '' }: SkeletonCardProps) {
  return (
    <div role="status" aria-label="loading" className={`${className}`}>
      <div className="aspect-[3/4] animate-pulse bg-neutral-200 dark:bg-neutral-700 rounded mb-4" />
      <div className="space-y-2">
        <div className="animate-pulse bg-neutral-200 dark:bg-neutral-700 rounded h-5 w-3/4" />
        <div className="animate-pulse bg-neutral-200 dark:bg-neutral-700 rounded h-4 w-full" />
        <div className="animate-pulse bg-neutral-200 dark:bg-neutral-700 rounded h-3 w-1/2 mt-3" />
      </div>
    </div>
  )
}

interface SkeletonAvatarProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function SkeletonAvatar({ size = 'md', className = '' }: SkeletonAvatarProps) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
  }

  return (
    <div
      role="status"
      aria-label="loading"
      className={`animate-pulse bg-neutral-200 dark:bg-neutral-700 rounded-full ${sizeClasses[size]} ${className}`}
    />
  )
}

interface SkeletonButtonProps {
  className?: string
  width?: string
}

export function SkeletonButton({ className = '', width = '120px' }: SkeletonButtonProps) {
  return (
    <div
      role="status"
      aria-label="loading"
      className={`animate-pulse bg-neutral-200 dark:bg-neutral-700 rounded h-10 ${className}`}
      style={{ width }}
    />
  )
}
