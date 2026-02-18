import type { Chapter, ProjectStage } from '@/types/book'

export interface ProjectStats {
  totalChapters: number
  completedChapters: number
  totalWords: number
  completionPercent: number
  statusBreakdown: Record<string, number>
}

export function calculateProjectStats(chapters: Chapter[]): ProjectStats {
  const totalChapters = chapters.length
  const completedChapters = chapters.filter(
    (ch) => ch.status === 'approved'
  ).length

  const totalWords = chapters.reduce((sum, ch) => {
    if (!ch.content) return sum
    return sum + ch.content.split(/[\s\n]+/).filter((w) => w.length > 0).length
  }, 0)

  const completionPercent =
    totalChapters > 0
      ? Math.round((completedChapters / totalChapters) * 100)
      : 0

  const statusBreakdown: Record<string, number> = {}
  for (const ch of chapters) {
    statusBreakdown[ch.status] = (statusBreakdown[ch.status] || 0) + 1
  }

  return {
    totalChapters,
    completedChapters,
    totalWords,
    completionPercent,
    statusBreakdown,
  }
}

export function getStageLabel(stage: ProjectStage | string): string {
  const labels: Record<string, string> = {
    research: '리서치',
    outline: '목차',
    write: '집필',
    edit: '편집',
    review: '검토',
  }
  return labels[stage] || stage
}

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export function getChapterStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    pending: '대기',
    writing: '집필 중',
    editing: '편집 중',
    reviewing: '검토 중',
    approved: '완료',
  }
  return labels[status] || status
}
