'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { BookProject, ProjectStage } from '@/types/book'
import {
  LightBulbIcon,
  ListBulletIcon,
  PencilIcon,
  PencilSquareIcon,
  CheckCircleIcon,
  ChevronLeftIcon
} from '@heroicons/react/24/outline'
import { CheckCircleIcon as CheckCircleSolidIcon } from '@heroicons/react/24/solid'

interface StageInfo {
  id: ProjectStage
  label: string
  icon: React.ComponentType<{ className?: string }>
  description: string
}

const stages: StageInfo[] = [
  { id: 'research', label: '리서치', icon: LightBulbIcon, description: '아이디어 구체화' },
  { id: 'outline', label: '목차', icon: ListBulletIcon, description: '구조 설계' },
  { id: 'write', label: '집필', icon: PencilIcon, description: '챕터 작성' },
  { id: 'edit', label: '편집', icon: PencilSquareIcon, description: 'AI 교정' },
  { id: 'review', label: '검토', icon: CheckCircleIcon, description: '최종 확인' },
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

  return (
    <aside className="w-64 bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 h-screen flex flex-col">
      {/* 프로젝트 헤더 */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-800">
        <Link
          href="/projects"
          className="flex items-center text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 mb-3"
        >
          <ChevronLeftIcon className="w-4 h-4 mr-1" />
          프로젝트 목록
        </Link>
        <h2 className="font-semibold text-gray-900 dark:text-white truncate" title={project.title}>
          {project.title}
        </h2>
        <span className="text-xs text-gray-500 dark:text-gray-400 capitalize">
          {project.type}
        </span>
      </div>

      {/* 단계 네비게이션 */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {stages.map((stage, index) => {
            const status = getStageStatus(stage.id)
            const accessible = isStageAccessible(stage.id)
            const isActive = pathname?.includes(`/project/${project.id}/${stage.id}`)
            const Icon = stage.icon

            return (
              <li key={stage.id}>
                <Link
                  href={accessible ? `/project/${project.id}/${stage.id}` : '#'}
                  className={`
                    flex items-center p-3 rounded-lg transition-all
                    ${isActive
                      ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                      : accessible
                        ? 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
                        : 'opacity-50 cursor-not-allowed text-gray-400 dark:text-gray-600'
                    }
                  `}
                  onClick={(e) => !accessible && e.preventDefault()}
                >
                  {/* 단계 아이콘 */}
                  <div className={`
                    w-8 h-8 rounded-full flex items-center justify-center mr-3
                    ${status === 'completed'
                      ? 'bg-green-100 dark:bg-green-900/30'
                      : status === 'current'
                        ? 'bg-blue-100 dark:bg-blue-900/30'
                        : 'bg-gray-100 dark:bg-gray-800'
                    }
                  `}>
                    {status === 'completed' ? (
                      <CheckCircleSolidIcon className="w-5 h-5 text-green-600 dark:text-green-400" />
                    ) : (
                      <Icon className={`w-5 h-5 ${
                        status === 'current'
                          ? 'text-blue-600 dark:text-blue-400'
                          : 'text-gray-400 dark:text-gray-600'
                      }`} />
                    )}
                  </div>

                  {/* 단계 정보 */}
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm">{stage.label}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {stage.description}
                    </div>
                  </div>

                  {/* 연결선 */}
                  {index < stages.length - 1 && (
                    <div className={`
                      absolute left-[2.25rem] top-full w-0.5 h-2
                      ${stageOrder.indexOf(stage.id) < currentStageIndex
                        ? 'bg-green-300 dark:bg-green-700'
                        : 'bg-gray-200 dark:bg-gray-700'
                      }
                    `} />
                  )}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* 하단 정보 */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-800">
        <div className="text-xs text-gray-500 dark:text-gray-400">
          <div className="flex justify-between mb-1">
            <span>진행률</span>
            <span>{Math.round((currentStageIndex / (stages.length - 1)) * 100)}%</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
            <div
              className="bg-blue-600 dark:bg-blue-500 h-1.5 rounded-full transition-all"
              style={{ width: `${(currentStageIndex / (stages.length - 1)) * 100}%` }}
            />
          </div>
        </div>
      </div>
    </aside>
  )
}
