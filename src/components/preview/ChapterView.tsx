'use client'

import { useMemo } from 'react'
import { marked } from 'marked'
import { sanitizeHtml } from '@/lib/sanitize'
import type { Chapter, ChapterOutline } from '@/types/book'

// marked 설정
marked.setOptions({
  gfm: true,
  breaks: true,
})

interface ChapterViewProps {
  chapter?: Chapter | null
  chapterOutline?: ChapterOutline
  chapterNumber: number
  totalChapters: number
  onPrevious?: () => void
  onNext?: () => void
  onBackToToc: () => void
}

export function ChapterView({
  chapter,
  chapterOutline,
  chapterNumber,
  totalChapters,
  onPrevious,
  onNext,
  onBackToToc,
}: ChapterViewProps) {
  const title = chapter?.title ?? chapterOutline?.title ?? `챕터 ${chapterNumber}`
  const hasContent = chapter?.content && chapter.content.trim().length > 0

  const renderedContent = useMemo(() => {
    if (!chapter?.content || !chapter.content.trim().length) return ''
    return sanitizeHtml(marked.parse(chapter.content) as string)
  }, [chapter])

  return (
    <div className="bg-gray-800/50 rounded-xl p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <button
          onClick={onBackToToc}
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          목차로
        </button>
        <span className="text-gray-400 text-sm">
          {chapterNumber} / {totalChapters}
        </span>
      </div>

      {/* Chapter title */}
      <div className="mb-8">
        <p className="text-blue-400 text-sm uppercase tracking-wider mb-2">
          Chapter {chapterNumber}
        </p>
        <h1 className="text-3xl font-bold text-white">{title}</h1>
        {chapterOutline?.summary && (
          <p className="text-gray-400 mt-2 italic">{chapterOutline.summary}</p>
        )}
      </div>

      {/* Content */}
      {hasContent ? (
        <div
          className="prose prose-invert prose-lg max-w-none prose-headings:text-white prose-p:text-gray-300 prose-strong:text-white prose-em:text-gray-200 prose-a:text-blue-400 prose-blockquote:border-l-blue-500 prose-blockquote:text-gray-400 prose-code:text-purple-300 prose-pre:bg-gray-900"
          dangerouslySetInnerHTML={{ __html: renderedContent }}
        />
      ) : (
        <div className="text-gray-400 space-y-6">
          <div className="bg-gray-700/30 rounded-lg p-6">
            <p className="text-center text-gray-500 mb-4">
              이 챕터는 아직 작성되지 않았습니다
            </p>
            {chapterOutline && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-300 mb-2">챕터 요약</h3>
                  <p className="text-gray-400">{chapterOutline.summary}</p>
                </div>
                {chapterOutline.keyPoints && chapterOutline.keyPoints.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-300 mb-2">핵심 포인트</h3>
                    <ul className="list-disc list-inside space-y-1">
                      {chapterOutline.keyPoints.map((point, idx) => (
                        <li key={idx} className="text-gray-400">{point}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {chapterOutline.sections && chapterOutline.sections.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-300 mb-2">섹션 구성</h3>
                    <ul className="space-y-2">
                      {chapterOutline.sections.map((section) => (
                        <li key={section.id} className="text-gray-400">
                          <span className="text-white">{section.title}</span>
                          {section.summary && (
                            <span className="text-gray-500"> - {section.summary}</span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between mt-12 pt-8 border-t border-gray-700">
        <button
          onClick={onPrevious}
          disabled={!onPrevious}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
            onPrevious
              ? 'bg-gray-700 hover:bg-gray-600 text-white'
              : 'bg-gray-800 text-gray-600 cursor-not-allowed'
          }`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          이전 챕터
        </button>

        <button
          onClick={onNext}
          disabled={!onNext}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
            onNext
              ? 'bg-gray-700 hover:bg-gray-600 text-white'
              : 'bg-gray-800 text-gray-600 cursor-not-allowed'
          }`}
        >
          다음 챕터
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  )
}
