'use client'

import { useState } from 'react'
import type {
  AgentCustomConfig,
  StyleIntensity,
  EditorConfig,
  CriticConfig,
} from '@/types/book'

interface AgentSettingsProps {
  projectId: string
  initialConfig: AgentCustomConfig
  onSave: (config: AgentCustomConfig) => Promise<void>
  onClose: () => void
}

export function AgentSettings({
  initialConfig,
  onSave,
  onClose,
}: AgentSettingsProps) {
  const [config, setConfig] = useState<AgentCustomConfig>(initialConfig)
  const [isSaving, setIsSaving] = useState(false)

  const handleSave = async () => {
    setIsSaving(true)
    await onSave(config)
    setIsSaving(false)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-neutral-900 w-full max-w-lg max-h-[90vh] overflow-auto shadow-2xl rounded-lg">
        {/* Header */}
        <div className="p-6 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
          <h2 className="text-xl font-light text-neutral-900 dark:text-white tracking-tight">
            AI 에이전트 설정
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Writer settings */}
          <section>
            <h3 className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-3">
              Writer (집필)
            </h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-neutral-500 dark:text-neutral-400 mb-1">
                  문체 강도
                </label>
                <select
                  value={config.writer?.styleIntensity ?? 'balanced'}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      writer: {
                        ...config.writer,
                        styleIntensity: e.target.value as StyleIntensity,
                      },
                    })
                  }
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-white rounded focus:outline-none"
                  aria-label="문체 강도"
                >
                  <option value="concise">간결</option>
                  <option value="balanced">균형</option>
                  <option value="detailed">상세</option>
                </select>
              </div>

              <div>
                <label className="block text-xs text-neutral-500 dark:text-neutral-400 mb-1">
                  창의성 ({(config.writer?.creativity ?? 0.8).toFixed(1)})
                </label>
                <input
                  type="range"
                  min="0.5"
                  max="1.0"
                  step="0.1"
                  value={config.writer?.creativity ?? 0.8}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      writer: {
                        ...config.writer,
                        creativity: parseFloat(e.target.value),
                      },
                    })
                  }
                  className="w-full"
                  aria-label="창의성"
                />
              </div>

              <div>
                <label className="block text-xs text-neutral-500 dark:text-neutral-400 mb-1">
                  추가 지시사항
                </label>
                <textarea
                  value={config.writer?.customInstructions ?? ''}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      writer: {
                        ...config.writer,
                        customInstructions: e.target.value,
                      },
                    })
                  }
                  placeholder="예: 항상 한국어 존칭체로 작성"
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-white placeholder-neutral-400 rounded resize-none focus:outline-none"
                  rows={2}
                  aria-label="추가 지시사항"
                />
              </div>
            </div>
          </section>

          {/* Editor settings */}
          <section>
            <h3 className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-3">
              Editor (편집)
            </h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-neutral-500 dark:text-neutral-400 mb-1">
                  엄격도
                </label>
                <select
                  value={config.editor?.strictness ?? 'moderate'}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      editor: {
                        ...config.editor,
                        strictness: e.target.value as EditorConfig['strictness'],
                      },
                    })
                  }
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-white rounded focus:outline-none"
                  aria-label="편집 엄격도"
                >
                  <option value="lenient">관대</option>
                  <option value="moderate">보통</option>
                  <option value="strict">엄격</option>
                </select>
              </div>
            </div>
          </section>

          {/* Critic settings */}
          <section>
            <h3 className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-3">
              Critic (검토)
            </h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-neutral-500 dark:text-neutral-400 mb-1">
                  평가 초점
                </label>
                <select
                  value={config.critic?.evaluationFocus ?? 'overall'}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      critic: {
                        ...config.critic,
                        evaluationFocus: e.target.value as CriticConfig['evaluationFocus'],
                      },
                    })
                  }
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-white rounded focus:outline-none"
                  aria-label="평가 초점"
                >
                  <option value="overall">종합</option>
                  <option value="grammar">문법</option>
                  <option value="style">문체</option>
                  <option value="structure">구조</option>
                </select>
              </div>

              <div>
                <label className="block text-xs text-neutral-500 dark:text-neutral-400 mb-1">
                  통과 기준 ({config.critic?.passThreshold ?? 7}점)
                </label>
                <input
                  type="range"
                  min="5"
                  max="9"
                  step="1"
                  value={config.critic?.passThreshold ?? 7}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      critic: {
                        ...config.critic,
                        passThreshold: parseInt(e.target.value),
                      },
                    })
                  }
                  className="w-full"
                  aria-label="통과 기준"
                />
              </div>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-neutral-200 dark:border-neutral-800 flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors"
          >
            취소
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-6 py-2 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-sm font-medium rounded transition-all hover:bg-neutral-700 dark:hover:bg-neutral-200 disabled:opacity-50"
          >
            {isSaving ? '저장 중...' : '저장'}
          </button>
        </div>
      </div>
    </div>
  )
}
