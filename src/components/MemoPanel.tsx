'use client'

import { useState, useEffect, useCallback } from 'react'
import type { Memo } from '@/types/book'

interface MemoPanelProps {
  projectId: string
  isOpen: boolean
  onClose: () => void
  currentChapter?: number | null
}

export function MemoPanel({ projectId, isOpen, onClose, currentChapter }: MemoPanelProps) {
  const [memos, setMemos] = useState<Memo[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isAdding, setIsAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [newContent, setNewContent] = useState('')
  const [editContent, setEditContent] = useState('')
  const [linkToChapter, setLinkToChapter] = useState(false)
  const [filterChapter, setFilterChapter] = useState<'all' | 'current' | 'unlinked'>('all')

  const fetchMemos = useCallback(async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/projects/${projectId}/memos`)
      const data = await response.json()
      if (data.success) {
        setMemos(data.data.map((m: Memo) => ({
          ...m,
          createdAt: new Date(m.createdAt),
          updatedAt: new Date(m.updatedAt),
        })))
      }
    } catch (error) {
      console.error('메모 로드 실패:', error)
    } finally {
      setIsLoading(false)
    }
  }, [projectId])

  useEffect(() => {
    if (isOpen) {
      fetchMemos()
    }
  }, [isOpen, fetchMemos])

  const handleAddMemo = async () => {
    if (!newContent.trim()) return

    try {
      const response = await fetch(`/api/projects/${projectId}/memos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: newContent.trim(),
          chapterNumber: linkToChapter && currentChapter ? currentChapter : null,
        }),
      })

      const data = await response.json()
      if (data.success) {
        setMemos([{
          ...data.data,
          createdAt: new Date(data.data.createdAt),
          updatedAt: new Date(data.data.updatedAt),
        }, ...memos])
        setNewContent('')
        setIsAdding(false)
        setLinkToChapter(false)
      }
    } catch (error) {
      console.error('메모 추가 실패:', error)
    }
  }

  const handleUpdateMemo = async (memoId: string) => {
    if (!editContent.trim()) return

    try {
      const response = await fetch(`/api/projects/${projectId}/memos`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          memoId,
          content: editContent.trim(),
        }),
      })

      const data = await response.json()
      if (data.success) {
        setMemos(memos.map(m =>
          m.id === memoId
            ? { ...data.data, createdAt: new Date(data.data.createdAt), updatedAt: new Date(data.data.updatedAt) }
            : m
        ))
        setEditingId(null)
        setEditContent('')
      }
    } catch (error) {
      console.error('메모 수정 실패:', error)
    }
  }

  const handleDeleteMemo = async (memoId: string) => {
    if (!confirm('메모를 삭제하시겠습니까?')) return

    try {
      const response = await fetch(`/api/projects/${projectId}/memos?memoId=${memoId}`, {
        method: 'DELETE',
      })

      const data = await response.json()
      if (data.success) {
        setMemos(memos.filter(m => m.id !== memoId))
      }
    } catch (error) {
      console.error('메모 삭제 실패:', error)
    }
  }

  const startEdit = (memo: Memo) => {
    setEditingId(memo.id)
    setEditContent(memo.content)
  }

  const filteredMemos = memos.filter(memo => {
    if (filterChapter === 'all') return true
    if (filterChapter === 'current') return memo.chapterNumber === currentChapter
    if (filterChapter === 'unlinked') return memo.chapterNumber === null
    return true
  })

  const formatDate = (date: Date) => {
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return '방금 전'
    if (minutes < 60) return `${minutes}분 전`
    if (hours < 24) return `${hours}시간 전`
    if (days < 7) return `${days}일 전`
    return date.toLocaleDateString('ko-KR')
  }

  if (!isOpen) return null

  return (
    <div className="fixed right-0 top-0 h-full w-96 bg-white dark:bg-neutral-900 border-l border-neutral-200 dark:border-neutral-800 shadow-2xl z-50 flex flex-col transition-colors duration-500">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-5 border-b border-neutral-200 dark:border-neutral-800">
        <h2 className="text-lg font-light tracking-tight text-neutral-900 dark:text-white flex items-center gap-3">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          메모
        </h2>
        <button
          onClick={onClose}
          className="p-2 text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Filter */}
      <div className="px-6 py-3 border-b border-neutral-200 dark:border-neutral-800">
        <div className="flex gap-1">
          <button
            onClick={() => setFilterChapter('all')}
            className={`px-4 py-2 text-xs tracking-wider uppercase transition-colors ${
              filterChapter === 'all'
                ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900'
                : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            전체
          </button>
          {currentChapter && (
            <button
              onClick={() => setFilterChapter('current')}
              className={`px-4 py-2 text-xs tracking-wider uppercase transition-colors ${
                filterChapter === 'current'
                  ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900'
                  : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              현재 챕터
            </button>
          )}
          <button
            onClick={() => setFilterChapter('unlinked')}
            className={`px-4 py-2 text-xs tracking-wider uppercase transition-colors ${
              filterChapter === 'unlinked'
                ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900'
                : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            일반
          </button>
        </div>
      </div>

      {/* Memo List */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <svg className="w-6 h-6 animate-spin text-neutral-400" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>
        ) : filteredMemos.length === 0 ? (
          <div className="text-center py-12">
            <svg className="w-12 h-12 mx-auto mb-4 text-neutral-300 dark:text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            <p className="text-neutral-500 dark:text-neutral-400">메모가 없습니다</p>
            <p className="text-sm text-neutral-400 dark:text-neutral-500 mt-1">아이디어나 참고 사항을 기록해보세요</p>
          </div>
        ) : (
          filteredMemos.map((memo) => (
            <div
              key={memo.id}
              className="p-4 bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-100 dark:border-neutral-800 group hover:border-neutral-200 dark:hover:border-neutral-700 transition-colors"
            >
              {editingId === memo.id ? (
                <div className="space-y-3">
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="w-full bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white px-3 py-2 text-sm border border-neutral-200 dark:border-neutral-700 focus:outline-none focus:ring-2 focus:ring-neutral-900 dark:focus:ring-white resize-none"
                    rows={3}
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleUpdateMemo(memo.id)}
                      className="flex-1 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 py-2 text-sm font-medium hover:bg-neutral-700 dark:hover:bg-neutral-200 transition-colors"
                    >
                      저장
                    </button>
                    <button
                      onClick={() => {
                        setEditingId(null)
                        setEditContent('')
                      }}
                      className="flex-1 bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 py-2 text-sm font-medium hover:bg-neutral-300 dark:hover:bg-neutral-600 transition-colors"
                    >
                      취소
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <p className="text-neutral-700 dark:text-neutral-300 text-sm whitespace-pre-wrap leading-relaxed">{memo.content}</p>
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-neutral-200 dark:border-neutral-700">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-neutral-400 dark:text-neutral-500">{formatDate(memo.createdAt)}</span>
                      {memo.chapterNumber && (
                        <span className="px-2 py-0.5 bg-neutral-200 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-400 text-xs">
                          Ch.{memo.chapterNumber}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => startEdit(memo)}
                        className="p-1.5 text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDeleteMemo(memo.id)}
                        className="p-1.5 text-neutral-400 hover:text-red-500 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          ))
        )}
      </div>

      {/* Add Memo Form */}
      {isAdding ? (
        <div className="border-t border-neutral-200 dark:border-neutral-800 p-6 bg-neutral-50 dark:bg-neutral-800/50 space-y-4">
          <textarea
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
            placeholder="메모 내용..."
            rows={3}
            className="w-full bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white px-3 py-2 text-sm border border-neutral-200 dark:border-neutral-700 focus:outline-none focus:ring-2 focus:ring-neutral-900 dark:focus:ring-white resize-none placeholder:text-neutral-400"
            autoFocus
          />
          {currentChapter && (
            <label className="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400 cursor-pointer">
              <input
                type="checkbox"
                checked={linkToChapter}
                onChange={(e) => setLinkToChapter(e.target.checked)}
                className="w-4 h-4 border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-900 focus:ring-neutral-900 dark:focus:ring-white"
              />
              현재 챕터({currentChapter})에 연결
            </label>
          )}
          <div className="flex gap-2">
            <button
              onClick={handleAddMemo}
              disabled={!newContent.trim()}
              className="flex-1 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 py-2.5 text-sm font-medium hover:bg-neutral-700 dark:hover:bg-neutral-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              추가
            </button>
            <button
              onClick={() => {
                setIsAdding(false)
                setNewContent('')
                setLinkToChapter(false)
              }}
              className="flex-1 bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 py-2.5 text-sm font-medium hover:bg-neutral-300 dark:hover:bg-neutral-600 transition-colors"
            >
              취소
            </button>
          </div>
        </div>
      ) : (
        <div className="border-t border-neutral-200 dark:border-neutral-800 p-6">
          <button
            onClick={() => setIsAdding(true)}
            className="w-full flex items-center justify-center gap-2 border border-dashed border-neutral-300 dark:border-neutral-700 text-neutral-500 dark:text-neutral-400 py-3 hover:border-neutral-400 dark:hover:border-neutral-600 hover:text-neutral-700 dark:hover:text-neutral-300 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
            </svg>
            새 메모
          </button>
        </div>
      )}
    </div>
  )
}
