'use client'

import Link from 'next/link'
import { useTranslations } from 'next-intl'

const FEATURE_KEYS = ['agents', 'projects', 'export', 'bible', 'consistency', 'feedback'] as const

export default function PricingPage() {
  const t = useTranslations('pricing')
  const tCommon = useTranslations('common')

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 transition-colors">
      <header className="border-b border-neutral-200 dark:border-neutral-800">
        <div className="max-w-5xl mx-auto px-8 py-6 flex items-center justify-between">
          <Link href="/" className="text-lg font-light text-neutral-900 dark:text-white tracking-tight">
            AI Book
          </Link>
          <Link
            href="/projects"
            className="text-sm text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors"
          >
            {tCommon('start')}
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-8 py-20">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-light text-neutral-900 dark:text-white tracking-tight mb-4">
            {t('title')}
          </h1>
          <p className="text-lg text-neutral-500 dark:text-neutral-400">
            {t('subtitle')}
          </p>
        </div>

        <div className="bg-white dark:bg-neutral-900 border-2 border-neutral-900 dark:border-white p-10">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-light text-neutral-900 dark:text-white mb-2">
              {t('beta.title')}
            </h2>
            <div className="text-5xl font-light text-neutral-900 dark:text-white mb-1">
              {t('beta.price')}
            </div>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              {t('beta.period')}
            </p>
          </div>

          <p className="text-center text-neutral-600 dark:text-neutral-400 mb-8">
            {t('beta.description')}
          </p>

          <ul className="space-y-3 mb-10">
            {FEATURE_KEYS.map((key) => (
              <li key={key} className="flex items-center gap-3">
                <svg className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                  <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" />
                </svg>
                <span className="text-neutral-700 dark:text-neutral-300">
                  {t(`beta.features.${key}`)}
                </span>
              </li>
            ))}
          </ul>

          <div className="text-center">
            <Link
              href="/projects"
              className="inline-block px-10 py-4 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-sm font-medium tracking-widest uppercase transition-all duration-500 hover:bg-neutral-700 dark:hover:bg-neutral-200"
            >
              {t('beta.cta')}
            </Link>
          </div>
        </div>

        <p className="mt-8 text-center text-sm text-neutral-500 dark:text-neutral-400">
          {t('notice')}
        </p>
      </main>
    </div>
  )
}
