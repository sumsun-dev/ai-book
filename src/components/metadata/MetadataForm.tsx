'use client'

import { useState, useEffect, useCallback } from 'react'
import AuthorEditor from './AuthorEditor'
import CategoryEditor from './CategoryEditor'
import { BookMetadata, Author, BookCategory } from '@/types/book'

interface MetadataFormProps {
  projectId: string
  onSave?: (metadata: BookMetadata) => void
  onClose?: () => void
}

const LANGUAGES = [
  { code: 'ko', name: '한국어' },
  { code: 'en', name: 'English' },
  { code: 'ja', name: '日本語' },
  { code: 'zh', name: '中文' },
]

const LICENSES = [
  { value: '', name: '선택 안 함' },
  { value: 'all-rights-reserved', name: 'All Rights Reserved' },
  { value: 'CC-BY', name: 'CC BY (저작자표시)' },
  { value: 'CC-BY-NC', name: 'CC BY-NC (비영리)' },
  { value: 'CC-BY-SA', name: 'CC BY-SA (동일조건변경허락)' },
  { value: 'CC-BY-NC-SA', name: 'CC BY-NC-SA' },
  { value: 'CC0', name: 'CC0 (퍼블릭 도메인)' },
]

export default function MetadataForm({ projectId, onSave, onClose }: MetadataFormProps) {
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
      setError('메타데이터를 불러오는데 실패했습니다.')
    } finally {
      setIsLoading(false)
    }
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
        throw new Error('저장 실패')
      }

      const { data } = await res.json()
      onSave?.(data)
      onClose?.()
    } catch {
      setError('메타데이터 저장에 실패했습니다.')
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
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* 기본 정보 */}
      <section className="space-y-4">
        <h2 className="text-sm font-medium text-neutral-900 dark:text-white border-b border-neutral-200 dark:border-neutral-700 pb-2">
          기본 정보
        </h2>

        <div>
          <label className="block text-xs text-neutral-500 dark:text-neutral-400 mb-1">
            부제목
          </label>
          <input
            type="text"
            value={subtitle}
            onChange={(e) => setSubtitle(e.target.value)}
            placeholder="책의 부제목 (선택)"
            className="w-full px-3 py-2 text-sm border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none focus:border-neutral-500"
          />
        </div>

        <AuthorEditor authors={authors} onChange={setAuthors} />
      </section>

      {/* 출판 정보 */}
      <section className="space-y-4">
        <h2 className="text-sm font-medium text-neutral-900 dark:text-white border-b border-neutral-200 dark:border-neutral-700 pb-2">
          출판 정보
        </h2>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-neutral-500 dark:text-neutral-400 mb-1">
              출판사
            </label>
            <input
              type="text"
              value={publisher}
              onChange={(e) => setPublisher(e.target.value)}
              placeholder="출판사 이름"
              className="w-full px-3 py-2 text-sm border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none focus:border-neutral-500"
            />
          </div>
          <div>
            <label className="block text-xs text-neutral-500 dark:text-neutral-400 mb-1">
              출판일
            </label>
            <input
              type="date"
              value={publishDate}
              onChange={(e) => setPublishDate(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none focus:border-neutral-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs text-neutral-500 dark:text-neutral-400 mb-1">
            출판사 주소
          </label>
          <input
            type="text"
            value={publisherAddress}
            onChange={(e) => setPublisherAddress(e.target.value)}
            placeholder="출판사 주소 (선택)"
            className="w-full px-3 py-2 text-sm border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none focus:border-neutral-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-neutral-500 dark:text-neutral-400 mb-1">
              판차
            </label>
            <input
              type="text"
              value={edition}
              onChange={(e) => setEdition(e.target.value)}
              placeholder="예: 초판, 개정판"
              className="w-full px-3 py-2 text-sm border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none focus:border-neutral-500"
            />
          </div>
          <div>
            <label className="block text-xs text-neutral-500 dark:text-neutral-400 mb-1">
              인쇄 부수
            </label>
            <input
              type="number"
              value={printRun}
              onChange={(e) => setPrintRun(e.target.value)}
              placeholder="예: 1000"
              min="1"
              className="w-full px-3 py-2 text-sm border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none focus:border-neutral-500"
            />
          </div>
        </div>
      </section>

      {/* 분류 및 키워드 */}
      <section className="space-y-4">
        <h2 className="text-sm font-medium text-neutral-900 dark:text-white border-b border-neutral-200 dark:border-neutral-700 pb-2">
          분류
        </h2>

        <CategoryEditor categories={categories} onChange={setCategories} />

        <div>
          <label className="block text-xs text-neutral-500 dark:text-neutral-400 mb-1">
            키워드 (쉼표로 구분)
          </label>
          <input
            type="text"
            value={keywords}
            onChange={(e) => setKeywords(e.target.value)}
            placeholder="예: 소설, 판타지, 성장"
            className="w-full px-3 py-2 text-sm border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none focus:border-neutral-500"
          />
        </div>

        <div>
          <label className="block text-xs text-neutral-500 dark:text-neutral-400 mb-1">
            언어
          </label>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none focus:border-neutral-500"
          >
            {LANGUAGES.map((lang) => (
              <option key={lang.code} value={lang.code}>
                {lang.name}
              </option>
            ))}
          </select>
        </div>
      </section>

      {/* 저작권 */}
      <section className="space-y-4">
        <h2 className="text-sm font-medium text-neutral-900 dark:text-white border-b border-neutral-200 dark:border-neutral-700 pb-2">
          저작권
        </h2>

        <div>
          <label className="block text-xs text-neutral-500 dark:text-neutral-400 mb-1">
            저작권 표시
          </label>
          <input
            type="text"
            value={copyright}
            onChange={(e) => setCopyright(e.target.value)}
            placeholder={`예: © ${new Date().getFullYear()} 저자명. All rights reserved.`}
            className="w-full px-3 py-2 text-sm border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none focus:border-neutral-500"
          />
        </div>

        <div>
          <label className="block text-xs text-neutral-500 dark:text-neutral-400 mb-1">
            라이선스
          </label>
          <select
            value={license}
            onChange={(e) => setLicense(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none focus:border-neutral-500"
          >
            {LICENSES.map((lic) => (
              <option key={lic.value} value={lic.value}>
                {lic.name}
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
            취소
          </button>
        )}
        <button
          type="submit"
          disabled={isSaving}
          className="px-4 py-2 text-sm bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 hover:bg-neutral-700 dark:hover:bg-neutral-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isSaving ? '저장 중...' : '저장'}
        </button>
      </div>
    </form>
  )
}
