'use client'

import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { ProjectStage } from '@/types/book'

interface StageHeaderProps {
  title: string
  description: string
  stage: ProjectStage
  onPrevious?: () => void
  onNext?: () => void
  nextLabel?: string
  previousLabel?: string
  nextDisabled?: boolean
  children?: React.ReactNode
}

const stageOrder: ProjectStage[] = ['research', 'outline', 'write', 'edit', 'review']

export default function StageHeader({
  title,
  description,
  stage,
  onPrevious,
  onNext,
  nextLabel,
  previousLabel,
  nextDisabled = false,
  children
}: StageHeaderProps) {
  const router = useRouter()
  const t = useTranslations('common')
  const currentIndex = stageOrder.indexOf(stage)

  const resolvedNextLabel = nextLabel ?? t('next')
  const resolvedPreviousLabel = previousLabel ?? t('previous')

  return (
    <header className="sticky top-0 z-40 backdrop-blur-xl bg-white/80 dark:bg-neutral-950/80 border-b border-neutral-200/50 dark:border-neutral-800/50">
      <div className="max-w-7xl mx-auto">
        {/* Progress Bar */}
        <div className="px-8 pt-4 pb-2">
          <div className="flex items-center justify-between mb-2">
            <button
              onClick={() => router.push('/projects')}
              className="group flex items-center gap-2 text-sm text-neutral-400 dark:text-neutral-500 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors duration-300"
            >
              <svg className="w-4 h-4 transition-transform duration-300 group-hover:-translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              {t('projects')}
            </button>

            {/* Stage Progress */}
            <div className="flex items-center gap-1">
              {stageOrder.map((s, i) => (
                <div key={s} className="flex items-center">
                  <div
                    className={`
                      px-3 py-1 text-xs font-medium tracking-wider transition-all duration-500
                      ${i === currentIndex
                        ? 'text-neutral-900 dark:text-white'
                        : i < currentIndex
                          ? 'text-neutral-400 dark:text-neutral-500'
                          : 'text-neutral-300 dark:text-neutral-700'
                      }
                    `}
                  >
                    {t(`stages.${s}`)}
                  </div>
                  {i < stageOrder.length - 1 && (
                    <div
                      className={`
                        w-8 h-px transition-colors duration-500
                        ${i < currentIndex
                          ? 'bg-neutral-400 dark:bg-neutral-500'
                          : 'bg-neutral-200 dark:bg-neutral-800'
                        }
                      `}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Main Header */}
        <div className="px-8 py-6 flex items-end justify-between">
          <div>
            <h1 className="text-3xl md:text-4xl font-extralight tracking-tight text-neutral-900 dark:text-white mb-1">
              {title}
            </h1>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 font-light">
              {description}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {children}

            {onPrevious && (
              <button
                onClick={onPrevious}
                className="group flex items-center gap-2 px-5 py-2.5 text-sm font-medium tracking-wide text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors duration-300"
              >
                <svg className="w-4 h-4 transition-transform duration-300 group-hover:-translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                {resolvedPreviousLabel}
              </button>
            )}

            {onNext && (
              <button
                onClick={onNext}
                disabled={nextDisabled}
                className={`
                  group flex items-center gap-2 px-5 py-2.5 text-sm font-medium tracking-wide transition-all duration-500
                  ${nextDisabled
                    ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-400 dark:text-neutral-600 cursor-not-allowed'
                    : 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 hover:bg-neutral-700 dark:hover:bg-neutral-200'
                  }
                `}
              >
                {resolvedNextLabel}
                <svg className={`w-4 h-4 transition-transform duration-300 ${!nextDisabled ? 'group-hover:translate-x-1' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
