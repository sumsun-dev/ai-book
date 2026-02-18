'use client'

import { useState, useEffect, useCallback } from 'react'
import { useTranslations } from 'next-intl'
import AuthorEditor from './AuthorEditor'
import CategoryEditor from './CategoryEditor'
import { BookMetadata, Author, BookCategory } from '@/types/book'

interface MetadataFormProps {
  projectId: string
  onSave?: (metadata: BookMetadata) => void
  onClose?: () => void
}

const LANGUAGE_CODES = ['ko', 'en', 'ja', 'zh'] as const

const LICENSE_VALUES = [
  '',
  'all-rights-reserved',
  'CC-BY',
  'CC-BY-NC',
  'CC-BY-SA',
  'CC-BY-NC-SA',
  'CC0',
] as const

export default function MetadataForm({ projectId, onSave, onClose }: MetadataFormProps) {
  const t = useTranslations('metadata')
  const tc = useTranslations('common')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Form state
  const [subtitle, setSubtitle] = useState('')
  const [authors, setAuthors] = useState<Author[]>([])
  const [publisher, setPublisher] = useState('')
  const [publisherAddress, setPublisherAddress] = useState('')
  const [publishDate, setPublishDate] = useState('')
  const [edition, setEdition] = useState('')
  const [printRun, setPrintRun] = useState('')
  const [keywords, setKeywords] = useState('')
  const [language, setLanguage] = useState('ko')
  const [categories, setCategories] = useState<BookCategory[]>([])
  const [copyright, setCopyright] = useState('')
  const [license, setLicense] = useState('')

  const loadMetadata = useCallback(async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}/metadata`)
      const { data } = await res.json()

      if (data) {
        setSubtitle(data.subtitle || '')
        setAuthors(data.authors || [])
        setPublisher(data.publisher || '')
        setPublisherAddress(data.publisherAddress || '')
        setPublishDate(data.publishDate ? new Date(data.publishDate).toISOString().split('T')[0] : '')
        setEdition(data.edition || '')
        setPrintRun(data.printRun?.toString() || '')
        setCategories(data.categories || [])
        setKeywords(data.keywords?.join(', ') || '')
        setLanguage(data.language || 'ko')
        setCopyright(data.copyright || '')
        setLicense(data.license || '')
      }
    } catch {
      setError(t('fetchError'))
    } finally {
      setIsLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId])

  useEffect(() => {
    loadMetadata()
  }, [loadMetadata])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    setError(null)

    try {
      const keywordList = keywords
        .split(',')
        .map((k) => k.trim())
        .filter((k) => k.length > 0)

      const res = await fetch(`/api/projects/${projectId}/metadata`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subtitle: subtitle || null,
          authors,
          publisher: publisher || null,
          publisherAddress: publisherAddress || null,
          publishDate: publishDate || null,
          edition: edition || null,
          printRun: printRun ? parseInt(printRun) : null,
          categories,
          keywords: keywordList,
          language,
          copyright: copyright || null,
          license: license || null,
        }),
      })

      if (!res.ok) {
        throw new Error(t('saveFailed'))
      }

      const { data } = await res.json()
      onSave?.(data)
      onClose?.()
    } catch {
      setError(t('saveError'))
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <svg className="w-6 h-6 animate-spin text-neutral-400" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div
          role="alert"
          className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm"
        >
          {error}
        </div>
      )}

      {/* 기본 정보 */}
      <section className="space-y-4">
        <h2 className="text-sm font-medium text-neutral-900 dark:text-white border-b border-neutral-200 dark:border-neutral-700 pb-2">
          {t('sections.basic')}
        </h2>

        <div>
          <label htmlFor="metadata-subtitle" className="block text-xs text-neutral-500 dark:text-neutral-400 mb-1">
            {t('fields.subtitle')}
          </label>
          <input
            id="metadata-subtitle"
            type="text"
            value={subtitle}
            onChange={(e) => setSubtitle(e.target.value)}
            placeholder={t('fields.subtitlePlaceholder')}
            className="w-full px-3 py-2 text-sm border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none focus:border-neutral-500"
          />
        </div>

        <AuthorEditor authors={authors} onChange={setAuthors} />
      </section>

      {/* 출판 정보 */}
      <section className="space-y-4">
        <h2 className="text-sm font-medium text-neutral-900 dark:text-white border-b border-neutral-200 dark:border-neutral-700 pb-2">
          {t('sections.publishing')}
        </h2>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="metadata-publisher" className="block text-xs text-neutral-500 dark:text-neutral-400 mb-1">
              {t('fields.publisher')}
            </label>
            <input
              id="metadata-publisher"
              type="text"
              value={publisher}
              onChange={(e) => setPublisher(e.target.value)}
              placeholder={t('fields.publisherPlaceholder')}
              className="w-full px-3 py-2 text-sm border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none focus:border-neutral-500"
            />
          </div>
          <div>
            <label htmlFor="metadata-publish-date" className="block text-xs text-neutral-500 dark:text-neutral-400 mb-1">
              {t('fields.publishDate')}
            </label>
            <input
              id="metadata-publish-date"
              type="date"
              value={publishDate}
              onChange={(e) => setPublishDate(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none focus:border-neutral-500"
            />
          </div>
        </div>

        <div>
          <label htmlFor="metadata-publisher-address" className="block text-xs text-neutral-500 dark:text-neutral-400 mb-1">
            {t('fields.publisherAddress')}
          </label>
          <input
            id="metadata-publisher-address"
            type="text"
            value={publisherAddress}
            onChange={(e) => setPublisherAddress(e.target.value)}
            placeholder={t('fields.publisherAddressPlaceholder')}
            className="w-full px-3 py-2 text-sm border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none focus:border-neutral-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="metadata-edition" className="block text-xs text-neutral-500 dark:text-neutral-400 mb-1">
              {t('fields.edition')}
            </label>
            <input
              id="metadata-edition"
              type="text"
              value={edition}
              onChange={(e) => setEdition(e.target.value)}
              placeholder={t('fields.editionPlaceholder')}
              className="w-full px-3 py-2 text-sm border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none focus:border-neutral-500"
            />
          </div>
          <div>
            <label htmlFor="metadata-print-run" className="block text-xs text-neutral-500 dark:text-neutral-400 mb-1">
              {t('fields.printRun')}
            </label>
            <input
              id="metadata-print-run"
              type="number"
              value={printRun}
              onChange={(e) => setPrintRun(e.target.value)}
              placeholder={t('fields.printRunPlaceholder')}
              min="1"
              className="w-full px-3 py-2 text-sm border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none focus:border-neutral-500"
            />
          </div>
        </div>
      </section>

      {/* 분류 및 키워드 */}
      <section className="space-y-4">
        <h2 className="text-sm font-medium text-neutral-900 dark:text-white border-b border-neutral-200 dark:border-neutral-700 pb-2">
          {t('sections.classification')}
        </h2>

        <CategoryEditor categories={categories} onChange={setCategories} />

        <div>
          <label htmlFor="metadata-keywords" className="block text-xs text-neutral-500 dark:text-neutral-400 mb-1">
            {t('fields.keywords')}
          </label>
          <input
            id="metadata-keywords"
            type="text"
            value={keywords}
            onChange={(e) => setKeywords(e.target.value)}
            placeholder={t('fields.keywordsPlaceholder')}
            className="w-full px-3 py-2 text-sm border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none focus:border-neutral-500"
          />
        </div>

        <div>
          <label htmlFor="metadata-language" className="block text-xs text-neutral-500 dark:text-neutral-400 mb-1">
            {t('fields.language')}
          </label>
          <select
            id="metadata-language"
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none focus:border-neutral-500"
          >
            {LANGUAGE_CODES.map((code) => (
              <option key={code} value={code}>
                {t(`languages.${code}`)}
              </option>
            ))}
          </select>
        </div>
      </section>

      {/* 저작권 */}
      <section className="space-y-4">
        <h2 className="text-sm font-medium text-neutral-900 dark:text-white border-b border-neutral-200 dark:border-neutral-700 pb-2">
          {t('sections.copyright')}
        </h2>

        <div>
          <label htmlFor="metadata-copyright" className="block text-xs text-neutral-500 dark:text-neutral-400 mb-1">
            {t('fields.copyrightNotice')}
          </label>
          <input
            id="metadata-copyright"
            type="text"
            value={copyright}
            onChange={(e) => setCopyright(e.target.value)}
            placeholder={t('fields.copyrightPlaceholder', { year: new Date().getFullYear() })}
            className="w-full px-3 py-2 text-sm border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none focus:border-neutral-500"
          />
        </div>

        <div>
          <label htmlFor="metadata-license" className="block text-xs text-neutral-500 dark:text-neutral-400 mb-1">
            {t('fields.license')}
          </label>
          <select
            id="metadata-license"
            value={license}
            onChange={(e) => setLicense(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none focus:border-neutral-500"
          >
            <option value="">-</option>
            {LICENSE_VALUES.filter(v => v !== '').map((value) => (
              <option key={value} value={value}>
                {t(`licenses.${value.toLowerCase()}`)}
              </option>
            ))}
          </select>
        </div>
      </section>

      {/* 버튼 */}
      <div className="flex justify-end gap-3 pt-4 border-t border-neutral-200 dark:border-neutral-700">
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors"
          >
            {tc('cancel')}
          </button>
        )}
        <button
          type="submit"
          disabled={isSaving}
          className="px-4 py-2 text-sm bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 hover:bg-neutral-700 dark:hover:bg-neutral-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isSaving ? tc('saving') : tc('save')}
        </button>
      </div>
    </form>
  )
}
