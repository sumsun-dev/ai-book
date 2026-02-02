'use client'

import { BookOutline } from '@/types/book'

interface ConfirmStepProps {
  outline: BookOutline
}

export default function ConfirmStep({ outline }: ConfirmStepProps) {
  return (
    <div className="space-y-8">
      {/* 완료 헤더 */}
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-neutral-900 dark:bg-white flex items-center justify-center">
          <svg className="w-6 h-6 text-white dark:text-neutral-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <div>
          <h2 className="text-2xl font-light text-neutral-900 dark:text-white">
            목차 확정 완료
          </h2>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm">
            이제 본격적으로 집필을 시작할 수 있습니다
          </p>
        </div>
      </div>

      {/* 개요 */}
      <div className="p-6 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
        <h3 className="text-xs tracking-widest uppercase text-neutral-500 dark:text-neutral-400 mb-4">
          책 개요
        </h3>
        <p className="text-neutral-700 dark:text-neutral-300 leading-relaxed">
          {outline.synopsis}
        </p>
      </div>

      {/* 확정된 목차 */}
      <div className="p-6 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xs tracking-widest uppercase text-neutral-500 dark:text-neutral-400">
            확정된 목차
          </h3>
          <span className="text-xs text-neutral-400 dark:text-neutral-500">
            {outline.chapters.length}개 챕터
          </span>
        </div>
        <ol className="space-y-4">
          {outline.chapters.map((chapter) => (
            <li key={chapter.number} className="flex items-start gap-4">
              <span className="w-8 h-8 flex items-center justify-center bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 text-sm">
                {chapter.number}
              </span>
              <div className="flex-1">
                <div className="font-medium text-neutral-900 dark:text-white">
                  {chapter.title}
                </div>
                {chapter.summary && (
                  <div className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                    {chapter.summary}
                  </div>
                )}
              </div>
            </li>
          ))}
        </ol>
      </div>

      {/* 통계 */}
      <div className="grid grid-cols-3 gap-4">
        <div className="p-5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-center">
          <div className="text-2xl font-light text-neutral-900 dark:text-white">
            {outline.chapters.length}
          </div>
          <div className="text-xs tracking-widest uppercase text-neutral-500 dark:text-neutral-400 mt-1">
            챕터
          </div>
        </div>
        <div className="p-5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-center">
          <div className="text-2xl font-light text-neutral-900 dark:text-white">
            {outline.estimatedPages || '~200'}
          </div>
          <div className="text-xs tracking-widest uppercase text-neutral-500 dark:text-neutral-400 mt-1">
            예상 페이지
          </div>
        </div>
        <div className="p-5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-center">
          <div className="text-2xl font-light text-neutral-900 dark:text-white">
            {outline.tone === 'formal' ? '격식체' :
             outline.tone === 'casual' ? '친근체' :
             outline.tone === 'academic' ? '학술체' :
             outline.tone === 'narrative' ? '서술체' :
             outline.tone === 'motivational' ? '동기부여' : outline.tone}
          </div>
          <div className="text-xs tracking-widest uppercase text-neutral-500 dark:text-neutral-400 mt-1">
            문체
          </div>
        </div>
      </div>

      <p className="text-center text-neutral-500 dark:text-neutral-400 text-sm pt-4">
        상단의 "집필 시작" 버튼을 눌러 각 챕터를 집필해보세요.
      </p>
    </div>
  )
}
