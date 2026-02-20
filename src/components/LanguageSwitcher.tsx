'use client'

import { useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'
import { locales, type Locale } from '@/i18n/routing'

const LOCALE_LABELS: Record<Locale, string> = {
  ko: '한국어',
  en: 'English',
}

export function LanguageSwitcher() {
  const locale = useLocale()
  const router = useRouter()

  function handleChange(newLocale: Locale) {
    // eslint-disable-next-line react-hooks/immutability
    document.cookie = `locale=${newLocale};path=/;max-age=31536000`
    router.refresh()
  }

  return (
    <div className="flex items-center gap-1">
      {locales.map((loc) => (
        <button
          key={loc}
          onClick={() => handleChange(loc)}
          className={`px-2 py-1 text-xs rounded transition-colors ${
            locale === loc
              ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900'
              : 'text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white'
          }`}
          aria-label={LOCALE_LABELS[loc]}
          aria-current={locale === loc ? 'true' : undefined}
        >
          {LOCALE_LABELS[loc]}
        </button>
      ))}
    </div>
  )
}
