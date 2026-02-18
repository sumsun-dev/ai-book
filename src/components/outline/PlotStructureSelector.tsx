'use client'

import { useTranslations } from 'next-intl'
import { PlotStructureType, BookType } from '@/types/book'
import { getApplicableStructures, isPlotStructureApplicable } from '@/lib/plot-structures'

interface PlotStructureSelectorProps {
  bookType: BookType
  value: PlotStructureType
  onChange: (value: PlotStructureType) => void
}

export default function PlotStructureSelector({
  bookType,
  value,
  onChange,
}: PlotStructureSelectorProps) {
  const t = useTranslations('plotStructures')

  if (!isPlotStructureApplicable(bookType)) return null

  const structures = getApplicableStructures(bookType)

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-medium text-neutral-900 dark:text-white mb-1">
          {t('title')}
        </h3>
        <p className="text-xs text-neutral-500 dark:text-neutral-400">
          {t('description')}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {structures.map((structure) => {
          const isSelected = value === structure.id

          return (
            <button
              key={structure.id}
              type="button"
              onClick={() => onChange(structure.id)}
              className={`
                p-4 text-left border transition-all duration-300
                ${isSelected
                  ? 'border-neutral-900 dark:border-white bg-neutral-50 dark:bg-neutral-800'
                  : 'border-neutral-200 dark:border-neutral-700 hover:border-neutral-400 dark:hover:border-neutral-500 bg-white dark:bg-neutral-900'
                }
              `}
            >
              <div className="flex items-start justify-between mb-2">
                <span className={`text-sm font-medium ${
                  isSelected
                    ? 'text-neutral-900 dark:text-white'
                    : 'text-neutral-700 dark:text-neutral-300'
                }`}>
                  {t(`${structure.id}.name`)}
                </span>
                {isSelected && (
                  <svg className="w-4 h-4 text-neutral-900 dark:text-white flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 24 24">
                    <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-2">
                {t(`${structure.id}.description`)}
              </p>
              <span className="text-xs text-neutral-400 dark:text-neutral-500">
                {t(`${structure.id}.genres`)}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
