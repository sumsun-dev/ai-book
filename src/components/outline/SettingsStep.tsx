'use client'

import { PlotStructureType, BookType } from '@/types/book'
import PlotStructureSelector from './PlotStructureSelector'

interface Settings {
  targetAudience: string
  targetLength: number
  tone: string
  customTone?: string
  plotStructure?: PlotStructureType
}

interface SettingsStepProps {
  settings: Settings
  onSettingsChange: (settings: Settings) => void
  onSubmit: () => void
  isLoading: boolean
  bookType?: BookType
}

const TONE_OPTIONS = [
  {
    value: 'formal',
    label: '격식체',
    description: '정중하고 공식적인 문체',
    example: '"독자 여러분께서는 이 원칙을 반드시 숙지하시기 바랍니다. 본 장에서 다루는 내용은 향후 실무에서 중요한 기반이 될 것입니다."'
  },
  {
    value: 'casual',
    label: '친근체',
    description: '편안하고 대화하듯 하는 문체',
    example: '"자, 이제 본격적으로 시작해볼까요? 걱정 마세요, 생각보다 어렵지 않아요. 하나씩 천천히 알아가다 보면 어느새 전문가가 되어 있을 거예요."'
  },
  {
    value: 'academic',
    label: '학술체',
    description: '논리적이고 객관적인 문체',
    example: '"선행 연구에 따르면 해당 현상은 세 가지 요인에 의해 발생한다. 첫째, 구조적 요인으로서... 둘째, 환경적 요인이 작용하며..."'
  },
  {
    value: 'narrative',
    label: '서술체',
    description: '이야기를 들려주는 듯한 문체',
    example: '"그날 아침, 나는 평소와 다름없이 커피를 내리고 있었다. 김이 모락모락 피어오르는 컵을 바라보며 문득 깨달았다. 변화는 이렇게 조용히 찾아오는 것이었다."'
  },
  {
    value: 'motivational',
    label: '동기부여체',
    description: '독자를 격려하고 행동하게 만드는 문체',
    example: '"당신은 할 수 있습니다! 지금 이 순간에도 수많은 사람들이 같은 고민을 안고 첫 발을 내딛었습니다. 그리고 그들은 해냈습니다. 이제 당신 차례입니다."'
  },
  {
    value: 'poetic',
    label: '문학체',
    description: '아름답고 시적인 표현의 문체',
    example: '"삶이란 강물과 같아서, 때로는 잔잔히 흐르고 때로는 격류를 만난다. 우리는 그 물결 위에서 각자의 방식으로 노를 젓는다. 중요한 것은 방향이다."'
  },
  {
    value: 'humorous',
    label: '유머체',
    description: '재치있고 유쾌한 문체',
    example: '"솔직히 말해서, 저도 처음엔 완전 멘붕이었어요. 뭐가 뭔지 하나도 모르겠고, 인터넷 검색하면 외계어만 나오고. 근데 그게 정상입니다. 안심하세요, 저만 바보가 아니었어요."'
  },
  {
    value: 'concise',
    label: '간결체',
    description: '핵심만 담백하게 전달하는 문체',
    example: '"핵심은 세 가지다. 첫째, 시작하라. 둘째, 지속하라. 셋째, 개선하라. 나머지는 부수적이다. 지금 당장 첫 번째부터 실행하라."'
  },
  {
    value: 'conversational',
    label: '대화체',
    description: '독자와 대화하듯 질문하고 답하는 문체',
    example: '"혹시 이런 경험 있으신가요? 분명 열심히 했는데 결과가 안 나올 때. 왜 그럴까요? 제가 알려드릴게요. 사실 방향이 문제였던 거예요."'
  },
  {
    value: 'professional',
    label: '전문가체',
    description: '업계 전문가가 조언하는 듯한 문체',
    example: '"실무에서 가장 많이 하는 실수가 바로 이겁니다. 15년간 현장에서 수백 건의 사례를 보면서 패턴을 발견했어요. 성공하는 케이스는 예외 없이 이 세 가지를 지킵니다."'
  },
  {
    value: 'warm',
    label: '따뜻한체',
    description: '공감하고 위로하는 따스한 문체',
    example: '"힘드셨죠. 그 마음 충분히 이해해요. 누구나 그런 시간을 겪어요. 괜찮아요, 지금 이 자리에 있는 것만으로도 당신은 충분히 용감한 거예요."'
  },
  {
    value: 'custom',
    label: '직접 입력',
    description: '원하는 문체 스타일을 직접 설명해주세요',
    example: ''
  }
]

