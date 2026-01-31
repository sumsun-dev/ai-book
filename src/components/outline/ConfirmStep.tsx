'use client'

import { BookOutline } from '@/types/book'
import { CheckCircleIcon } from '@heroicons/react/24/outline'

interface ConfirmStepProps {
  outline: BookOutline
}

export default function ConfirmStep({ outline }: ConfirmStepProps) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
          <CheckCircleIcon className="w-6 h-6 text-green-600" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            목차가 확정되었습니다!
          </h2>
          <p className="text-sm text-gray-500">
            이제 본격적으로 집필을 시작할 수 있습니다
          </p>
        </div>
      </div>

      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
        <h3 className="font-medium text-gray-900 dark:text-white mb-3">
          확정된 목차
        </h3>
        <ol className="space-y-2">
          {outline.chapters.map((chapter) => (
            <li key={chapter.number} className="flex items-start gap-2">
              <span className="text-blue-600 font-medium">
                {chapter.number}.
              </span>
              <span className="text-gray-700 dark:text-gray-300">
                {chapter.title}
              </span>
            </li>
          ))}
        </ol>
      </div>

      <p className="mt-6 text-sm text-gray-500 dark:text-gray-400 text-center">
        다음 단계로 진행하여 각 챕터를 집필해보세요.
      </p>
    </div>
  )
}
