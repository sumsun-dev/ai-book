import { SkeletonCard } from '@/components/Skeleton'

export default function ProjectsLoading() {
  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 transition-colors duration-700">
      {/* Header skeleton */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-neutral-50/80 dark:bg-neutral-950/80 border-b border-neutral-200/50 dark:border-neutral-800/50">
        <div className="max-w-7xl mx-auto px-8 py-6 flex items-center justify-between">
          <div className="w-8 h-8 bg-neutral-200 dark:bg-neutral-700 rounded-sm animate-pulse" />
          <div className="w-28 h-10 bg-neutral-200 dark:bg-neutral-700 animate-pulse" />
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-8 py-16">
        {/* Title skeleton */}
        <div className="mb-16">
          <div className="h-14 w-64 bg-neutral-200 dark:bg-neutral-700 animate-pulse rounded mb-4" />
          <div className="h-6 w-40 bg-neutral-200 dark:bg-neutral-700 animate-pulse rounded" />
        </div>

        {/* Grid skeleton */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </main>
    </div>
  )
}
