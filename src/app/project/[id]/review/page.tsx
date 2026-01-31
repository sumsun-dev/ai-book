'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import StageHeader from '@/components/project/StageHeader'
import { BookOutline, Chapter } from '@/types/book'
import {
  CheckCircleIcon,
  ExclamationCircleIcon,
  DocumentTextIcon,
  BookOpenIcon,
  ArrowPathIcon,
  CheckBadgeIcon
} from '@heroicons/react/24/outline'
import { CheckCircleIcon as CheckCircleSolid } from '@heroicons/react/24/solid'

interface ReviewState {
  outline: BookOutline | null
  chapters: Map<number, Chapter>
  reviewStatus: Map<number, 'pending' | 'approved' | 'needs_revision'>
  overallScore: number | null
  isEvaluating: boolean
  evaluation: {
    coherence: number
    engagement: number
    clarity: number
    originality: number
    targetFit: number
    feedback: string
  } | null
}

export default function ReviewPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.id as string

  const [state, setState] = useState<ReviewState>({
    outline: null,
    chapters: new Map(),
    reviewStatus: new Map(),
    overallScore: null,
    isEvaluating: false,
    evaluation: null
  })
  const [selectedChapter, setSelectedChapter] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadProjectData()
  }, [projectId])

  const loadProjectData = async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}`)
      if (res.ok) {
        const { data: project } = await res.json()

        const chaptersMap = new Map<number, Chapter>()
        const statusMap = new Map<number, 'pending' | 'approved' | 'needs_revision'>()

        project.chapters?.forEach((ch: Chapter) => {
          chaptersMap.set(ch.number, ch)
          statusMap.set(ch.number, ch.status === 'approved' ? 'approved' : 'pending')
        })

        setState(prev => ({
          ...prev,
          outline: project.outline,
          chapters: chaptersMap,
          reviewStatus: statusMap
        }))
      }
    } catch {
      setError('프로젝트를 불러오는데 실패했습니다.')
    }
  }

  const handleEvaluate = async () => {
    setState(prev => ({ ...prev, isEvaluating: true }))

    try {
      const res = await fetch(`/api/projects/${projectId}/review/evaluate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })

      const data = await res.json()
      if (data.evaluation) {
        const avg = (
          data.evaluation.coherence +
          data.evaluation.engagement +
          data.evaluation.clarity +
          data.evaluation.originality +
          data.evaluation.targetFit
        ) / 5

        setState(prev => ({
          ...prev,
          evaluation: data.evaluation,
          overallScore: Math.round(avg * 10) / 10,
          isEvaluating: false
        }))
      }
    } catch {
      setError('평가에 실패했습니다. 다시 시도해주세요.')
      setState(prev => ({ ...prev, isEvaluating: false }))
    }
  }

  const handleApproveChapter = async (chapterNumber: number) => {
    setState(prev => {
      const newStatus = new Map(prev.reviewStatus)
      newStatus.set(chapterNumber, 'approved')
      return { ...prev, reviewStatus: newStatus }
    })

    await fetch(`/api/projects/${projectId}/chapters`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        number: chapterNumber,
        title: state.outline?.chapters.find(c => c.number === chapterNumber)?.title || '',
        content: state.chapters.get(chapterNumber)?.content || '',
        status: 'approved'
      })
    })
  }

  const handleApproveAll = async () => {
    const newStatus = new Map<number, 'approved'>()
    state.outline?.chapters.forEach(ch => {
      newStatus.set(ch.number, 'approved')
    })

    setState(prev => ({ ...prev, reviewStatus: newStatus }))

    // 모든 챕터 승인
    await Promise.all(
      Array.from(state.chapters.entries()).map(([number, chapter]) =>
        fetch(`/api/projects/${projectId}/chapters`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            number,
            title: chapter.title,
            content: chapter.content,
            status: 'approved'
          })
        })
      )
    )
  }

  const handleComplete = async () => {
    await fetch(`/api/projects/${projectId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'completed', stage: 'review' })
    })

    router.push(`/preview/${projectId}`)
  }

  const handlePreviousStage = () => {
    router.push(`/project/${projectId}/edit`)
  }

  const allApproved = state.outline?.chapters.every(
    ch => state.reviewStatus.get(ch.number) === 'approved'
  ) || false

  const getScoreColor = (score: number) => {
    if (score >= 8) return 'text-green-600'
    if (score >= 6) return 'text-yellow-600'
    return 'text-red-600'
  }

  return (
    <div className="min-h-screen">
      <StageHeader
        title="최종 검토"
        description="책의 완성도를 평가하고 최종 승인합니다"
        stage="review"
        onPrevious={handlePreviousStage}
        previousLabel="편집으로"
      />

      <div className="max-w-5xl mx-auto px-6 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-600 dark:text-red-400">
            {error}
          </div>
        )}

        {/* 전체 평가 섹션 */}
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <BookOpenIcon className="w-6 h-6 text-blue-600" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                전체 평가
              </h2>
            </div>
            <button
              onClick={handleEvaluate}
              disabled={state.isEvaluating}
              className={`
                flex items-center gap-2 px-4 py-2 rounded-lg font-medium
                ${state.isEvaluating
                  ? 'bg-gray-100 text-gray-400'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
                }
              `}
            >
              {state.isEvaluating ? (
                <>
                  <ArrowPathIcon className="w-4 h-4 animate-spin" />
                  평가 중...
                </>
              ) : (
                <>
                  <CheckBadgeIcon className="w-4 h-4" />
                  AI 평가 받기
                </>
              )}
            </button>
          </div>

          {state.evaluation && (
            <div className="grid grid-cols-5 gap-4 mb-6">
              {[
                { key: 'coherence', label: '일관성' },
                { key: 'engagement', label: '흥미도' },
                { key: 'clarity', label: '명확성' },
                { key: 'originality', label: '독창성' },
                { key: 'targetFit', label: '타겟 적합도' }
              ].map(({ key, label }) => (
                <div key={key} className="text-center">
                  <div className={`text-2xl font-bold ${getScoreColor(state.evaluation![key as keyof typeof state.evaluation] as number)}`}>
                    {state.evaluation![key as keyof typeof state.evaluation]}
                  </div>
                  <div className="text-xs text-gray-500">{label}</div>
                </div>
              ))}
            </div>
          )}

          {state.overallScore !== null && (
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div>
                <span className="text-sm text-gray-500">종합 점수</span>
                <div className={`text-3xl font-bold ${getScoreColor(state.overallScore)}`}>
                  {state.overallScore} / 10
                </div>
              </div>
              {state.overallScore >= 7 && (
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircleSolid className="w-6 h-6" />
                  <span className="font-medium">출판 준비 완료!</span>
                </div>
              )}
            </div>
          )}

          {state.evaluation?.feedback && (
            <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <h4 className="font-medium text-blue-800 dark:text-blue-300 mb-2">AI 피드백</h4>
              <p className="text-sm text-blue-700 dark:text-blue-400">
                {state.evaluation.feedback}
              </p>
            </div>
          )}
        </div>

        {/* 챕터별 검토 */}
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              챕터별 검토
            </h2>
            {!allApproved && (
              <button
                onClick={handleApproveAll}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                모두 승인
              </button>
            )}
          </div>

          <div className="space-y-3">
            {state.outline?.chapters.map((chapter) => {
              const status = state.reviewStatus.get(chapter.number) || 'pending'
              const chapterContent = state.chapters.get(chapter.number)

              return (
                <div
                  key={chapter.number}
                  className={`
                    p-4 rounded-lg border cursor-pointer transition-all
                    ${selectedChapter === chapter.number
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                    }
                  `}
                  onClick={() => setSelectedChapter(
                    selectedChapter === chapter.number ? null : chapter.number
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {status === 'approved' ? (
                        <CheckCircleSolid className="w-6 h-6 text-green-600" />
                      ) : (
                        <div className="w-6 h-6 rounded-full border-2 border-gray-300" />
                      )}
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">
                          {chapter.number}. {chapter.title}
                        </div>
                        <div className="text-sm text-gray-500">
                          {chapterContent?.content?.length?.toLocaleString() || 0}자
                        </div>
                      </div>
                    </div>
                    {status !== 'approved' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleApproveChapter(chapter.number)
                        }}
                        className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
                      >
                        승인
                      </button>
                    )}
                  </div>

                  {selectedChapter === chapter.number && chapterContent && (
                    <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded max-h-60 overflow-auto">
                      <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                        {chapterContent.content?.substring(0, 1000)}
                        {(chapterContent.content?.length || 0) > 1000 && '...'}
                      </p>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* 완료 버튼 */}
        {allApproved && (
          <div className="mt-6 text-center">
            <button
              onClick={handleComplete}
              className="px-8 py-4 bg-green-600 text-white rounded-xl font-medium text-lg hover:bg-green-700 transition-colors inline-flex items-center gap-2"
            >
              <CheckCircleIcon className="w-6 h-6" />
              책 완성하기
            </button>
            <p className="mt-2 text-sm text-gray-500">
              모든 챕터가 승인되었습니다. 책을 완성하고 미리보기로 이동합니다.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
