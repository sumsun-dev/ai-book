'use client'

export default function GeneratingStep() {
  return (
    <div className="py-24 text-center">
      <div className="w-16 h-16 mx-auto mb-8 relative">
        <div className="absolute inset-0 border-2 border-neutral-200 dark:border-neutral-800 animate-ping" />
        <div className="absolute inset-0 border-2 border-neutral-900 dark:border-white" />
      </div>
      <h3 className="text-2xl font-light text-neutral-900 dark:text-white mb-3">
        목차를 설계하고 있습니다
      </h3>
      <p className="text-neutral-500 dark:text-neutral-400 mb-8">
        리서치 결과를 분석하여 최적의 책 구조를 만들고 있습니다...
      </p>

      <div className="max-w-md mx-auto space-y-3">
        <div className="flex items-center gap-4 p-4 border border-neutral-200 dark:border-neutral-800">
          <div className="w-2 h-2 bg-neutral-900 dark:bg-white animate-pulse" />
          <span className="text-sm text-neutral-600 dark:text-neutral-400">독자 분석 중...</span>
        </div>
        <div className="flex items-center gap-4 p-4 border border-neutral-200 dark:border-neutral-800 opacity-50">
          <div className="w-2 h-2 bg-neutral-300 dark:bg-neutral-700" />
          <span className="text-sm text-neutral-400 dark:text-neutral-600">챕터 구조 설계</span>
        </div>
        <div className="flex items-center gap-4 p-4 border border-neutral-200 dark:border-neutral-800 opacity-50">
          <div className="w-2 h-2 bg-neutral-300 dark:bg-neutral-700" />
          <span className="text-sm text-neutral-400 dark:text-neutral-600">섹션 상세화</span>
        </div>
      </div>
    </div>
  )
}
