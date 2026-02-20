'use client'

import { useState, useEffect, useRef } from 'react'
import {
  countWords,
  formatElapsedTime,
  estimateProgress,
  type AgentPhase,
} from '@/lib/utils/progress-calculator'

interface GenerationProgressProps {
  isStreaming: boolean
  streamedText: string
  agentPhase: AgentPhase
  estimatedTotalWords?: number
  onStop: () => void
}

export function GenerationProgress({
  isStreaming,
  streamedText,
  agentPhase,
  estimatedTotalWords = 2000,
  onStop,
}: GenerationProgressProps) {
  const [elapsed, setElapsed] = useState(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (isStreaming) {
      setElapsed(0)
      intervalRef.current = setInterval(() => {
        setElapsed((prev) => prev + 1)
      }, 1000)
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [isStreaming])
  /* eslint-enable react-hooks/set-state-in-effect */

  if (!isStreaming) return null

  const wordCount = countWords(streamedText)
  const progress = estimateProgress(wordCount, estimatedTotalWords)

  const phaseLabel: Record<AgentPhase, string> = {
    idle: '준비 중...',
    start: '생성 시작...',
    writing: '집필 중...',
    complete: '완료!',
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white dark:bg-neutral-900 rounded-lg shadow-2xl p-8 max-w-md w-full mx-4">
        {/* Phase label */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-neutral-900 dark:text-white">
            {phaseLabel[agentPhase]}
          </h3>
          <span className="text-sm text-neutral-500 dark:text-neutral-400">
            {formatElapsedTime(elapsed)}
          </span>
        </div>

        {/* Progress bar */}
        <div className="w-full h-2 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden mb-4">
          <div
            className="h-full bg-neutral-900 dark:bg-white rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
            role="progressbar"
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
          />
        </div>

        {/* Stats */}
        <div className="flex items-center justify-between text-sm text-neutral-500 dark:text-neutral-400 mb-6">
          <span>{wordCount.toLocaleString()}단어</span>
          <span>{progress}%</span>
        </div>

        {/* Cancel button */}
        <button
          onClick={onStop}
          className="w-full py-3 border border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 text-sm font-medium tracking-wide transition-all duration-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded"
        >
          생성 중단
        </button>
      </div>
    </div>
  )
}
