'use client'

import type { ProjectStats } from '@/lib/utils/project-stats'

interface DashboardStatsProps {
  stats: ProjectStats
}

const statCards = [
  {
    key: 'totalChapters' as const,
    label: '전체 챕터',
    format: (v: number) => `${v}개`,
  },
  {
    key: 'completedChapters' as const,
    label: '완료된 챕터',
    format: (v: number) => `${v}개`,
  },
  {
    key: 'totalWords' as const,
    label: '총 단어 수',
    format: (v: number) => v.toLocaleString(),
  },
  {
    key: 'completionPercent' as const,
    label: '진행률',
    format: (v: number) => `${v}%`,
  },
]

export function DashboardStats({ stats }: DashboardStatsProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {statCards.map((card) => (
        <div
          key={card.key}
          className="p-5 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900"
        >
          <p className="text-xs font-medium tracking-wider text-neutral-500 dark:text-neutral-400 uppercase mb-2">
            {card.label}
          </p>
          <p className="text-2xl font-light text-neutral-900 dark:text-white">
            {card.format(stats[card.key])}
          </p>
        </div>
      ))}
    </div>
  )
}
