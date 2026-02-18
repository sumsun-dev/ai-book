'use client'

import Link from 'next/link'
import { useTranslations } from 'next-intl'

const FEATURES = [
  { key: 'agents', icon: '🤖' },
  { key: 'bible', icon: '📖' },
  { key: 'editor', icon: '✏️' },
  { key: 'export', icon: '📄' },
  { key: 'consistency', icon: '🔍' },
  { key: 'feedback', icon: '🔄' },
] as const

export default function FeaturesPage() {
  const t = useTranslations('features')
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

      <main className="max-w-5xl mx-auto px-8 py-20">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-light text-neutral-900 dark:text-white tracking-tight mb-4">
            {t('title')}
          </h1>
          <p className="text-lg text-neutral-500 dark:text-neutral-400">
            {t('subtitle')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {FEATURES.map(({ key, icon }) => (
            <div
              key={key}
              className="p-8 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 transition-all duration-300 hover:border-neutral-400 dark:hover:border-neutral-600"
            >
              <div className="text-3xl mb-4">{icon}</div>
              <h3 className="text-lg font-medium text-neutral-900 dark:text-white mb-2">
                {t(`${key}.title`)}
              </h3>
              <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
                {t(`${key}.description`)}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-16 text-center">
          <Link
            href="/projects"
            className="inline-block px-10 py-4 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-sm font-medium tracking-widest uppercase transition-all duration-500 hover:bg-neutral-700 dark:hover:bg-neutral-200"
          >
            {tCommon('start')}
          </Link>
        </div>
      </main>
    </div>
  )
}
