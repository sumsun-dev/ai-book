'use client'

import type { Chapter } from '@/types/book'
import { getChapterStatusLabel } from '@/lib/utils/project-stats'

interface ChapterSummaryTableProps {
  chapters: Chapter[]
  onChapterClick?: (chapterNumber: number) => void
}

const statusColors: Record<string, string> = {
  pending: 'bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300',
  writing: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
  editing: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300',
  reviewing: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300',
  approved: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300',
}

export function ChapterSummaryTable({
  chapters,
  onChapterClick,
}: ChapterSummaryTableProps) {
  if (chapters.length === 0) {
    return (
      <div className="text-center py-8 text-neutral-500 dark:text-neutral-400">
        아직 챕터가 없습니다
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-neutral-200 dark:border-neutral-800">
            <th className="text-left py-3 px-4 text-xs font-medium tracking-wider text-neutral-500 dark:text-neutral-400 uppercase">
              #
            </th>
            <th className="text-left py-3 px-4 text-xs font-medium tracking-wider text-neutral-500 dark:text-neutral-400 uppercase">
              제목
            </th>
            <th className="text-left py-3 px-4 text-xs font-medium tracking-wider text-neutral-500 dark:text-neutral-400 uppercase">
              상태
            </th>
            <th className="text-right py-3 px-4 text-xs font-medium tracking-wider text-neutral-500 dark:text-neutral-400 uppercase">
              단어 수
            </th>
          </tr>
        </thead>
        <tbody>
          {chapters
            .sort((a, b) => a.number - b.number)
            .map((chapter) => {
              const wordCount = chapter.content
                ? chapter.content.split(/[\s\n]+/).filter((w) => w.length > 0).length
                : 0

              return (
                <tr
                  key={chapter.id || chapter.number}
                  onClick={() => onChapterClick?.(chapter.number)}
                  className={`border-b border-neutral-100 dark:border-neutral-800 transition-colors ${
                    onChapterClick
                      ? 'cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-800/50'
                      : ''
                  }`}
                >
                  <td className="py-3 px-4 text-neutral-500 dark:text-neutral-400">
                    {chapter.number}
                  </td>
                  <td className="py-3 px-4 text-neutral-900 dark:text-white font-medium">
                    {chapter.title}
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-block px-2 py-0.5 text-xs rounded ${
                        statusColors[chapter.status] || statusColors.pending
                      }`}
                    >
                      {getChapterStatusLabel(chapter.status)}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right text-neutral-500 dark:text-neutral-400">
                    {wordCount.toLocaleString()}
                  </td>
                </tr>
              )
            })}
        </tbody>
      </table>
    </div>
  )
}
