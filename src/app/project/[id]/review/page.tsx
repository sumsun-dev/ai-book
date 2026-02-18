'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import StageHeader from '@/components/project/StageHeader'
import FeedbackLoopPanel from '@/components/review/FeedbackLoopPanel'
import ConsistencyReport from '@/components/review/ConsistencyReport'
import { BookOutline, Chapter } from '@/types/book'

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
  const t = useTranslations('review')

  const [state, setState] = useState<ReviewState>({
    outline: null,
    chapters: new Map(),
    reviewStatus: new Map(),
    overallScore: null,
    isEvaluating: false,
    evaluation: null
  })
  const [selectedChapter, setSelectedChapter] = useState<number | null>(null)
  const [activeTab, setActiveTab] = useState<'quality' | 'consistency'>('quality')
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
      setError('Failed to load project.')
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
      setError('Evaluation failed. Please try again.')
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
    if (score >= 8) return 'text-emerald-600 dark:text-emerald-400'
    if (score >= 6) return 'text-amber-600 dark:text-amber-400'
    return 'text-red-600 dark:text-red-400'
  }

  const evaluationMetrics = [
    { key: 'coherence', label: t('metrics.coherence') },
    { key: 'engagement', label: t('metrics.engagement') },
    { key: 'clarity', label: t('metrics.clarity') },
    { key: 'originality', label: t('metrics.originality') },
    { key: 'targetFit', label: t('metrics.targetFit') }
  ]

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 transition-colors duration-700">
      <StageHeader
        title={t('title')}
        description={t('description')}
        stage="review"
        onPrevious={handlePreviousStage}
        previousLabel={t('previousLabel')}
      />

      <main className="max-w-5xl mx-auto px-8 py-12">
        {error && (
          <div className="mb-8 p-5 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Evaluation Section */}
        <section className="mb-12 p-8 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-xl font-light text-neutral-900 dark:text-white mb-1">
                {t('quality.title')}
              </h2>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">
                {t('quality.description')}
              </p>
            </div>
            <button
              onClick={handleEvaluate}
              disabled={state.isEvaluating}
              className={`
                flex items-center gap-2 px-6 py-3 text-sm font-medium tracking-wide transition-all duration-500
                ${state.isEvaluating
                  ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-400 dark:text-neutral-600'
                  : 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 hover:bg-neutral-700 dark:hover:bg-neutral-200'
                }
              `}
            >
              {state.isEvaluating ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  {t('quality.evaluating')}
                </>
              ) : (
                t('quality.evaluate')
              )}
            </button>
          </div>

          {state.evaluation && (
            <>
              {/* Score Grid */}
              <div className="grid grid-cols-5 gap-6 mb-8">
                {evaluationMetrics.map(({ key, label }) => (
                  <div key={key} className="text-center">
                    <div className={`text-3xl font-light mb-1 ${getScoreColor(state.evaluation![key as keyof typeof state.evaluation] as number)}`}>
                      {state.evaluation![key as keyof typeof state.evaluation]}
                    </div>
                    <div className="text-xs tracking-wider uppercase text-neutral-500 dark:text-neutral-400">
                      {label}
                    </div>
                  </div>
                ))}
              </div>

              {/* Overall Score */}
              {state.overallScore !== null && (
                <div className="flex items-center justify-between p-6 bg-neutral-50 dark:bg-neutral-800">
                  <div>
                    <span className="text-xs tracking-widest uppercase text-neutral-500 dark:text-neutral-400">
                      {t('quality.overallScore')}
                    </span>
                    <div className={`text-4xl font-light ${getScoreColor(state.overallScore)}`}>
                      {state.overallScore} <span className="text-lg text-neutral-400">{t('quality.outOf')}</span>
                    </div>
                  </div>
                  {state.overallScore >= 7 && (
                    <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                        <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" />
                      </svg>
                      <span className="font-medium">{t('quality.readyToPublish')}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Feedback */}
              {state.evaluation.feedback && (
                <div className="mt-6 p-6 border-l-2 border-neutral-300 dark:border-neutral-700">
                  <h4 className="text-xs tracking-widest uppercase text-neutral-500 dark:text-neutral-400 mb-3">
                    {t('quality.aiFeedback')}
                  </h4>
                  <p className="text-neutral-700 dark:text-neutral-300 leading-relaxed">
                    {state.evaluation.feedback}
                  </p>
                </div>
              )}
            </>
          )}
        </section>

        {/* Feedback Loop Panel - shows when score < 7 */}
        {state.evaluation && (
          <FeedbackLoopPanel
            projectId={projectId}
            chapterNumber={selectedChapter || 1}
            overallScore={state.overallScore}
            onComplete={loadProjectData}
          />
        )}

        {/* Tab Navigation */}
        <div className="flex gap-0 mb-0 mt-12 border-b border-neutral-200 dark:border-neutral-800">
          <button
            onClick={() => setActiveTab('quality')}
            className={`px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === 'quality'
                ? 'text-neutral-900 dark:text-white border-b-2 border-neutral-900 dark:border-white'
                : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300'
            }`}
          >
            {t('chapters.title')}
          </button>
          <button
            onClick={() => setActiveTab('consistency')}
            className={`px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === 'consistency'
                ? 'text-neutral-900 dark:text-white border-b-2 border-neutral-900 dark:border-white'
                : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300'
            }`}
          >
            {t('consistency.title')}
          </button>
        </div>

        {/* Consistency Report Tab */}
        {activeTab === 'consistency' && (
          <ConsistencyReport projectId={projectId} />
        )}

        {/* Chapter Review Section */}
        {activeTab === 'quality' && <section className="p-8 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-xl font-light text-neutral-900 dark:text-white mb-1">
                {t('chapters.title')}
              </h2>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">
                {t('chapters.description')}
              </p>
            </div>
            {!allApproved && (
              <button
                onClick={handleApproveAll}
                className="text-sm text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors"
              >
                {t('chapters.approveAll')}
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
                    p-5 border cursor-pointer transition-all duration-300
                    ${selectedChapter === chapter.number
                      ? 'border-neutral-900 dark:border-white'
                      : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-400 dark:hover:border-neutral-600'
                    }
                  `}
                  onClick={() => setSelectedChapter(
                    selectedChapter === chapter.number ? null : chapter.number
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`
                        w-8 h-8 flex items-center justify-center
                        ${status === 'approved'
                          ? 'bg-emerald-600 text-white'
                          : 'border-2 border-neutral-300 dark:border-neutral-700'
                        }
                      `}>
                        {status === 'approved' ? (
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <span className="text-sm text-neutral-400 dark:text-neutral-600">
                            {chapter.number}
                          </span>
                        )}
                      </div>
                      <div>
                        <div className="text-neutral-900 dark:text-white">
                          {chapter.number}. {chapter.title}
                        </div>
                        <div className="text-xs text-neutral-500 dark:text-neutral-400">
                          {t('chapters.charCount', { count: chapterContent?.content?.length?.toLocaleString() || 0 })}
                        </div>
                      </div>
                    </div>
                    {status !== 'approved' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleApproveChapter(chapter.number)
                        }}
                        className="px-4 py-2 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-sm font-medium transition-all duration-300 hover:bg-neutral-700 dark:hover:bg-neutral-200"
                      >
                        {t('chapters.approve')}
                      </button>
                    )}
                  </div>

                  {selectedChapter === chapter.number && chapterContent && (
                    <div className="mt-5 p-5 bg-neutral-50 dark:bg-neutral-800 max-h-64 overflow-auto">
                      <p className="text-sm text-neutral-700 dark:text-neutral-300 whitespace-pre-wrap leading-relaxed">
                        {chapterContent.content?.substring(0, 1000)}
                        {(chapterContent.content?.length || 0) > 1000 && '...'}
                      </p>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </section>}

        {/* Complete Button */}
        {allApproved && (
          <div className="mt-12 text-center">
            <button
              onClick={handleComplete}
              className="px-12 py-5 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-sm font-medium tracking-widest uppercase transition-all duration-500 hover:bg-neutral-700 dark:hover:bg-neutral-200"
            >
              {t('finalize')}
            </button>
            <p className="mt-4 text-sm text-neutral-500 dark:text-neutral-400">
              {t('allApproved')}
            </p>
          </div>
        )}
      </main>
    </div>
  )
}
