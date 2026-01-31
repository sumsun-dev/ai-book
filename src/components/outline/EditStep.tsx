'use client'

import { useState } from 'react'
import { BookOutline, ChapterOutline } from '@/types/book'
import {
  CheckCircleIcon,
  PlusIcon,
  TrashIcon,
  PencilIcon,
  Bars3Icon
} from '@heroicons/react/24/outline'

interface EditStepProps {
  outline: BookOutline
  onOutlineChange: (outline: BookOutline) => void
  onConfirm: () => void
  isLoading: boolean
}

export default function EditStep({ outline, onOutlineChange, onConfirm, isLoading }: EditStepProps) {
  const [editingChapter, setEditingChapter] = useState<number | null>(null)
  const [newChapterTitle, setNewChapterTitle] = useState('')

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

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          책 개요
        </h2>
        <textarea
          value={outline.synopsis}
          onChange={(e) => onOutlineChange({ ...outline, synopsis: e.target.value })}
          rows={3}
          className="w-full p-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white resize-none"
        />
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            챕터 목록
          </h2>
          <span className="text-sm text-gray-500">
            {outline.chapters.length}개 챕터
          </span>
        </div>

        <div className="space-y-3">
          {outline.chapters.map((chapter, index) => (
            <div
              key={chapter.number}
              className="flex items-start gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg"
            >
              <Bars3Icon className="w-5 h-5 text-gray-400 cursor-grab mt-1" />
              <div className="flex-1 min-w-0">
                {editingChapter === index ? (
                  <input
                    type="text"
                    value={chapter.title}
                    onChange={(e) => handleUpdateChapter(index, { title: e.target.value })}
                    onBlur={() => setEditingChapter(null)}
                    onKeyDown={(e) => e.key === 'Enter' && setEditingChapter(null)}
                    autoFocus
                    className="w-full p-2 border border-blue-500 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                  />
                ) : (
                  <>
                    <div className="font-medium text-gray-900 dark:text-white">
                      {chapter.number}. {chapter.title}
                    </div>
                    {chapter.summary && (
                      <div className="text-sm text-gray-500 mt-1 truncate">
                        {chapter.summary}
                      </div>
                    )}
                  </>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setEditingChapter(index)}
                  className="p-1 text-gray-400 hover:text-blue-600"
                >
                  <PencilIcon className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleRemoveChapter(index)}
                  className="p-1 text-gray-400 hover:text-red-600"
                >
                  <TrashIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 flex gap-2">
          <input
            type="text"
            value={newChapterTitle}
            onChange={(e) => setNewChapterTitle(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddChapter()}
            placeholder="새 챕터 제목 입력..."
            className="flex-1 p-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white"
          />
          <button
            onClick={handleAddChapter}
            disabled={!newChapterTitle.trim()}
            className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <PlusIcon className="w-5 h-5" />
          </button>
        </div>
      </div>

      <button
        onClick={onConfirm}
        disabled={isLoading}
        className="w-full py-4 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
      >
        <CheckCircleIcon className="w-5 h-5" />
        {isLoading ? '저장 중...' : '목차 확정하기'}
      </button>
    </div>
  )
}
