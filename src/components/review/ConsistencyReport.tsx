'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { ConsistencyIssue, ConsistencyIssueSeverity } from '@/types/book'

interface ConsistencyReportProps {
  projectId: string
}

export default function ConsistencyReport({ projectId }: ConsistencyReportProps) {
  const t = useTranslations('review.consistency')
  const [isChecking, setIsChecking] = useState(false)
  const [issues, setIssues] = useState<ConsistencyIssue[] | null>(null)
  const [summary, setSummary] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const runCheck = async () => {
    setIsChecking(true)
    setError(null)

    try {
      const res = await fetch(`/api/projects/${projectId}/consistency`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })

      if (!res.ok) throw new Error('Check failed')

      const { report } = await res.json()
      setIssues(report.issues)
      setSummary(report.summary)
    } catch {
      setError('Consistency check failed. Please try again.')
    } finally {
      setIsChecking(false)
    }
  }

  const getSeverityColor = (severity: ConsistencyIssueSeverity) => {
    switch (severity) {
      case 'error':
        return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800'
      case 'warning':
        return 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800'
      case 'info':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800'
    }
  }

  const getSeverityBadge = (severity: ConsistencyIssueSeverity) => {
    switch (severity) {
      case 'error':
        return 'bg-red-600 text-white'
      case 'warning':
        return 'bg-amber-500 text-white'
      case 'info':
        return 'bg-blue-500 text-white'
    }
  }

  return (
    <div className="p-8 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 border-t-0">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-light text-neutral-900 dark:text-white mb-1">
            {t('title')}
          </h2>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            {t('description')}
          </p>
        </div>
        <button
          onClick={runCheck}
          disabled={isChecking}
          className={`
            flex items-center gap-2 px-6 py-3 text-sm font-medium tracking-wide transition-all duration-500
            ${isChecking
              ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-400 dark:text-neutral-600'
              : 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 hover:bg-neutral-700 dark:hover:bg-neutral-200'
            }
          `}
        >
          {isChecking ? (
            <>
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              {t('checking')}
            </>
          ) : (
            t('check')
          )}
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 text-sm mb-6">
          {error}
        </div>
      )}

      {issues !== null && (
        <>
          {/* Summary */}
          {summary && (
            <div className="mb-6 p-4 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700">
              <h4 className="text-xs tracking-widest uppercase text-neutral-500 dark:text-neutral-400 mb-2">
                {t('summary')}
              </h4>
              <p className="text-sm text-neutral-700 dark:text-neutral-300">{summary}</p>
              {issues.length > 0 && (
                <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                  {t('issueCount', { count: issues.length })}
                </p>
              )}
            </div>
          )}

          {/* No Issues */}
          {issues.length === 0 && (
            <div className="text-center py-12">
              <svg className="w-12 h-12 mx-auto text-emerald-500 mb-4" fill="currentColor" viewBox="0 0 24 24">
                <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" />
              </svg>
              <p className="text-neutral-600 dark:text-neutral-400">{t('noIssues')}</p>
            </div>
          )}

          {/* Issue List */}
          {issues.length > 0 && (
            <div className="space-y-3">
              {issues.map((issue, idx) => (
                <div
                  key={idx}
                  className={`p-4 border ${getSeverityColor(issue.severity)}`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 text-xs font-medium ${getSeverityBadge(issue.severity)}`}>
                        {t(`severity.${issue.severity}`)}
                      </span>
                      <span className="text-xs text-neutral-500 dark:text-neutral-400">
                        {t(`types.${issue.type}`)}
                      </span>
                    </div>
                    <span className="text-xs text-neutral-500 dark:text-neutral-400">
                      {t('chapters', { a: issue.chapterA, b: issue.chapterB })}
                    </span>
                  </div>
                  <h4 className="text-sm font-medium text-neutral-900 dark:text-white mb-1">
                    {issue.title}
                  </h4>
                  <p className="text-sm text-neutral-600 dark:text-neutral-300">
                    {issue.description}
                  </p>
                  {issue.suggestion && (
                    <div className="mt-2 pt-2 border-t border-neutral-200 dark:border-neutral-700">
                      <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
                        {t('suggestion')}:
                      </span>
                      <p className="text-sm text-neutral-600 dark:text-neutral-300 mt-1">
                        {issue.suggestion}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
