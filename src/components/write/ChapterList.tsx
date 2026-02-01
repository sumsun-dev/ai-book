'use client'

import { ChapterOutline, Chapter } from '@/types/book'

interface ChapterListProps {
  chapters: ChapterOutline[]
  chapterContents: Map<number, Chapter>
  currentChapter: number
  onChapterSelect: (number: number) => void
}

export default function ChapterList({
  chapters,
  chapterContents,
  currentChapter,
  onChapterSelect
}: ChapterListProps) {
  const getChapterStatus = (chapterNumber: number): 'empty' | 'writing' | 'done' => {
    const chapter = chapterContents.get(chapterNumber)
    if (!chapter || !chapter.content) return 'empty'
    if (chapter.content.length > 2000) return 'done'
    return 'writing'
  }

  return (
    <aside className="w-64 bg-white dark:bg-neutral-900 border-r border-neutral-200 dark:border-neutral-800 overflow-auto transition-colors duration-500">
      <div className="p-6 border-b border-neutral-200 dark:border-neutral-800">
        <h3 className="text-xs tracking-widest uppercase text-neutral-500 dark:text-neutral-400">
          챕터 목록
        </h3>
      </div>
      <div className="py-2">
        {chapters.map((ch) => {
          const status = getChapterStatus(ch.number)
          const isActive = currentChapter === ch.number

          return (
            <button
              key={ch.number}
              onClick={() => onChapterSelect(ch.number)}
              className={`
                w-full text-left px-6 py-4 transition-all duration-300 border-l-2
                ${isActive
                  ? 'border-neutral-900 dark:border-white bg-neutral-50 dark:bg-neutral-800'
                  : 'border-transparent hover:bg-neutral-50 dark:hover:bg-neutral-800/50'
                }
              `}
            >
              <div className="flex items-center gap-3">
                <span className={`
                  w-7 h-7 flex items-center justify-center text-xs font-medium transition-all duration-300
                  ${status === 'done'
                    ? 'bg-emerald-600 text-white'
                    : status === 'writing'
                      ? 'bg-amber-500 text-white'
                      : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-500 dark:text-neutral-400'
                  }
                `}>
                  {status === 'done' ? (
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    ch.number
                  )}
                </span>
                <div className="flex-1 min-w-0">
                  <span className={`
                    text-sm truncate block
                    ${isActive
                      ? 'text-neutral-900 dark:text-white'
                      : 'text-neutral-600 dark:text-neutral-400'
                    }
                  `}>
                    {ch.title}
                  </span>
                  {status === 'writing' && (
                    <span className="text-xs text-amber-600 dark:text-amber-400">작성 중</span>
                  )}
                  {status === 'done' && (
                    <span className="text-xs text-emerald-600 dark:text-emerald-400">완료</span>
                  )}
                </div>
              </div>
            </button>
          )
        })}
      </div>
    </aside>
  )
}
