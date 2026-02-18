'use client'

import { useTranslations } from 'next-intl'

interface ErrorPageProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  const t = useTranslations('error')

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-neutral-50 dark:bg-neutral-950 px-4">
      <div className="text-center max-w-md">
        <div className="mb-8">
          <svg
            className="mx-auto w-16 h-16 text-neutral-400 dark:text-neutral-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
            />
          </svg>
        </div>

        <h1 className="text-2xl font-light text-neutral-900 dark:text-white tracking-tight mb-3">
          {t('title')}
        </h1>
        <p className="text-neutral-500 dark:text-neutral-400 mb-8">
          {error.message || t('fallback')}
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={reset}
            className="px-6 py-3 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-sm font-medium tracking-wide transition-all duration-500 hover:bg-neutral-700 dark:hover:bg-neutral-200"
          >
            {t('retry')}
          </button>
          <a
            href="/projects"
            className="px-6 py-3 border border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 text-sm font-medium tracking-wide transition-all duration-500 hover:border-neutral-500 dark:hover:border-neutral-500 text-center"
          >
            {t('goHome')}
          </a>
        </div>
      </div>
    </div>
  )
}
