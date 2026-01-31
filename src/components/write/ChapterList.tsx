'use client'

import { ChapterOutline, Chapter } from '@/types/book'
import { CheckIcon } from '@heroicons/react/24/outline'

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
    <aside className="w-64 bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 overflow-auto">
      <div className="p-4">
        <h3 className="font-medium text-gray-900 dark:text-white mb-3">
          챕터 목록
        </h3>
        <ul className="space-y-1">
          {chapters.map((ch) => {
            const status = getChapterStatus(ch.number)
            return (
              <li key={ch.number}>
                <button
                  onClick={() => onChapterSelect(ch.number)}
                  className={`
                    w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center gap-2
                    ${currentChapter === ch.number
                      ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
                    }
                  `}
                >
                  <span className={`
                    w-5 h-5 rounded-full flex items-center justify-center text-xs
                    ${status === 'done'
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                      : status === 'writing'
                        ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                        : 'bg-gray-100 text-gray-500 dark:bg-gray-800'
                    }
                  `}>
                    {status === 'done' ? <CheckIcon className="w-3 h-3" /> : ch.number}
                  </span>
                  <span className="truncate">{ch.title}</span>
                </button>
              </li>
            )
          })}
        </ul>
      </div>
    </aside>
  )
}
