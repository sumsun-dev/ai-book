'use client'

import { useState, useEffect } from 'react'

interface BibleOnboardingCardProps {
  projectId: string
  projectType: string
}

export default function BibleOnboardingCard({ projectId, projectType }: BibleOnboardingCardProps) {
  const [isDismissed, setIsDismissed] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    const dismissed = localStorage.getItem(`bible-onboarding-dismissed-${projectId}`)
    if (dismissed) {
      setIsDismissed(true)
    }
    setIsLoaded(true)
  }, [projectId])
  /* eslint-enable react-hooks/set-state-in-effect */

  const handleDismiss = () => {
    localStorage.setItem(`bible-onboarding-dismissed-${projectId}`, 'true')
    setIsDismissed(true)
  }

  if (!isLoaded || isDismissed) {
    return null
  }

  return (
    <div className="mb-6 p-4 bg-gradient-to-r from-emerald-50 to-blue-50 dark:from-emerald-950/30 dark:to-blue-950/30 border border-emerald-200 dark:border-emerald-800 rounded-lg">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center bg-emerald-100 dark:bg-emerald-900/50 rounded-lg">
          <svg className="w-6 h-6 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        </div>
        <div className="flex-1">
          <h3 className="font-medium text-neutral-900 dark:text-white">
            Book Bible이란?
          </h3>
          <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
            AI가 일관된 스토리를 쓸 수 있게 도와주는 설정집입니다.
          </p>
          {projectType === 'fiction' ? (
            <ul className="text-xs text-neutral-500 dark:text-neutral-400 mt-3 space-y-1.5">
              <li className="flex items-center gap-2">
                <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                캐릭터 이름, 성격, 관계를 기억
              </li>
              <li className="flex items-center gap-2">
                <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                세계관 설정을 일관되게 유지
              </li>
              <li className="flex items-center gap-2">
                <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                복선과 플롯을 추적
              </li>
            </ul>
          ) : (
            <ul className="text-xs text-neutral-500 dark:text-neutral-400 mt-3 space-y-1.5">
              <li className="flex items-center gap-2">
                <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                핵심 메시지를 일관되게 전달
              </li>
              <li className="flex items-center gap-2">
                <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                프레임워크를 챕터별로 관리
              </li>
              <li className="flex items-center gap-2">
                <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                사례와 증거를 체계적으로 활용
              </li>
            </ul>
          )}
          <div className="mt-4 pt-3 border-t border-emerald-200/50 dark:border-emerald-700/50">
            <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
              <span className="font-medium text-emerald-600 dark:text-emerald-400">TIP:</span>{' '}
              집필 페이지에서 &quot;자동 추출&quot; 버튼을 사용하면 작성한 내용에서 자동으로 설정을 추출할 수 있어요!
            </p>
          </div>
        </div>
      </div>
      <button
        onClick={handleDismiss}
        className="mt-3 text-xs text-neutral-400 dark:text-neutral-500 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors"
      >
        다시 보지 않기
      </button>
    </div>
  )
}
