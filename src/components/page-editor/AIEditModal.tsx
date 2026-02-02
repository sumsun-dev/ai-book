'use client'

interface AIEditModalProps {
  isOpen: boolean
  onClose: () => void
  selectedText: string
  editInstruction: string
  onInstructionChange: (instruction: string) => void
  onSubmit: () => void
  isEditing: boolean
}

const QUICK_EDITS = [
  '더 간결하게',
  '더 상세하게',
  '문체 부드럽게',
  '비유 추가',
  '대화체로',
  '오타 수정',
  '문장 다듬기',
]

export default function AIEditModal({
  isOpen,
  onClose,
  selectedText,
  editInstruction,
  onInstructionChange,
  onSubmit,
  isEditing,
}: AIEditModalProps) {
  if (!isOpen) return null

  const displayText = selectedText.length > 300
    ? selectedText.substring(0, 300) + '...'
    : selectedText

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-neutral-900 w-full max-w-lg shadow-2xl">
        <div className="p-5 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
          <h3 className="text-lg font-medium text-neutral-900 dark:text-white">
            AI 수정 요청
          </h3>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* 선택된 텍스트 미리보기 */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              선택한 텍스트
            </label>
            <div className="p-3 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-sm text-neutral-600 dark:text-neutral-400 max-h-32 overflow-auto">
              {displayText}
            </div>
          </div>

          {/* 수정 지시 입력 */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              수정 지시
            </label>
            <textarea
              value={editInstruction}
              onChange={(e) => onInstructionChange(e.target.value)}
              placeholder="예: 더 생동감 있게 수정해줘 / 문장을 간결하게 다듬어줘 / 비유를 추가해줘"
              className="w-full h-24 p-3 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-white text-sm resize-none focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>

          {/* 빠른 수정 버튼들 */}
          <div className="flex flex-wrap gap-2">
            {QUICK_EDITS.map((quick) => (
              <button
                key={quick}
                onClick={() => onInstructionChange(quick)}
                className="px-3 py-1 text-xs bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
              >
                {quick}
              </button>
            ))}
          </div>
        </div>

        <div className="p-5 border-t border-neutral-200 dark:border-neutral-800 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors"
          >
            취소
          </button>
          <button
            onClick={onSubmit}
            disabled={!editInstruction.trim() || isEditing}
            className={`
              flex items-center gap-2 px-5 py-2 text-sm font-medium transition-all
              ${isEditing || !editInstruction.trim()
                ? 'bg-neutral-200 dark:bg-neutral-700 text-neutral-400 cursor-not-allowed'
                : 'bg-violet-600 hover:bg-violet-700 text-white'
              }
            `}
          >
            {isEditing ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                수정 중...
              </>
            ) : (
              'AI로 수정하기'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
