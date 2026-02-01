'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { BookProject, ProjectStage } from '@/types/book'

interface StageInfo {
  id: ProjectStage
  label: string
  description: string
}

const stages: StageInfo[] = [
  { id: 'research', label: '리서치', description: '아이디어 구체화' },
  { id: 'outline', label: '목차', description: '구조 설계' },
  { id: 'write', label: '집필', description: '챕터 작성' },
  { id: 'edit', label: '편집', description: 'AI 교정' },
  { id: 'review', label: '검토', description: '최종 확인' },
]

const stageOrder: ProjectStage[] = ['research', 'outline', 'write', 'edit', 'review']

interface ProjectSidebarProps {
  project: BookProject
}

export default function ProjectSidebar({ project }: ProjectSidebarProps) {
  const pathname = usePathname()
  const currentStageIndex = stageOrder.indexOf(project.stage)

  const getStageStatus = (stageId: ProjectStage): 'completed' | 'current' | 'upcoming' => {
    const stageIndex = stageOrder.indexOf(stageId)
    if (stageIndex < currentStageIndex) return 'completed'
    if (stageIndex === currentStageIndex) return 'current'
    return 'upcoming'
  }

  const isStageAccessible = (stageId: ProjectStage): boolean => {
    const stageIndex = stageOrder.indexOf(stageId)
    return stageIndex <= currentStageIndex
  }

  const typeLabels: Record<string, string> = {
    fiction: '소설',
    nonfiction: '논픽션',
    selfhelp: '자기계발',
    technical: '기술서',
    essay: '에세이',
    children: '아동도서',
    poetry: '시집'
  }

  return (
    <aside className="w-64 bg-white dark:bg-neutral-900 border-r border-neutral-200 dark:border-neutral-800 h-screen flex flex-col transition-colors duration-500">
      {/* 프로젝트 헤더 */}
      <div className="p-6 border-b border-neutral-200 dark:border-neutral-800">
        <Link
          href="/projects"
          className="group flex items-center gap-2 text-xs tracking-wider uppercase text-neutral-400 dark:text-neutral-500 hover:text-neutral-600 dark:hover:text-neutral-300 mb-4 transition-colors duration-300"
        >
          <svg className="w-4 h-4 transition-transform duration-300 group-hover:-translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          프로젝트 목록
        </Link>
        <h2 className="text-lg font-light text-neutral-900 dark:text-white truncate tracking-tight" title={project.title}>
          {project.title}
        </h2>
        <span className="text-xs text-neutral-500 dark:text-neutral-400">
          {typeLabels[project.type] || project.type}
        </span>
      </div>

      {/* 단계 네비게이션 */}
      <nav className="flex-1 py-6">
        <ul className="space-y-1">
          {stages.map((stage, index) => {
            const status = getStageStatus(stage.id)
            const accessible = isStageAccessible(stage.id)
            const isActive = pathname?.includes(`/project/${project.id}/${stage.id}`)

            return (
              <li key={stage.id}>
                <Link
                  href={accessible ? `/project/${project.id}/${stage.id}` : '#'}
                  className={`
                    flex items-center px-6 py-4 transition-all duration-300 border-l-2
                    ${isActive
                      ? 'border-neutral-900 dark:border-white bg-neutral-50 dark:bg-neutral-800'
                      : accessible
                        ? 'border-transparent hover:bg-neutral-50 dark:hover:bg-neutral-800/50'
                        : 'border-transparent opacity-40 cursor-not-allowed'
                    }
                  `}
                  onClick={(e) => !accessible && e.preventDefault()}
                >
                  {/* 단계 번호/체크 */}
                  <div className={`
                    w-8 h-8 flex items-center justify-center mr-4 text-sm font-medium transition-all duration-300
                    ${status === 'completed'
                      ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900'
                      : status === 'current'
                        ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900'
                        : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-400 dark:text-neutral-500'
                    }
                  `}>
                    {status === 'completed' ? (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      index + 1
                    )}
                  </div>

                  {/* 단계 정보 */}
                  <div className="flex-1 min-w-0">
                    <div className={`text-sm transition-colors duration-300 ${
                      isActive
                        ? 'text-neutral-900 dark:text-white'
                        : 'text-neutral-600 dark:text-neutral-400'
                    }`}>
                      {stage.label}
                    </div>
                    <div className="text-xs text-neutral-400 dark:text-neutral-500 truncate">
                      {stage.description}
                    </div>
                  </div>
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* 하단 진행률 */}
      <div className="p-6 border-t border-neutral-200 dark:border-neutral-800">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs tracking-wider uppercase text-neutral-500 dark:text-neutral-400">
            진행률
          </span>
          <span className="text-xs font-medium text-neutral-900 dark:text-white">
            {Math.round((currentStageIndex / (stages.length - 1)) * 100)}%
          </span>
        </div>
        <div className="w-full h-1 bg-neutral-200 dark:bg-neutral-700">
          <div
            className="h-1 bg-neutral-900 dark:bg-white transition-all duration-500"
            style={{ width: `${(currentStageIndex / (stages.length - 1)) * 100}%` }}
          />
        </div>
      </div>
    </aside>
  )
}
