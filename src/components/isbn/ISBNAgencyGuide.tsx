'use client'

import { useTranslations } from 'next-intl'

const STEPS = [
  { key: 'step1', icon: '1' },
  { key: 'step2', icon: '2' },
  { key: 'step3', icon: '3' },
] as const

const ISBN_AGENCY_URL = 'https://www.nl.go.kr/seoji/'

export default function ISBNAgencyGuide() {
  const t = useTranslations('isbn.guide')

  return (
    <div className="mt-6 p-6 bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-700">
      <h3 className="text-sm font-medium text-neutral-900 dark:text-white mb-1">
        {t('title')}
      </h3>
      <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-4">
        {t('description')}
      </p>

      <div className="space-y-4">
        {STEPS.map(({ key, icon }) => (
          <div key={key} className="flex gap-4">
            <div className="w-8 h-8 flex-shrink-0 flex items-center justify-center bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-sm font-medium">
              {icon}
            </div>
            <div>
              <h4 className="text-sm font-medium text-neutral-900 dark:text-white">
                {t(`${key}.title`)}
              </h4>
              <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-0.5">
                {t(`${key}.description`)}
              </p>
            </div>
          </div>
        ))}
      </div>

      <a
        href={ISBN_AGENCY_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 mt-4 text-sm text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors"
      >
        {t('agencyUrl')}
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
        </svg>
      </a>
    </div>
  )
}
