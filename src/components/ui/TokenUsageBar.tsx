'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import type { TokenUsageInfo } from '@/types/book'

const POLL_INTERVAL_NORMAL_MS = 60_000
const POLL_INTERVAL_HIGH_MS = 10_000
const HIGH_USAGE_THRESHOLD = 80

function getBarColor(percentage: number): string {
  if (percentage >= 100) return 'bg-red-500 dark:bg-red-400'
  if (percentage >= 90) return 'bg-yellow-500 dark:bg-yellow-400'
  if (percentage >= 80) return 'bg-orange-500 dark:bg-orange-400'
  return 'bg-emerald-500 dark:bg-emerald-400'
}

function getTextColor(percentage: number): string {
  if (percentage >= 100) return 'text-red-600 dark:text-red-400'
  if (percentage >= 90) return 'text-yellow-600 dark:text-yellow-400'
  if (percentage >= 80) return 'text-orange-600 dark:text-orange-400'
  return 'text-neutral-600 dark:text-neutral-400'
}

export default function TokenUsageBar() {
  const [usage, setUsage] = useState<TokenUsageInfo | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const percentage = usage?.percentage ?? 0

  const fetchUsage = useCallback(async () => {
    try {
      const res = await fetch('/api/usage')
      if (!res.ok) return
      const json = await res.json()
      if (json.success) {
        setUsage({
          ...json.data,
          periodStart: new Date(json.data.periodStart),
          periodEnd: new Date(json.data.periodEnd),
        })
      }
    } catch {
      // 네트워크 에러 무시
    }
  }, [])

  // 적응형 폴링: 80% 이상이면 10초, 미만이면 60초
  useEffect(() => {
    const timeoutId = setTimeout(fetchUsage, 0)

    const pollInterval = percentage >= HIGH_USAGE_THRESHOLD
      ? POLL_INTERVAL_HIGH_MS
      : POLL_INTERVAL_NORMAL_MS

    if (intervalRef.current) clearInterval(intervalRef.current)
    intervalRef.current = setInterval(fetchUsage, pollInterval)

    return () => {
      clearTimeout(timeoutId)
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [fetchUsage, percentage])

  useEffect(() => {
    const handler = () => { fetchUsage() }
    window.addEventListener('quota-updated', handler)
    return () => window.removeEventListener('quota-updated', handler)
  }, [fetchUsage])

  if (!usage) return null

  const { used, limit, periodEnd } = usage

  return (
    <div
      className="px-6 py-4 border-t border-neutral-200 dark:border-neutral-800"
      role="region"
      aria-label="AI 사용량"
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs tracking-wider uppercase text-neutral-500 dark:text-neutral-400">
          AI 사용량
        </span>
        <span className={`text-xs font-medium ${getTextColor(percentage)}`}>
          {percentage}%
        </span>
      </div>
      <div
        className="w-full h-1.5 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden"
        role="progressbar"
        aria-valuenow={percentage}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`AI 사용량 ${percentage}%`}
      >
        <div
          className={`h-full rounded-full transition-all duration-500 ${getBarColor(percentage)}`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
      <p className={`mt-1.5 text-xs ${getTextColor(percentage)}`}>
        {used.toLocaleString()} / {limit.toLocaleString()} 토큰
      </p>
      {percentage >= 100 && (
        <div className="mt-1" role="alert">
          <p className="text-xs text-red-600 dark:text-red-400 font-medium">
            이번 달 한도에 도달했습니다.
          </p>
          <a
            href="/pricing"
            className="mt-1 inline-block text-xs text-blue-600 dark:text-blue-400 hover:underline"
          >
            플랜 업그레이드 &rarr;
          </a>
        </div>
      )}
      {percentage >= 90 && percentage < 100 && (
        <p className="mt-1 text-xs text-yellow-600 dark:text-yellow-400" role="alert" aria-live="polite">
          한도의 90%를 사용했습니다.
        </p>
      )}
      {percentage >= 80 && percentage < 90 && (
        <p className="mt-1 text-xs text-orange-600 dark:text-orange-400" aria-live="polite">
          한도의 80%를 사용했습니다.
        </p>
      )}
      <p className="mt-1 text-xs text-neutral-400 dark:text-neutral-500">
        {periodEnd.toLocaleDateString('ko-KR')} 초기화
      </p>
    </div>
  )
}
