'use client'

import { useRef } from 'react'
import { ChapterOutline } from '@/types/book'
import {
  PencilIcon,
  ArrowPathIcon,
  DocumentTextIcon,
  ChevronLeftIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline'

interface ChapterEditorProps {
  chapterOutline: ChapterOutline | null
  content: string
  isWriting: boolean
  currentChapter: number
  totalChapters: number
  onContentChange: (content: string) => void
  onAIWrite: () => void
  onPreviousChapter: () => void
  onNextChapter: () => void
}

export default function ChapterEditor({
  chapterOutline,
  content,
  isWriting,
  currentChapter,
  totalChapters,
  onContentChange,
  onAIWrite,
  onPreviousChapter,
  onNextChapter
}: ChapterEditorProps) {
  const editorRef = useRef<HTMLTextAreaElement>(null)

  return (
    <main className="flex-1 flex flex-col">
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={onPreviousChapter}
            disabled={currentChapter === 1}
            className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
          >
            <ChevronLeftIcon className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {currentChapter}. {chapterOutline?.title || '챕터'}
            </h2>
            <p className="text-sm text-gray-500">
              {chapterOutline?.summary || ''}
            </p>
          </div>
          <button
            onClick={onNextChapter}
            disabled={currentChapter === totalChapters}
            className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
          >
            <ChevronRightIcon className="w-5 h-5" />
          </button>
        </div>

        <button
          onClick={onAIWrite}
          disabled={isWriting}
          className={`
            flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors
            ${isWriting
              ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
            }
          `}
        >
          {isWriting ? (
            <>
              <ArrowPathIcon className="w-5 h-5 animate-spin" />
              AI 집필 중...
            </>
          ) : (
            <>
              <PencilIcon className="w-5 h-5" />
              AI로 작성하기
            </>
          )}
        </button>
      </div>

      <div className="flex-1 p-6">
        <textarea
          ref={editorRef}
          value={content}
          onChange={(e) => onContentChange(e.target.value)}
          disabled={isWriting}
          placeholder="여기에 내용을 입력하거나 'AI로 작성하기' 버튼을 클릭하세요..."
          className="w-full h-full p-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
          style={{ minHeight: '500px' }}
        />
      </div>

      <div className="px-6 py-3 border-t border-gray-200 dark:border-gray-800 flex items-center justify-between text-sm text-gray-500">
        <div className="flex items-center gap-4">
          <span>
            <DocumentTextIcon className="w-4 h-4 inline mr-1" />
            {content.length.toLocaleString()} 자
          </span>
          <span>
            약 {Math.ceil(content.length / 1000)} 페이지
          </span>
        </div>
        <div>
          <span>
            {currentChapter} / {totalChapters} 챕터
          </span>
        </div>
      </div>
    </main>
  )
}
