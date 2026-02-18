'use client'

import { useState, useEffect } from 'react'
import { BookOutline, ChapterOutline } from '@/types/book'

interface EditStepProps {
  outline: BookOutline
  onOutlineChange: (outline: BookOutline) => void
  onConfirm: () => void
  isLoading: boolean
}

export default function EditStep({ outline, onOutlineChange, onConfirm, isLoading }: EditStepProps) {
  const [editingChapter, setEditingChapter] = useState<number | null>(null)
  const [editingSummary, setEditingSummary] = useState<number | null>(null)
  const [newChapterTitle, setNewChapterTitle] = useState('')
  // 처음에 모든 챕터 펼침
  const [expandedChapters, setExpandedChapters] = useState<Set<number>>(
    () => new Set(outline.chapters.map((_, i) => i))
  )

  // outline 변경 시 새 챕터도 펼침
  useEffect(() => {
    setExpandedChapters(prev => {
      const newSet = new Set(prev)
      outline.chapters.forEach((_, i) => newSet.add(i))
      return newSet
    })
  }, [outline.chapters.length])

  const toggleChapter = (index: number) => {
    setExpandedChapters(prev => {
      const newSet = new Set(prev)
      if (newSet.has(index)) {
        newSet.delete(index)
      } else {
        newSet.add(index)
      }
      return newSet
    })
  }

  const handleAddChapter = () => {
    if (!newChapterTitle.trim()) return

    const newChapter: ChapterOutline = {
      number: outline.chapters.length + 1,
      title: newChapterTitle,
      summary: '',
      keyPoints: [],
      sections: []
    }

    onOutlineChange({
      ...outline,
      chapters: [...outline.chapters, newChapter]
    })
    setNewChapterTitle('')
  }

  const handleRemoveChapter = (index: number) => {
    const updatedChapters = outline.chapters
      .filter((_, i) => i !== index)
      .map((ch, i) => ({ ...ch, number: i + 1 }))

    onOutlineChange({
      ...outline,
      chapters: updatedChapters
    })
  }

  const handleUpdateChapter = (index: number, updates: Partial<ChapterOutline>) => {
    const updatedChapters = [...outline.chapters]
    updatedChapters[index] = { ...updatedChapters[index], ...updates }
    onOutlineChange({
      ...outline,
      chapters: updatedChapters
    })
  }

  const moveChapter = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1
    if (newIndex < 0 || newIndex >= outline.chapters.length) return

    const updatedChapters = [...outline.chapters]
    const temp = updatedChapters[index]
    updatedChapters[index] = updatedChapters[newIndex]
    updatedChapters[newIndex] = temp

    // 번호 재정렬
    updatedChapters.forEach((ch, i) => {
      ch.number = i + 1
    })

    onOutlineChange({ ...outline, chapters: updatedChapters })
  }

  return (
    <div className="space-y-8">
      {/* 책 개요 */}
      <div>
        <h2 className="text-2xl font-light text-neutral-900 dark:text-white mb-2 tracking-tight">
          책 개요
        </h2>
        <p className="text-neutral-500 dark:text-neutral-400 text-sm mb-4">
          책의 전체적인 방향과 핵심 메시지를 요약합니다
        </p>
        <textarea
          value={outline.synopsis}
          onChange={(e) => onOutlineChange({ ...outline, synopsis: e.target.value })}
          rows={3}
          aria-label="책 개요"
          className="w-full p-6 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-white focus:outline-none focus:border-neutral-900 dark:focus:border-white transition-colors resize-none"
        />
      </div>

      {/* 챕터 목록 */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-light text-neutral-900 dark:text-white tracking-tight">
              챕터 구성
            </h2>
            <p className="text-neutral-500 dark:text-neutral-400 text-sm mt-1">
              {outline.chapters.length}개 챕터 · 약 {outline.estimatedPages || outline.chapters.length * 20}페이지
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {outline.chapters.map((chapter, index) => (
            <div
              key={chapter.number}
              className="border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 transition-all duration-300"
            >
              {/* 챕터 헤더 */}
              <div className="flex items-center gap-4 p-5">
                <div className="flex flex-col gap-1">
                  <button
                    onClick={() => moveChapter(index, 'up')}
                    disabled={index === 0}
                    aria-label={`${chapter.title} 위로 이동`}
                    className="p-1 text-neutral-400 hover:text-neutral-900 dark:hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                    </svg>
                  </button>
                  <button
                    onClick={() => moveChapter(index, 'down')}
                    disabled={index === outline.chapters.length - 1}
                    aria-label={`${chapter.title} 아래로 이동`}
                    className="p-1 text-neutral-400 hover:text-neutral-900 dark:hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                </div>

                <div className="w-10 h-10 flex items-center justify-center bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 text-sm font-medium">
                  {chapter.number}
                </div>

                <div className="flex-1 min-w-0">
                  {editingChapter === index ? (
                    <input
                      type="text"
                      value={chapter.title}
                      onChange={(e) => handleUpdateChapter(index, { title: e.target.value })}
                      onBlur={() => setEditingChapter(null)}
                      onKeyDown={(e) => e.key === 'Enter' && setEditingChapter(null)}
                      autoFocus
                      className="w-full p-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-900 dark:border-white text-neutral-900 dark:text-white focus:outline-none"
                    />
                  ) : (
                    <button
                      onClick={() => setEditingChapter(index)}
                      className="text-left w-full"
                    >
                      <div className="font-medium text-neutral-900 dark:text-white hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors">
                        {chapter.title}
                      </div>
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleChapter(index)}
                    aria-expanded={expandedChapters.has(index)}
                    aria-label={`${chapter.title} ${expandedChapters.has(index) ? '접기' : '펼치기'}`}
                    className="p-2 text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors"
                  >
                    <svg className={`w-5 h-5 transition-transform ${expandedChapters.has(index) ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleRemoveChapter(index)}
                    aria-label={`${chapter.title} 삭제`}
                    className="p-2 text-neutral-400 hover:text-red-600 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* 챕터 상세 (확장) */}
              {expandedChapters.has(index) && (
                <div className="px-5 pb-5 pt-0 border-t border-neutral-100 dark:border-neutral-800">
                  <div className="pt-5">
                    <label className="text-xs tracking-widest uppercase text-neutral-500 dark:text-neutral-400 mb-2 block">
                      챕터 요약
                    </label>
                    {editingSummary === index ? (
                      <textarea
                        value={chapter.summary}
                        onChange={(e) => handleUpdateChapter(index, { summary: e.target.value })}
                        onBlur={() => setEditingSummary(null)}
                        rows={2}
                        autoFocus
                        className="w-full p-3 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-white focus:outline-none focus:border-neutral-900 dark:focus:border-white resize-none"
                      />
                    ) : (
                      <p
                        onClick={() => setEditingSummary(index)}
                        className="text-neutral-600 dark:text-neutral-400 text-sm cursor-text hover:bg-neutral-50 dark:hover:bg-neutral-800 p-3 -m-3 transition-colors"
                      >
                        {chapter.summary || '클릭하여 요약 추가...'}
                      </p>
                    )}

                    {chapter.keyPoints && chapter.keyPoints.length > 0 && (
                      <div className="mt-4">
                        <label className="text-xs tracking-widest uppercase text-neutral-500 dark:text-neutral-400 mb-2 block">
                          핵심 포인트
                        </label>
                        <ul className="space-y-1">
                          {chapter.keyPoints.map((point, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-neutral-600 dark:text-neutral-400">
                              <span className="text-neutral-400">•</span>
                              {point}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* 새 챕터 추가 */}
        <div className="mt-4 flex gap-3">
          <input
            type="text"
            value={newChapterTitle}
            onChange={(e) => setNewChapterTitle(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddChapter()}
            placeholder="새 챕터 제목..."
            aria-label="새 챕터 제목"
            className="flex-1 p-4 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-600 focus:outline-none focus:border-neutral-900 dark:focus:border-white transition-colors"
          />
          <button
            onClick={handleAddChapter}
            disabled={!newChapterTitle.trim()}
            aria-label="새 챕터 추가"
            className="px-6 py-4 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 hover:bg-neutral-700 dark:hover:bg-neutral-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>
      </div>

      {/* 확정 버튼 */}
      <button
        onClick={onConfirm}
        disabled={isLoading}
        className="w-full py-5 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-sm font-medium tracking-widest uppercase hover:bg-neutral-700 dark:hover:bg-neutral-200 transition-colors flex items-center justify-center gap-3 disabled:opacity-50"
      >
        {isLoading ? (
          <>
            <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            저장 중...
          </>
        ) : (
          <>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            목차 확정하기
          </>
        )}
      </button>
    </div>
  )
}
