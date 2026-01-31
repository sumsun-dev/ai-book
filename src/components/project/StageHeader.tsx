'use client'

import { ProjectStage } from '@/types/book'
import { ArrowRightIcon, ArrowLeftIcon } from '@heroicons/react/24/outline'

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

export default function StageHeader({
  title,
  description,
  stage,
  onPrevious,
  onNext,
  nextLabel = '다음 단계',
  previousLabel = '이전 단계',
  nextDisabled = false,
  children
}: StageHeaderProps) {
  return (
    <header className="sticky top-0 z-10 bg-white dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800 px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{title}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{description}</p>
        </div>

        <div className="flex items-center gap-3">
          {children}

          {onPrevious && (
            <button
              onClick={onPrevious}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              <ArrowLeftIcon className="w-4 h-4" />
              {previousLabel}
            </button>
          )}

          {onNext && (
            <button
              onClick={onNext}
              disabled={nextDisabled}
              className={`
                flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors
                ${nextDisabled
                  ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-600 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
                }
              `}
            >
              {nextLabel}
              <ArrowRightIcon className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </header>
  )
}
