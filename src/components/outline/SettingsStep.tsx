'use client'

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

const LENGTH_PRESETS = [
  { value: 80, label: '소책자', description: '50-100p' },
  { value: 200, label: '일반', description: '150-250p' },
  { value: 350, label: '전문서', description: '300-400p' },
  { value: 500, label: '대작', description: '450p+' }
]

export default function SettingsStep({ settings, onSettingsChange, onSubmit, isLoading }: SettingsStepProps) {
  return (
    <div className="space-y-12">
      {/* 타겟 독자 */}
      <div>
        <h2 className="text-2xl font-light text-neutral-900 dark:text-white mb-2 tracking-tight">
          누구를 위한 책인가요?
        </h2>
        <p className="text-neutral-500 dark:text-neutral-400 text-sm mb-6">
          독자를 명확히 정의할수록 더 효과적인 목차를 설계할 수 있습니다
        </p>
        <textarea
          value={settings.targetAudience}
          onChange={(e) => onSettingsChange({ ...settings, targetAudience: e.target.value })}
          placeholder="예: 스타트업 창업을 준비하는 20-30대 직장인, 특히 IT 업계 종사자로 아이디어는 있지만 실행 방법을 모르는 분들..."
          className="w-full h-32 p-6 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-600 focus:outline-none focus:border-neutral-900 dark:focus:border-white transition-colors resize-none"
        />
      </div>

      {/* 분량 */}
      <div>
        <h2 className="text-2xl font-light text-neutral-900 dark:text-white mb-2 tracking-tight">
          목표 분량
        </h2>
        <p className="text-neutral-500 dark:text-neutral-400 text-sm mb-6">
          책의 깊이와 범위를 결정합니다
        </p>
        <div className="grid grid-cols-4 gap-4 mb-6">
          {LENGTH_PRESETS.map((preset) => (
            <button
              key={preset.value}
              onClick={() => onSettingsChange({ ...settings, targetLength: preset.value })}
              className={`
                p-4 border transition-all duration-300 text-center
                ${Math.abs(settings.targetLength - preset.value) < 50
                  ? 'border-neutral-900 dark:border-white bg-neutral-900 dark:bg-white text-white dark:text-neutral-900'
                  : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-400 dark:hover:border-neutral-600'
                }
              `}
            >
              <div className="text-sm font-medium">{preset.label}</div>
              <div className={`text-xs mt-1 ${
                Math.abs(settings.targetLength - preset.value) < 50
                  ? 'text-neutral-300 dark:text-neutral-600'
                  : 'text-neutral-400 dark:text-neutral-500'
              }`}>
                {preset.description}
              </div>
            </button>
          ))}
        </div>
        <div className="flex items-center gap-4">
          <input
            type="range"
            min={50}
            max={600}
            step={10}
            value={settings.targetLength}
            onChange={(e) => onSettingsChange({ ...settings, targetLength: Number(e.target.value) })}
            className="flex-1 accent-neutral-900 dark:accent-white"
          />
          <span className="text-lg font-light text-neutral-900 dark:text-white w-20 text-right">
            {settings.targetLength}p
          </span>
        </div>
      </div>

      {/* 문체 */}
      <div>
        <h2 className="text-2xl font-light text-neutral-900 dark:text-white mb-2 tracking-tight">
          어떤 느낌으로 쓸까요?
        </h2>
        <p className="text-neutral-500 dark:text-neutral-400 text-sm mb-6">
          책의 톤앤매너를 결정합니다
        </p>
        <div className="grid grid-cols-1 gap-3">
          {TONE_OPTIONS.map((tone) => (
            <button
              key={tone.value}
              onClick={() => onSettingsChange({ ...settings, tone: tone.value })}
              className={`
                p-5 border text-left transition-all duration-300 flex items-center justify-between
                ${settings.tone === tone.value
                  ? 'border-neutral-900 dark:border-white'
                  : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-400 dark:hover:border-neutral-600'
                }
              `}
            >
              <div>
                <div className="font-medium text-neutral-900 dark:text-white">
                  {tone.label}
                </div>
                <div className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                  {tone.description}
                </div>
              </div>
              {settings.tone === tone.value && (
                <div className="w-6 h-6 bg-neutral-900 dark:bg-white flex items-center justify-center">
                  <svg className="w-4 h-4 text-white dark:text-neutral-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* 제출 버튼 */}
      <button
        onClick={onSubmit}
        disabled={!settings.targetAudience.trim() || isLoading}
        className={`
          w-full py-5 text-sm font-medium tracking-widest uppercase transition-all duration-500 flex items-center justify-center gap-3
          ${settings.targetAudience.trim() && !isLoading
            ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 hover:bg-neutral-700 dark:hover:bg-neutral-200'
            : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-400 dark:text-neutral-600 cursor-not-allowed'
          }
        `}
      >
        {isLoading ? (
          <>
            <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            목차 생성 중...
          </>
        ) : (
          '목차 생성하기'
        )}
      </button>
    </div>
  )
}