const LENGTH_PRESETS = [
  { value: 80, label: '소책자', description: '50-100p' },
  { value: 200, label: '일반', description: '150-250p' },
  { value: 350, label: '전문서', description: '300-400p' },
  { value: 500, label: '대작', description: '450p+' }
]

export default function SettingsStep({ settings, onSettingsChange, onSubmit, isLoading, bookType }: SettingsStepProps) {
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
          책의 톤앤매너를 결정합니다. 예시 문구를 참고해 원하는 스타일을 선택하세요.
        </p>
        <div className="grid grid-cols-1 gap-3">
          {TONE_OPTIONS.map((tone) => {
            const isSelected = settings.tone === tone.value
            const isCustom = tone.value === 'custom'

            return (
              <div key={tone.value}>
                <button
                  onClick={() => onSettingsChange({
                    ...settings,
                    tone: tone.value,
                    customTone: isCustom ? settings.customTone : undefined
                  })}
                  className={`
                    w-full p-5 border text-left transition-all duration-300
                    ${isSelected
                      ? 'border-neutral-900 dark:border-white'
                      : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-400 dark:hover:border-neutral-600'
                    }
                  `}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-neutral-900 dark:text-white">
                        {tone.label}
                      </div>
                      <div className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                        {tone.description}
                      </div>
                    </div>
                    {isSelected && (
                      <div className="w-6 h-6 bg-neutral-900 dark:bg-white flex items-center justify-center flex-shrink-0 ml-4">
                        <svg className="w-4 h-4 text-white dark:text-neutral-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}
                  </div>
                  {tone.example && (
                    <div className={`
                      mt-3 pt-3 border-t text-sm italic leading-relaxed
                      ${isSelected
                        ? 'border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300'
                        : 'border-neutral-100 dark:border-neutral-800 text-neutral-500 dark:text-neutral-500'
                      }
                    `}>
                      {tone.example}
                    </div>
                  )}
                </button>

                {/* 커스텀 문체 입력 필드 */}
                {isCustom && isSelected && (
                  <div className="mt-3 p-4 border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50">
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                      원하는 문체 스타일을 자세히 설명해주세요
                    </label>
                    <textarea
                      value={settings.customTone || ''}
                      onChange={(e) => onSettingsChange({ ...settings, customTone: e.target.value })}
                      placeholder="예: 30대 여성 작가가 쓴 것처럼 감성적이면서도 현실적인 조언을 담아주세요. 너무 딱딱하지 않고 친구에게 털어놓듯 편안하게, 하지만 핵심은 날카롭게 짚어주는 스타일로..."
                      className="w-full h-28 p-4 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-600 focus:outline-none focus:border-neutral-900 dark:focus:border-white transition-colors resize-none text-sm"
                    />
                    <p className="mt-2 text-xs text-neutral-500 dark:text-neutral-500">
                      구체적으로 설명할수록 AI가 원하는 스타일로 정확하게 작성합니다. 참고할 작가, 책, 톤, 독자와의 관계 등을 포함하면 좋습니다.
                    </p>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* 플롯 구조 선택 (fiction/children/essay) */}
      {bookType && (
        <PlotStructureSelector
          bookType={bookType}
          value={settings.plotStructure || 'none'}
          onChange={(plotStructure) => onSettingsChange({ ...settings, plotStructure })}
        />
      )}

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
