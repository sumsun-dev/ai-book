'use client'

import { Cog6ToothIcon } from '@heroicons/react/24/outline'

interface Settings {
  targetAudience: string
  targetLength: number
  tone: string
}

interface SettingsStepProps {
  settings: Settings
  onSettingsChange: (settings: Settings) => void
  onSubmit: () => void
  isLoading: boolean
}

const TONE_OPTIONS = [
  { value: 'formal', label: '격식체', description: '정중하고 공식적인 문체' },
  { value: 'casual', label: '친근체', description: '편안하고 대화하듯 하는 문체' },
  { value: 'academic', label: '학술체', description: '논리적이고 학문적인 문체' },
  { value: 'narrative', label: '서술체', description: '이야기를 들려주는 듯한 문체' },
  { value: 'motivational', label: '동기부여체', description: '독자를 격려하는 문체' }
]

export default function SettingsStep({ settings, onSettingsChange, onSubmit, isLoading }: SettingsStepProps) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
      <div className="flex items-center gap-3 mb-6">
        <Cog6ToothIcon className="w-6 h-6 text-blue-600" />
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          책 설정
        </h2>
      </div>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            타겟 독자
          </label>
          <input
            type="text"
            value={settings.targetAudience}
            onChange={(e) => onSettingsChange({ ...settings, targetAudience: e.target.value })}
            placeholder="예: 20-30대 창업을 꿈꾸는 직장인"
            className="w-full p-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            목표 페이지 수: {settings.targetLength}페이지
          </label>
          <input
            type="range"
            min={50}
            max={500}
            step={10}
            value={settings.targetLength}
            onChange={(e) => onSettingsChange({ ...settings, targetLength: Number(e.target.value) })}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>50p (소책자)</span>
            <span>250p (일반)</span>
            <span>500p (대작)</span>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            문체 선택
          </label>
          <div className="grid grid-cols-2 gap-3">
            {TONE_OPTIONS.map((tone) => (
              <button
                key={tone.value}
                onClick={() => onSettingsChange({ ...settings, tone: tone.value })}
                className={`p-3 rounded-lg border text-left transition-colors ${
                  settings.tone === tone.value
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="font-medium text-gray-900 dark:text-white">
                  {tone.label}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {tone.description}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      <button
        onClick={onSubmit}
        disabled={!settings.targetAudience.trim() || isLoading}
        className={`
          mt-6 w-full py-3 rounded-lg font-medium transition-colors
          ${settings.targetAudience.trim() && !isLoading
            ? 'bg-blue-600 text-white hover:bg-blue-700'
            : 'bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed'
          }
        `}
      >
        {isLoading ? '생성 중...' : '목차 생성하기'}
      </button>
    </div>
  )
}
