'use client'

import { useState, useCallback } from 'react'
import { useTranslations } from 'next-intl'

interface IterationResult {
  iteration: number
  scores: {
    grammar: number
    clarity: number
    coherence: number
    engagement: number
    targetFit: number
  }
  overallScore: number
  decision: 'pass' | 'revise'
  strengths: string[]
  weaknesses: string[]
}

interface FeedbackLoopPanelProps {
  projectId: string
  chapterNumber: number
  overallScore: number | null
  onComplete: () => void
}

export default function FeedbackLoopPanel({
  projectId,
  chapterNumber,
  overallScore,
  onComplete,
}: FeedbackLoopPanelProps) {
  const t = useTranslations('feedbackLoop')
  const [isRunning, setIsRunning] = useState(false)
  const [currentIteration, setCurrentIteration] = useState(0)
  const [maxIterations, setMaxIterations] = useState(3)
  const [iterations, setIterations] = useState<IterationResult[]>([])
  const [finalStatus, setFinalStatus] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const shouldShow = overallScore !== null && overallScore < 7

  const startFeedbackLoop = useCallback(async () => {
    setIsRunning(true)
    setIterations([])
    setCurrentIteration(0)
    setFinalStatus(null)
    setError(null)

    try {
      const res = await fetch(`/api/projects/${projectId}/review/feedback-loop`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chapterNumber,
          maxIterations,
          passThreshold: 7,
        }),
      })

      if (!res.ok) {
        throw new Error('Failed to start feedback loop')
      }

      const reader = res.body?.getReader()
      if (!reader) throw new Error('No response body')

      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        let currentEvent = ''
        for (const line of lines) {
          if (line.startsWith('event: ')) {
            currentEvent = line.slice(7)
          } else if (line.startsWith('data: ') && currentEvent) {
            const data = JSON.parse(line.slice(6))

            switch (currentEvent) {
              case 'iteration_start':
                setCurrentIteration(data.iteration)
                break
              case 'iteration_result':
                setIterations(prev => [...prev, data as IterationResult])
                break
              case 'complete':
                setFinalStatus(data.finalStatus)
                break
              case 'error':
                setError(data.error)
                break
            }
            currentEvent = ''
          }
        }
      }
    } catch {
      setError(t('error'))
    } finally {
      setIsRunning(false)
    }
  }, [projectId, chapterNumber, maxIterations, t])

  const getScoreColor = (score: number) => {
    if (score >= 8) return 'text-emerald-600 dark:text-emerald-400'
    if (score >= 6) return 'text-amber-600 dark:text-amber-400'
    return 'text-red-600 dark:text-red-400'
  }

  const getScoreBg = (score: number) => {
    if (score >= 8) return 'bg-emerald-50 dark:bg-emerald-950/30'
    if (score >= 6) return 'bg-amber-50 dark:bg-amber-950/30'
    return 'bg-red-50 dark:bg-red-950/30'
  }

  if (!shouldShow && !isRunning && iterations.length === 0) return null

  return (
    <div className="mt-8 p-6 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-light text-neutral-900 dark:text-white">
            {t('title')}
          </h3>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
            {t('description')}
          </p>
        </div>

        {!isRunning && !finalStatus && (
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400">
              {t('maxIterations')}
              <select
                value={maxIterations}
                onChange={(e) => setMaxIterations(Number(e.target.value))}
                className="px-2 py-1 border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white text-sm"
              >
                <option value={1}>1</option>
                <option value={2}>2</option>
                <option value={3}>3</option>
              </select>
            </label>
            <button
              onClick={startFeedbackLoop}
              className="px-5 py-2.5 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-sm font-medium tracking-wide transition-all duration-300 hover:bg-neutral-700 dark:hover:bg-neutral-200"
            >
              {t('start')}
            </button>
          </div>
        )}
      </div>

      {/* Progress Bar */}
      {isRunning && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-neutral-600 dark:text-neutral-400">
              {t('progress', { current: currentIteration, total: maxIterations })}
            </span>
            <svg className="w-4 h-4 animate-spin text-neutral-400" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          </div>
          <div className="w-full h-1.5 bg-neutral-200 dark:bg-neutral-800">
            <div
              className="h-full bg-neutral-900 dark:bg-white transition-all duration-500"
              style={{ width: `${(currentIteration / maxIterations) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Iteration Results */}
      {iterations.length > 0 && (
        <div className="space-y-4">
          {iterations.map((iter) => (
            <div
              key={iter.iteration}
              className={`p-4 border ${getScoreBg(iter.overallScore)} border-neutral-200 dark:border-neutral-700`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                  {t('iteration', { n: iter.iteration })}
                </span>
                <div className="flex items-center gap-3">
                  <span className={`text-2xl font-light ${getScoreColor(iter.overallScore)}`}>
                    {iter.overallScore}
                  </span>
                  <span className={`
                    px-2 py-0.5 text-xs font-medium
                    ${iter.decision === 'pass'
                      ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                      : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
                    }
                  `}>
                    {iter.decision === 'pass' ? t('pass') : t('revise')}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-5 gap-3 text-center">
                {Object.entries(iter.scores).map(([key, value]) => (
                  <div key={key}>
                    <div className={`text-lg font-light ${getScoreColor(value)}`}>{value}</div>
                    <div className="text-xs text-neutral-500 dark:text-neutral-400">
                      {t(`scores.${key}`)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Final Status */}
      {finalStatus && (
        <div className="mt-6 flex items-center justify-between p-4 bg-neutral-50 dark:bg-neutral-800">
          <div className="flex items-center gap-3">
            {finalStatus === 'passed' ? (
              <svg className="w-6 h-6 text-emerald-600 dark:text-emerald-400" fill="currentColor" viewBox="0 0 24 24">
                <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg className="w-6 h-6 text-amber-600 dark:text-amber-400" fill="currentColor" viewBox="0 0 24 24">
                <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zM12 8.25a.75.75 0 01.75.75v3.75a.75.75 0 01-1.5 0V9a.75.75 0 01.75-.75zm0 8.25a.75.75 0 100-1.5.75.75 0 000 1.5z" clipRule="evenodd" />
              </svg>
            )}
            <span className="text-sm font-medium text-neutral-900 dark:text-white">
              {finalStatus === 'passed' ? t('statusPassed') : t('statusMaxReached')}
            </span>
          </div>
          <button
            onClick={onComplete}
            className="px-4 py-2 text-sm text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors"
          >
            {t('reload')}
          </button>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mt-4 p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 text-sm">
          {error}
        </div>
      )}
    </div>
  )
}
