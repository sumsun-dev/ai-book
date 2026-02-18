'use client'

import { useRouter } from 'next/navigation'
import { DashboardStats } from './DashboardStats'
import { ChapterSummaryTable } from './ChapterSummaryTable'
import { calculateProjectStats, getStageLabel, formatDate } from '@/lib/utils/project-stats'
import type { BookProject, ProjectStage } from '@/types/book'

interface ProjectDashboardProps {
  project: BookProject
}

const stages: ProjectStage[] = ['research', 'outline', 'write', 'edit', 'review']

export function ProjectDashboard({ project }: ProjectDashboardProps) {
  const router = useRouter()
  const stats = calculateProjectStats(project.chapters)
  const currentStageIndex = stages.indexOf(project.stage as ProjectStage)

  const handleChapterClick = (chapterNumber: number) => {
    router.push(`/project/${project.id}/write?chapter=${chapterNumber}`)
  }

  const handleContinue = () => {
    router.push(`/project/${project.id}/${project.stage}`)
  }

  return (
    <div className="max-w-5xl mx-auto px-8 py-12 space-y-8">
      {/* Title */}
      <div>
        <h1 className="text-3xl font-light text-neutral-900 dark:text-white tracking-tight mb-2">
          {project.title}
        </h1>
        <p className="text-neutral-500 dark:text-neutral-400">
          {project.description}
        </p>
        <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-2">
          생성: {formatDate(project.createdAt)} | 수정: {formatDate(project.updatedAt)}
        </p>
      </div>

      {/* Stage Progress */}
      <div className="p-6 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
        <h2 className="text-sm font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-4">
          진행 단계
        </h2>
        <div className="flex items-center gap-2">
          {stages.map((stage, index) => {
            const isCompleted = index < currentStageIndex
            const isCurrent = index === currentStageIndex

            return (
              <div key={stage} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-all ${
                      isCompleted
                        ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900'
                        : isCurrent
                          ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 ring-4 ring-neutral-200 dark:ring-neutral-700'
                          : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-400 dark:text-neutral-500'
                    }`}
                  >
                    {isCompleted ? (
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      index + 1
                    )}
                  </div>
                  <span
                    className={`mt-2 text-xs ${
                      isCompleted || isCurrent
                        ? 'text-neutral-900 dark:text-white font-medium'
                        : 'text-neutral-400 dark:text-neutral-500'
                    }`}
                  >
                    {getStageLabel(stage)}
                  </span>
                </div>
                {index < stages.length - 1 && (
                  <div
                    className={`h-0.5 flex-1 mx-1 ${
                      index < currentStageIndex
                        ? 'bg-neutral-900 dark:bg-white'
                        : 'bg-neutral-200 dark:bg-neutral-700'
                    }`}
                  />
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Stats */}
      <DashboardStats stats={stats} />

      {/* Chapter Table */}
      {project.chapters.length > 0 && (
        <div className="rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6">
          <h2 className="text-sm font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-4">
            챕터 목록
          </h2>
          <ChapterSummaryTable
            chapters={project.chapters}
            onChapterClick={handleChapterClick}
          />
        </div>
      )}

      {/* Quick Actions */}
      <div className="flex gap-3">
        <button
          onClick={handleContinue}
          className="px-6 py-3 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-sm font-medium tracking-wide transition-all duration-500 hover:bg-neutral-700 dark:hover:bg-neutral-200"
        >
          {getStageLabel(project.stage)} 계속하기
        </button>
        <button
          onClick={() => router.push('/projects')}
          className="px-6 py-3 border border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 text-sm font-medium tracking-wide transition-all duration-500 hover:border-neutral-500 dark:hover:border-neutral-500"
        >
          프로젝트 목록
        </button>
      </div>
    </div>
  )
}
