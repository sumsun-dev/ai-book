'use client'

import { useState } from 'react'
import { useBookStore } from '@/lib/store'
import type { Reference } from '@/types/book'

interface SourcesPanelProps {
  isOpen: boolean
  onClose: () => void
}

const sourceTypeIcons: Record<Reference['type'], string> = {
  book: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253',
  article: 'M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z',
  website: 'M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9',
  other: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
}

const sourceTypeLabels: Record<Reference['type'], string> = {
  book: '도서',
  article: '논문/기사',
  website: '웹사이트',
  other: '기타',
}

export function SourcesPanel({ isOpen, onClose }: SourcesPanelProps) {
  const { sources, addSource, removeSource } = useBookStore()
  const [isAdding, setIsAdding] = useState(false)
  const [newSource, setNewSource] = useState<Partial<Reference>>({
    type: 'website',
    title: '',
    author: null,
    url: null,
    notes: null,
  })

  const handleAddSource = () => {
    if (!newSource.title?.trim()) return

    addSource({
      title: newSource.title.trim(),
      author: newSource.author?.trim() || null,
      url: newSource.url?.trim() || null,
      type: newSource.type || 'other',
      notes: newSource.notes?.trim() || null,
    })

    setNewSource({
      type: 'website',
      title: '',
      author: null,
      url: null,
      notes: null,
    })
    setIsAdding(false)
  }

  if (!isOpen) return null

  return (
    <div className="fixed right-0 top-0 h-full w-96 bg-white dark:bg-neutral-900 border-l border-neutral-200 dark:border-neutral-700 shadow-xl z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-neutral-200 dark:border-neutral-700">
        <h2 className="text-lg font-semibold text-neutral-900 dark:text-white flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          출처 모음
        </h2>
        <button
          onClick={onClose}
          className="p-2 text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Source List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {sources.length === 0 ? (
          <div className="text-center text-neutral-500 dark:text-neutral-400 py-8">
            <svg className="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={sourceTypeIcons.book} />
            </svg>
            <p>등록된 출처가 없습니다</p>
            <p className="text-sm mt-1">리서치 단계에서 자동으로 추가되거나<br />직접 추가할 수 있습니다</p>
          </div>
        ) : (
          sources.map((source, index) => (
            <div
              key={index}
              className="bg-neutral-100 dark:bg-neutral-800/50 rounded-lg p-3 group hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors"
            >
              <div className="flex items-start gap-3">
                <div className="p-2 bg-neutral-200 dark:bg-neutral-700/50 rounded-lg">
                  <svg className="w-4 h-4 text-neutral-500 dark:text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={sourceTypeIcons[source.type]} />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-neutral-900 dark:text-white font-medium truncate">{source.title}</h3>
                  {source.author && (
                    <p className="text-neutral-600 dark:text-neutral-400 text-sm">{source.author}</p>
                  )}
                  {source.url && (
                    <a
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 dark:text-blue-400 text-sm hover:underline truncate block"
                    >
                      {source.url}
                    </a>
                  )}
                  {source.notes && (
                    <p className="text-neutral-500 dark:text-neutral-500 text-sm mt-1 line-clamp-2">{source.notes}</p>
                  )}
                  <span className="inline-block mt-2 px-2 py-0.5 bg-neutral-200 dark:bg-neutral-700 rounded text-xs text-neutral-600 dark:text-neutral-400">
                    {sourceTypeLabels[source.type]}
                  </span>
                </div>
                <button
                  onClick={() => removeSource(index)}
                  className="p-1 text-neutral-400 dark:text-neutral-500 hover:text-red-500 dark:hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Source Form */}
      {isAdding ? (
        <div className="border-t border-neutral-200 dark:border-neutral-700 p-4 bg-neutral-50 dark:bg-neutral-800/50 space-y-3">
          <div>
            <label className="block text-sm text-neutral-600 dark:text-neutral-400 mb-1">유형</label>
            <select
              value={newSource.type}
              onChange={(e) => setNewSource({ ...newSource, type: e.target.value as Reference['type'] })}
              className="w-full bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white rounded-lg px-3 py-2 text-sm border border-neutral-300 dark:border-neutral-600 focus:border-blue-500 focus:outline-none"
            >
              {Object.entries(sourceTypeLabels).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm text-neutral-600 dark:text-neutral-400 mb-1">제목 *</label>
            <input
              type="text"
              value={newSource.title || ''}
              onChange={(e) => setNewSource({ ...newSource, title: e.target.value })}
              placeholder="출처 제목"
              className="w-full bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white rounded-lg px-3 py-2 text-sm border border-neutral-300 dark:border-neutral-600 focus:border-blue-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm text-neutral-600 dark:text-neutral-400 mb-1">저자</label>
            <input
              type="text"
              value={newSource.author || ''}
              onChange={(e) => setNewSource({ ...newSource, author: e.target.value })}
              placeholder="저자명"
              className="w-full bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white rounded-lg px-3 py-2 text-sm border border-neutral-300 dark:border-neutral-600 focus:border-blue-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm text-neutral-600 dark:text-neutral-400 mb-1">URL</label>
            <input
              type="url"
              value={newSource.url || ''}
              onChange={(e) => setNewSource({ ...newSource, url: e.target.value })}
              placeholder="https://..."
              className="w-full bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white rounded-lg px-3 py-2 text-sm border border-neutral-300 dark:border-neutral-600 focus:border-blue-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm text-neutral-600 dark:text-neutral-400 mb-1">메모</label>
            <textarea
              value={newSource.notes || ''}
              onChange={(e) => setNewSource({ ...newSource, notes: e.target.value })}
              placeholder="참고 사항..."
              rows={2}
              className="w-full bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white rounded-lg px-3 py-2 text-sm border border-neutral-300 dark:border-neutral-600 focus:border-blue-500 focus:outline-none resize-none"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleAddSource}
              disabled={!newSource.title?.trim()}
              className="flex-1 bg-blue-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              추가
            </button>
            <button
              onClick={() => setIsAdding(false)}
              className="flex-1 bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 rounded-lg py-2 text-sm font-medium hover:bg-neutral-300 dark:hover:bg-neutral-600 transition-colors"
            >
              취소
            </button>
          </div>
        </div>
      ) : (
        <div className="border-t border-neutral-200 dark:border-neutral-700 p-4">
          <button
            onClick={() => setIsAdding(true)}
            className="w-full flex items-center justify-center gap-2 bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 rounded-lg py-3 hover:bg-neutral-200 dark:hover:bg-neutral-700 hover:text-neutral-900 dark:hover:text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            출처 추가
          </button>
        </div>
      )}
    </div>
  )
}
