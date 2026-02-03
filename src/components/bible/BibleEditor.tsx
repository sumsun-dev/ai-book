'use client'

import { useState, useEffect, useCallback } from 'react'
import type { BookBible } from '@/types/book-bible'
import { createEmptyBible } from '@/types/book-bible'
import FictionBibleEditor from './FictionBibleEditor'
import SelfHelpBibleEditor from './SelfHelpBibleEditor'

interface BibleEditorProps {
  projectId: string
  projectType: string
}

export default function BibleEditor({ projectId, projectType }: BibleEditorProps) {
  const [bible, setBible] = useState<BookBible | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)

  // Bible 로드
  useEffect(() => {
    loadBible()
  }, [projectId])

  const loadBible = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/projects/${projectId}/bible`)
      const data = await res.json()
      if (data.success) {
        setBible(data.data)
      } else {
        setBible(createEmptyBible(projectType))
      }
    } catch {
      setError('Bible을 불러오는데 실패했습니다.')
      setBible(createEmptyBible(projectType))
    } finally {
      setIsLoading(false)
    }
  }

  // Bible 저장
  const saveBible = useCallback(async (updatedBible: BookBible) => {
    setIsSaving(true)
    setError(null)
    try {
      const res = await fetch(`/api/projects/${projectId}/bible`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedBible),
      })
      const data = await res.json()
      if (data.success) {
        setBible(data.data)
        setLastSaved(new Date())
      } else {
        setError('저장에 실패했습니다.')
      }
    } catch {
      setError('저장 중 오류가 발생했습니다.')
    } finally {
      setIsSaving(false)
    }
  }, [projectId])

  // Bible 변경 핸들러 (자동 저장)
  const handleBibleChange = useCallback((updatedBible: BookBible) => {
    setBible(updatedBible)
    // 디바운스 저장
    const timer = setTimeout(() => {
      saveBible(updatedBible)
    }, 1000)
    return () => clearTimeout(timer)
  }, [saveBible])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-neutral-900 dark:border-white"></div>
      </div>
    )
  }

  if (!bible) {
    return (
      <div className="text-center py-20 text-neutral-500 dark:text-neutral-400">
        Bible 데이터를 불러올 수 없습니다.
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 상태 표시 */}
      <div className="flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400">
        <div className="flex items-center gap-2">
          {isSaving && (
            <>
              <div className="animate-spin rounded-full h-3 w-3 border-t-2 border-neutral-400"></div>
              <span>저장 중...</span>
            </>
          )}
          {!isSaving && lastSaved && (
            <span>마지막 저장: {lastSaved.toLocaleTimeString()}</span>
          )}
        </div>
        {error && (
          <span className="text-red-500">{error}</span>
        )}
      </div>

      {/* 타입별 에디터 */}
      {bible.type === 'fiction' ? (
        <FictionBibleEditor
          bible={bible}
          onChange={handleBibleChange}
        />
      ) : (
        <SelfHelpBibleEditor
          bible={bible}
          onChange={handleBibleChange}
        />
      )}
    </div>
  )
}
