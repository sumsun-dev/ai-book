'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { ISBNStatus } from '@/types/book'

interface ISBNStatusTrackerProps {
  projectId: string
  currentStatus: ISBNStatus
  appliedAt?: Date | null
  issuedAt?: Date | null
  onStatusChange: (status: ISBNStatus) => void
}

const STATUS_STEPS: ISBNStatus[] = ['draft', 'applied', 'issued']

export default function ISBNStatusTracker({
  projectId,
  currentStatus,
  appliedAt,
  issuedAt,
  onStatusChange,
}: ISBNStatusTrackerProps) {
  const t = useTranslations('isbn.status')
  const [isUpdating, setIsUpdating] = useState(false)

  const currentIndex = STATUS_STEPS.indexOf(currentStatus)

  const handleStatusChange = async (newStatus: ISBNStatus) => {
    setIsUpdating(true)
    try {
      const res = await fetch(`/api/projects/${projectId}/isbn`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })

      if (res.ok) {
        onStatusChange(newStatus)
      }
    } finally {
      setIsUpdating(false)
    }
  }

  const nextStatus = currentIndex < STATUS_STEPS.length - 1
    ? STATUS_STEPS[currentIndex + 1]
    : null

  return (
    <div className="mt-4">
      {/* Progress Steps */}
      <div className="flex items-center gap-0 mb-4">
        {STATUS_STEPS.map((step, idx) => {
          const isCompleted = idx <= currentIndex
          const isCurrent = idx === currentIndex

          return (
            <div key={step} className="flex items-center flex-1">
              <div className="flex flex-col items-center flex-1">
                <div className={`
                  w-8 h-8 flex items-center justify-center text-xs font-medium transition-colors
                  ${isCompleted
                    ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900'
                    : 'border-2 border-neutral-300 dark:border-neutral-600 text-neutral-400 dark:text-neutral-500'
                  }
                  ${isCurrent ? 'ring-2 ring-offset-2 ring-neutral-900 dark:ring-white dark:ring-offset-neutral-900' : ''}
                `}>
                  {isCompleted && idx < currentIndex ? (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    idx + 1
                  )}
                </div>
                <span className={`text-xs mt-1.5 ${
                  isCompleted
                    ? 'text-neutral-900 dark:text-white font-medium'
                    : 'text-neutral-400 dark:text-neutral-500'
                }`}>
                  {t(step)}
                </span>
              </div>
              {idx < STATUS_STEPS.length - 1 && (
                <div className={`h-0.5 flex-1 mx-2 ${
                  idx < currentIndex
                    ? 'bg-neutral-900 dark:bg-white'
                    : 'bg-neutral-200 dark:bg-neutral-700'
                }`} />
              )}
            </div>
          )
        })}
      </div>

      {/* Dates */}
      <div className="flex gap-4 text-xs text-neutral-500 dark:text-neutral-400 mb-3">
        {appliedAt && (
          <span>{t('appliedAt')}: {new Date(appliedAt).toLocaleDateString()}</span>
        )}
        {issuedAt && (
          <span>{t('issuedAt')}: {new Date(issuedAt).toLocaleDateString()}</span>
        )}
      </div>

      {/* Status Update Button */}
      {nextStatus && (
        <button
          onClick={() => handleStatusChange(nextStatus)}
          disabled={isUpdating}
          className="px-4 py-2 text-sm font-medium bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 hover:bg-neutral-700 dark:hover:bg-neutral-200 transition-colors disabled:opacity-50"
        >
          {t('updateStatus')}: {t(nextStatus)}
        </button>
      )}
    </div>
  )
}
