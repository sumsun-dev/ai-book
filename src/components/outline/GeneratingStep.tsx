'use client'

import { ArrowPathIcon } from '@heroicons/react/24/outline'

export default function GeneratingStep() {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-8 text-center">
      <ArrowPathIcon className="w-12 h-12 text-blue-600 mx-auto mb-4 animate-spin" />
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
        목차를 생성하고 있어요
      </h3>
      <p className="text-sm text-gray-500 dark:text-gray-400">
        리서치 결과를 바탕으로 최적의 책 구조를 설계하고 있습니다...
      </p>
    </div>
  )
}
