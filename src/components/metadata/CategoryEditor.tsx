'use client'

import { useState } from 'react'
import type { BookCategory } from '@/types/book'
import { BISAC_CATEGORIES, KDC_CATEGORIES } from '@/lib/constants/categories'
import type { CategoryOption } from '@/lib/constants/categories'

type CategorySystem = BookCategory['system']

interface CategoryEditorProps {
  categories: BookCategory[]
  onChange: (categories: BookCategory[]) => void
}

const SYSTEM_LABELS: Record<CategorySystem, string> = {
  BISAC: 'BISAC',
  KDC: 'KDC',
  DDC: 'DDC',
  custom: '직접 입력',
}

const SYSTEM_OPTIONS: Record<string, CategoryOption[]> = {
  BISAC: BISAC_CATEGORIES,
  KDC: KDC_CATEGORIES,
}

export default function CategoryEditor({ categories, onChange }: CategoryEditorProps) {
  const [isAdding, setIsAdding] = useState(false)
  const [selectedSystem, setSelectedSystem] = useState<CategorySystem>('BISAC')
  const [selectedCode, setSelectedCode] = useState('')
  const [customCode, setCustomCode] = useState('')
  const [customName, setCustomName] = useState('')

  const currentOptions = SYSTEM_OPTIONS[selectedSystem] || []

  const handleAdd = () => {
    let newCategory: BookCategory

    if (selectedSystem === 'custom' || selectedSystem === 'DDC') {
      if (!customCode.trim() || !customName.trim()) return
      newCategory = {
        system: selectedSystem,
        code: customCode.trim(),
        name: customName.trim(),
      }
    } else {
      if (!selectedCode) return
      const option = currentOptions.find((o) => o.code === selectedCode)
      if (!option) return
      newCategory = {
        system: selectedSystem,
        code: option.code,
        name: option.name,
      }
    }

    const isDuplicate = categories.some(
      (c) => c.system === newCategory.system && c.code === newCategory.code
    )
    if (isDuplicate) return

    onChange([...categories, newCategory])
    resetForm()
  }

  const handleRemove = (index: number) => {
    onChange(categories.filter((_, i) => i !== index))
  }

  const resetForm = () => {
    setIsAdding(false)
    setSelectedCode('')
    setCustomCode('')
    setCustomName('')
  }

  const handleSystemChange = (system: CategorySystem) => {
    setSelectedSystem(system)
    setSelectedCode('')
    setCustomCode('')
    setCustomName('')
  }

  const isCustomInput = selectedSystem === 'custom' || selectedSystem === 'DDC'

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
          카테고리
        </h3>
        {!isAdding && (
          <button
            type="button"
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-1 px-3 py-1.5 text-xs text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white border border-neutral-300 dark:border-neutral-700 hover:border-neutral-400 dark:hover:border-neutral-600 transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            추가
          </button>
        )}
      </div>

      {isAdding && (
        <div className="p-4 border border-neutral-300 dark:border-neutral-600 bg-neutral-50 dark:bg-neutral-800/50 space-y-3">
          <div>
            <label className="block text-xs text-neutral-500 dark:text-neutral-400 mb-1">
              분류 체계
            </label>
            <select
              value={selectedSystem}
              onChange={(e) => handleSystemChange(e.target.value as CategorySystem)}
              className="w-full px-3 py-2 text-sm border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none focus:border-neutral-500"
            >
              {Object.entries(SYSTEM_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          {isCustomInput ? (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-neutral-500 dark:text-neutral-400 mb-1">
                  코드
                </label>
                <input
                  type="text"
                  value={customCode}
                  onChange={(e) => setCustomCode(e.target.value)}
                  placeholder="예: 813.6"
                  className="w-full px-3 py-2 text-sm border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none focus:border-neutral-500"
                />
              </div>
              <div>
                <label className="block text-xs text-neutral-500 dark:text-neutral-400 mb-1">
                  카테고리명
                </label>
                <input
                  type="text"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder="예: American Fiction"
                  className="w-full px-3 py-2 text-sm border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none focus:border-neutral-500"
                />
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-xs text-neutral-500 dark:text-neutral-400 mb-1">
                카테고리
              </label>
              <select
                value={selectedCode}
                onChange={(e) => setSelectedCode(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none focus:border-neutral-500"
              >
                <option value="">선택하세요</option>
                {currentOptions.map((opt) => (
                  <option key={opt.code} value={opt.code}>
                    {opt.code} - {opt.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={resetForm}
              className="px-3 py-1.5 text-xs text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors"
            >
              취소
            </button>
            <button
              type="button"
              onClick={handleAdd}
              className="px-3 py-1.5 text-xs bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 hover:bg-neutral-700 dark:hover:bg-neutral-200 transition-colors"
            >
              추가
            </button>
          </div>
        </div>
      )}

      {categories.length === 0 && !isAdding ? (
        <p className="text-sm text-neutral-500 dark:text-neutral-400 py-4 text-center border border-dashed border-neutral-300 dark:border-neutral-700">
          카테고리가 없습니다. 추가 버튼을 눌러 분류를 등록하세요.
        </p>
      ) : (
        <div className="space-y-2">
          {categories.map((category, index) => (
            <div
              key={`${category.system}-${category.code}`}
              className="flex items-center justify-between p-3 border border-neutral-200 dark:border-neutral-700"
            >
              <div>
                <p className="text-sm font-medium text-neutral-900 dark:text-white">
                  {category.code} - {category.name}
                </p>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  {category.system}
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleRemove(index)}
                className="p-1 text-neutral-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                aria-label={`${category.name} 삭제`}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
