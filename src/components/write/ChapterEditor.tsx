'use client'

import { useRef } from 'react'
import { ChapterOutline } from '@/types/book'

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
    <main className="flex-1 flex flex-col bg-neutral-50 dark:bg-neutral-950 transition-colors duration-500">
      {/* 헤더 */}
      <div className="px-8 py-5 bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={onPreviousChapter}
            disabled={currentChapter === 1}
            className="group p-2 text-neutral-400 dark:text-neutral-500 hover:text-neutral-600 dark:hover:text-neutral-300 disabled:opacity-30 transition-colors"
          >
            <svg className="w-5 h-5 transition-transform duration-300 group-hover:-translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h2 className="text-lg font-light text-neutral-900 dark:text-white tracking-tight">
              {currentChapter}. {chapterOutline?.title || '챕터'}
            </h2>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">
              {chapterOutline?.summary || ''}
            </p>
          </div>
          <button
            onClick={onNextChapter}
            disabled={currentChapter === totalChapters}
            className="group p-2 text-neutral-400 dark:text-neutral-500 hover:text-neutral-600 dark:hover:text-neutral-300 disabled:opacity-30 transition-colors"
          >
            <svg className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        <button
          onClick={onAIWrite}
          disabled={isWriting}
          className={`
            flex items-center gap-2 px-5 py-2.5 text-sm font-medium tracking-wide transition-all duration-500
            ${isWriting
              ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-400 dark:text-neutral-600 cursor-not-allowed'
              : 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 hover:bg-neutral-700 dark:hover:bg-neutral-200'
            }
          `}
        >
          {isWriting ? (
            <>
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              AI 집필 중...
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
              AI로 작성
            </>
          )}
        </button>
      </div>

      {/* 에디터 영역 */}
      <div className="flex-1 p-8">
        <textarea
          ref={editorRef}
          value={content}
          onChange={(e) => onContentChange(e.target.value)}
          disabled={isWriting}
          placeholder="여기에 내용을 입력하거나 'AI로 작성' 버튼을 클릭하세요..."
          className="w-full h-full p-8 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-600 focus:outline-none focus:border-neutral-400 dark:focus:border-neutral-600 transition-colors resize-none font-light leading-relaxed"
          style={{ minHeight: '500px' }}
        />
      </div>

      {/* 상태 바 */}
      <div className="px-8 py-4 bg-white dark:bg-neutral-900 border-t border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
        <div className="flex items-center gap-6 text-sm text-neutral-500 dark:text-neutral-400">
          <span className="flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            {content.length.toLocaleString()}자
          </span>
          <span>약 {Math.ceil(content.length / 1000)}페이지</span>
        </div>
        <span className="text-sm text-neutral-500 dark:text-neutral-400">
          {currentChapter} / {totalChapters} 챕터
        </span>
      </div>
    </main>
  )
}
