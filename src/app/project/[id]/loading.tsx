import { Skeleton, SkeletonText } from '@/components/Skeleton'

export default function ProjectLoading() {
  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 transition-colors duration-700">
      {/* Sidebar skeleton */}
      <div className="fixed left-0 top-0 h-full w-64 border-r border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6">
        <Skeleton className="h-8 w-32 mb-8" />
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      </div>

      {/* Main content skeleton */}
      <div className="ml-64 p-8">
        <Skeleton className="h-10 w-72 mb-6" />
        <SkeletonText lines={2} className="mb-8 max-w-xl" />

        {/* Stats cards skeleton */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="p-6 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900"
            >
              <Skeleton className="h-4 w-20 mb-3" />
              <Skeleton className="h-8 w-16" />
            </div>
          ))}
        </div>

        {/* Table skeleton */}
        <div className="border border-neutral-200 dark:border-neutral-800 rounded-lg bg-white dark:bg-neutral-900 p-6">
          <Skeleton className="h-6 w-40 mb-4" />
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
