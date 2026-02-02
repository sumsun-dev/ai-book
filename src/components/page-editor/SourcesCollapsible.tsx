'use client'

import { useState, useEffect, useCallback } from 'react'

interface Source {
  id: string
  projectId: string
  title: string
  author: string | null
  url: string | null
  type: 'book' | 'article' | 'website' | 'other'
  notes: string | null
  createdAt: string
  updatedAt: string
}

interface SourcesCollapsibleProps {
  projectId: string
}

const sourceTypeLabels: Record<Source['type'], string> = {
  book: '도서',
  article: '논문/기사',
  website: '웹사이트',
  other: '기타',
}

const sourceTypeIcons: Record<Source['type'], string> = {
  book: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253',
  article: 'M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z',
  website: 'M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9',
  other: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
}

export default function SourcesCollapsible({ projectId }: SourcesCollapsibleProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [sources, setSources] = useState<Source[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isAdding, setIsAdding] = useState(false)
  const [newSource, setNewSource] = useState({
    title: '',
    author: '',
    url: '',
    type: 'website' as Source['type'],
    notes: '',
  })

  const fetchSources = useCallback(async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/projects/${projectId}/sources`)
      const data = await response.json()
      if (data.success) {
        setSources(data.data)
      }
    } catch (error) {
      console.error('출처 로드 실패:', error)
    } finally {
      setIsLoading(false)
    }
  }, [projectId])

  useEffect(() => {
    fetchSources()
  }, [fetchSources])

  const handleAddSource = async () => {
    if (!newSource.title.trim()) return

    try {
      const response = await fetch(`/api/projects/${projectId}/sources`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newSource.title.trim(),
          author: newSource.author.trim() || null,
          url: newSource.url.trim() || null,
          type: newSource.type,
          notes: newSource.notes.trim() || null,
        }),
      })

      const data = await response.json()
      if (data.success) {
        setSources([data.data, ...sources])
        setNewSource({ title: '', author: '', url: '', type: 'website', notes: '' })
        setIsAdding(false)
      }
    } catch (error) {
      console.error('출처 추가 실패:', error)
    }
  }

  const handleDeleteSource = async (sourceId: string) => {
    if (!confirm('출처를 삭제하시겠습니까?')) return

    try {
      const response = await fetch(`/api/projects/${projectId}/sources?sourceId=${sourceId}`, {
        method: 'DELETE',
      })

      const data = await response.json()
      if (data.success) {
        setSources(sources.filter(s => s.id !== sourceId))
      }
    } catch (error) {
      console.error('출처 삭제 실패:', error)
    }
  }

  return (
    <div className="border-t border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800">
      {/* 토글 버튼 */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        aria-label={`출처 (${sources.length})`}
        className="w-full flex items-center justify-between px-4 py-2.5 text-sm text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-750 transition-colors"
      >
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={sourceTypeIcons.book} />
          </svg>
          <span>출처</span>
          <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-medium bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 rounded-full">
            {sources.length}
          </span>
        </div>
        <svg
          className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
        </svg>
      </button>

      {/* 펼쳐진 패널 */}
      {isExpanded && (
        <div className="px-4 pb-4 space-y-3 max-h-64 overflow-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-4">
              <svg className="w-5 h-5 animate-spin text-neutral-500" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            </div>
          ) : sources.length === 0 ? (
            <p className="text-sm text-neutral-500 dark:text-neutral-400 text-center py-4">
              등록된 출처가 없습니다
            </p>
          ) : (
            sources.map((source) => (
              <div
                key={source.id}
                className="flex items-start gap-2 p-2 bg-neutral-50 dark:bg-neutral-900 rounded group"
              >
                <svg className="w-4 h-4 mt-0.5 text-neutral-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={sourceTypeIcons[source.type]} />
                </svg>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200 truncate">
                    {source.title}
                  </p>
                  {source.author && (
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">{source.author}</p>
                  )}
                  {source.url && (
                    <a
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 dark:text-blue-400 hover:underline truncate block"
                    >
                      {source.url}
                    </a>
                  )}
                  <span className="inline-block mt-1 px-1.5 py-0.5 bg-neutral-200 dark:bg-neutral-700 rounded text-xs text-neutral-500 dark:text-neutral-400">
                    {sourceTypeLabels[source.type]}
                  </span>
                </div>
                <button
                  onClick={() => handleDeleteSource(source.id)}
                  aria-label="삭제"
                  className="p-1 text-neutral-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            ))
          )}

          {/* 추가 폼 */}
          {isAdding ? (
            <div className="space-y-2 p-2 bg-neutral-100 dark:bg-neutral-900 rounded">
              <input
                type="text"
                value={newSource.title}
                onChange={(e) => setNewSource({ ...newSource, title: e.target.value })}
                placeholder="출처 제목"
                className="w-full px-2 py-1.5 text-sm bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded focus:outline-none focus:ring-1 focus:ring-neutral-400"
              />
              <input
                type="text"
                value={newSource.author}
                onChange={(e) => setNewSource({ ...newSource, author: e.target.value })}
                placeholder="저자 (선택)"
                className="w-full px-2 py-1.5 text-sm bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded focus:outline-none focus:ring-1 focus:ring-neutral-400"
              />
              <input
                type="url"
                value={newSource.url}
                onChange={(e) => setNewSource({ ...newSource, url: e.target.value })}
                placeholder="URL (선택)"
                className="w-full px-2 py-1.5 text-sm bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded focus:outline-none focus:ring-1 focus:ring-neutral-400"
              />
              <select
                value={newSource.type}
                onChange={(e) => setNewSource({ ...newSource, type: e.target.value as Source['type'] })}
                className="w-full px-2 py-1.5 text-sm bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded focus:outline-none focus:ring-1 focus:ring-neutral-400"
              >
                {Object.entries(sourceTypeLabels).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
              <div className="flex gap-2">
                <button
                  onClick={handleAddSource}
                  disabled={!newSource.title.trim()}
                  className="flex-1 px-3 py-1.5 text-xs font-medium bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded hover:bg-neutral-700 dark:hover:bg-neutral-200 disabled:opacity-50 transition-colors"
                >
                  저장
                </button>
                <button
                  onClick={() => {
                    setIsAdding(false)
                    setNewSource({ title: '', author: '', url: '', type: 'website', notes: '' })
                  }}
                  className="flex-1 px-3 py-1.5 text-xs font-medium bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 rounded hover:bg-neutral-300 dark:hover:bg-neutral-600 transition-colors"
                >
                  취소
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setIsAdding(true)}
              aria-label="추가"
              className="w-full flex items-center justify-center gap-1 px-3 py-2 text-xs text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 border border-dashed border-neutral-300 dark:border-neutral-600 rounded hover:border-neutral-400 dark:hover:border-neutral-500 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              추가
            </button>
          )}
        </div>
      )}
    </div>
  )
}
