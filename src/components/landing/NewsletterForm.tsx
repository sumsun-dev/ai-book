'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'

export default function NewsletterForm() {
  const t = useTranslations('newsletter')
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setStatus('error')
      return
    }

    setStatus('loading')

    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      if (res.ok) {
        setStatus('success')
        setEmail('')
      } else {
        setStatus('error')
      }
    } catch {
      setStatus('error')
    }
  }

  return (
    <div>
      <h4 className="text-sm font-medium text-neutral-900 dark:text-white mb-2">
        {t('title')}
      </h4>
      <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-3">
        {t('description')}
      </p>

      {status === 'success' ? (
        <p className="text-sm text-emerald-600 dark:text-emerald-400">
          {t('success')}
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value)
              if (status === 'error') setStatus('idle')
            }}
            placeholder={t('placeholder')}
            className="flex-1 px-3 py-2 text-sm border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-500 focus:outline-none focus:border-neutral-900 dark:focus:border-white transition-colors"
          />
          <button
            type="submit"
            disabled={status === 'loading'}
            className="px-4 py-2 text-sm font-medium bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 hover:bg-neutral-700 dark:hover:bg-neutral-200 transition-colors disabled:opacity-50"
          >
            {status === 'loading' ? t('subscribing') : t('subscribe')}
          </button>
        </form>
      )}

      {status === 'error' && (
        <p className="mt-2 text-xs text-red-600 dark:text-red-400">
          {t('error')}
        </p>
      )}
    </div>
  )
}
