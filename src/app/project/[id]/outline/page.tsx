'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import StageHeader from '@/components/project/StageHeader'
import { SettingsStep, GeneratingStep, EditStep, ConfirmStep } from '@/components/outline'
import { BookOutline } from '@/types/book'

interface OutlineState {
  step: 'settings' | 'generate' | 'edit' | 'confirm'
  settings: {
    targetAudience: string
    targetLength: number
    tone: string
  }
  outline: BookOutline | null
  isLoading: boolean
}

export default function OutlinePage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.id as string

  const [state, setState] = useState<OutlineState>({
    step: 'settings',
    settings: {
      targetAudience: '',
      targetLength: 200,
      tone: 'casual'
    },
    outline: null,
    isLoading: false
  })
  const [error, setError] = useState<string | null>(null)
  const [viewingStep, setViewingStep] = useState<string | null>(null)

  useEffect(() => {
    loadExistingData()
  }, [projectId])

  const loadExistingData = async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}`)
      if (res.ok) {
        const { data: project } = await res.json()
        if (project.outline) {
          setState(prev => ({
            ...prev,
            step: project.confirmedAt ? 'confirm' : 'edit',
            outline: project.outline,
            settings: {
              targetAudience: project.targetAudience || '',
              targetLength: project.targetLength || 200,
              tone: project.tone || 'casual'
            }
          }))
        } else if (project.targetAudience) {
          setState(prev => ({
            ...prev,
            settings: {
              targetAudience: project.targetAudience,
              targetLength: project.targetLength || 200,
              tone: project.tone || 'casual'
            }
          }))
        }
      }
    } catch {
      // Initial load failure ignored
    }
  }

  const handleSettingsSave = async () => {
    setState(prev => ({ ...prev, step: 'generate', isLoading: true }))
    setError(null)

    try {
      await fetch(`/api/projects/${projectId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetAudience: state.settings.targetAudience,
          targetLength: state.settings.targetLength,
          tone: state.settings.tone
        })
      })

      const res = await fetch(`/api/projects/${projectId}/outline/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(state.settings)
      })

      const data = await res.json()
      if (data.outline) {
        setState(prev => ({
          ...prev,
          step: 'edit',
          outline: data.outline,
          isLoading: false
        }))
      } else {
        setError('Failed to generate outline.')
        setState(prev => ({ ...prev, step: 'settings', isLoading: false }))
      }
    } catch {
      setError('Failed to generate outline. Please try again.')
      setState(prev => ({ ...prev, step: 'settings', isLoading: false }))
    }
  }

  const handleConfirmOutline = async () => {
    if (!state.outline) return

    setState(prev => ({ ...prev, isLoading: true }))
    setError(null)

    try {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          outline: state.outline,
          confirmedAt: new Date().toISOString(),
          stage: 'write',
          status: 'outlining'
        })
      })

      if (res.ok) {
        setState(prev => ({ ...prev, step: 'confirm', isLoading: false }))
      } else {
        setError('Failed to save outline.')
        setState(prev => ({ ...prev, isLoading: false }))
      }
    } catch {
      setError('Failed to save outline. Please try again.')
      setState(prev => ({ ...prev, isLoading: false }))
    }
  }

  const handleOutlineChange = (outline: BookOutline) => {
    setState(prev => ({ ...prev, outline }))
  }

  const handleSettingsChange = (settings: OutlineState['settings']) => {
    setState(prev => ({ ...prev, settings }))
  }

  const handleNextStage = () => {
    router.push(`/project/${projectId}/write`)
  }

  const handlePreviousStage = () => {
    router.push(`/project/${projectId}/research`)
  }

  const handleStepClick = (stepId: string, stepIndex: number) => {
    // generate 단계는 로딩 중이므로 클릭 불가
    if (stepId === 'generate') return
    // 현재 단계는 미리보기 종료
    if (stepIndex === currentStepIndex) {
      setViewingStep(null)
      return
    }
    // 이후 단계는 클릭 불가
    if (stepIndex > currentStepIndex) return
    // 로딩 중에는 단계 변경 불가
    if (state.isLoading) return

    // 이전 단계 미리보기 모드로 전환
    setViewingStep(stepId)
  }

  const handleClosePreview = () => {
    setViewingStep(null)
  }

  const handleRestartFromStep = (stepId: string) => {
    setViewingStep(null)
    if (stepId === 'settings') {
      setState(prev => ({ ...prev, step: 'settings' }))
    } else if (stepId === 'edit') {
      setState(prev => ({ ...prev, step: 'edit' }))
    }
  }

  const steps = [
    { id: 'settings', label: '설정', num: 1 },
    { id: 'generate', label: '생성', num: 2 },
    { id: 'edit', label: '수정', num: 3 },
    { id: 'confirm', label: '확인', num: 4 }
  ]
  const currentStepIndex = steps.findIndex(s => s.id === state.step)

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 transition-colors duration-700">
      <StageHeader
        title="목차"
        description="책 구조와 목차를 디자인하세요"
        stage="outline"
        onPrevious={handlePreviousStage}
        onNext={state.step === 'confirm' ? handleNextStage : undefined}
        nextLabel="집필 시작"
        previousLabel="리서치"
      />

      <main className="max-w-4xl mx-auto px-8 py-12">
        {/* Progress Steps */}
        <div className="mb-16">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => {
              const isClickable = index < currentStepIndex && step.id !== 'generate' && !state.isLoading
              return (
                <div key={step.id} className="flex items-center flex-1">
                  <button
                    onClick={() => handleStepClick(step.id, index)}
                    disabled={!isClickable}
                    className={`flex flex-col items-center ${isClickable ? 'cursor-pointer group' : 'cursor-default'}`}
                  >
                    <div
                      className={`
                        w-10 h-10 flex items-center justify-center text-sm font-medium transition-all duration-500
                        ${index <= currentStepIndex
                          ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900'
                          : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-400 dark:text-neutral-600'
                        }
                        ${isClickable ? 'group-hover:scale-110 group-hover:shadow-lg' : ''}
                      `}
                    >
                      {index < currentStepIndex ? (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        step.num
                      )}
                    </div>
                    <span className={`mt-2 text-xs tracking-wider transition-colors duration-500 ${
                      index <= currentStepIndex
                        ? 'text-neutral-900 dark:text-white'
                        : 'text-neutral-400 dark:text-neutral-600'
                    } ${isClickable ? 'group-hover:underline' : ''}`}>
                      {step.label}
                    </span>
                  </button>
                  {index < steps.length - 1 && (
                    <div className="flex-1 mx-4">
                      <div
                        className={`h-px transition-colors duration-500 ${
                          index < currentStepIndex
                            ? 'bg-neutral-900 dark:bg-white'
                            : 'bg-neutral-200 dark:bg-neutral-800'
                        }`}
                      />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {error && (
          <div className="mb-8 p-5 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* 미리보기 모드 */}
        {viewingStep && (
          <div className="mb-8">
            <div className="p-6 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  <span className="text-sm font-medium text-amber-800 dark:text-amber-200">
                    {viewingStep === 'settings' ? '설정' : '수정'} 단계 미리보기
                  </span>
                </div>
                <button
                  onClick={handleClosePreview}
                  className="text-amber-600 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-200"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* 설정 미리보기 */}
              {viewingStep === 'settings' && (
                <div className="space-y-4">
                  <div className="p-4 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700">
                    <p className="text-xs tracking-widest uppercase text-neutral-500 dark:text-neutral-400 mb-2">
                      타겟 독자
                    </p>
                    <p className="text-neutral-900 dark:text-white">
                      {state.settings.targetAudience || '(설정되지 않음)'}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700">
                      <p className="text-xs tracking-widest uppercase text-neutral-500 dark:text-neutral-400 mb-2">
                        목표 분량
                      </p>
                      <p className="text-neutral-900 dark:text-white">
                        {state.settings.targetLength}페이지
                      </p>
                    </div>
                    <div className="p-4 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700">
                      <p className="text-xs tracking-widest uppercase text-neutral-500 dark:text-neutral-400 mb-2">
                        문체
                      </p>
                      <p className="text-neutral-900 dark:text-white">
                        {state.settings.tone === 'formal' ? '격식체' :
                         state.settings.tone === 'casual' ? '친근체' :
                         state.settings.tone === 'academic' ? '학술체' :
                         state.settings.tone === 'narrative' ? '서술체' :
                         state.settings.tone === 'motivational' ? '동기부여체' : state.settings.tone}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* 수정(목차) 미리보기 */}
              {viewingStep === 'edit' && state.outline && (
                <div className="space-y-4">
                  <div className="p-4 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700">
                    <p className="text-xs tracking-widest uppercase text-neutral-500 dark:text-neutral-400 mb-2">
                      책 개요
                    </p>
                    <p className="text-neutral-900 dark:text-white">
                      {state.outline.synopsis}
                    </p>
                  </div>
                  <div className="p-4 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700">
                    <p className="text-xs tracking-widest uppercase text-neutral-500 dark:text-neutral-400 mb-3">
                      챕터 목록 ({state.outline.chapters.length}개)
                    </p>
                    <ol className="space-y-2">
                      {state.outline.chapters.map((chapter) => (
                        <li key={chapter.number} className="flex items-start gap-3 text-sm">
                          <span className="w-6 h-6 flex items-center justify-center bg-neutral-100 dark:bg-neutral-800 text-neutral-500 text-xs">
                            {chapter.number}
                          </span>
                          <span className="text-neutral-900 dark:text-white">{chapter.title}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                </div>
              )}

              <div className="flex gap-3 mt-4">
                <button
                  onClick={handleClosePreview}
                  className="flex-1 py-3 text-sm font-medium border border-neutral-300 dark:border-neutral-600 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                >
                  현재 단계로 돌아가기
                </button>
                <button
                  onClick={() => handleRestartFromStep(viewingStep)}
                  className="flex-1 py-3 text-sm font-medium bg-amber-600 text-white hover:bg-amber-700 transition-colors"
                >
                  이 단계부터 다시 시작
                </button>
              </div>
            </div>
          </div>
        )}

        {state.step === 'settings' && !viewingStep && (
          <SettingsStep
            settings={state.settings}
            onSettingsChange={handleSettingsChange}
            onSubmit={handleSettingsSave}
            isLoading={state.isLoading}
          />
        )}

        {state.step === 'generate' && !viewingStep && <GeneratingStep />}

        {state.step === 'edit' && state.outline && !viewingStep && (
          <EditStep
            outline={state.outline}
            onOutlineChange={handleOutlineChange}
            onConfirm={handleConfirmOutline}
            isLoading={state.isLoading}
          />
        )}

        {state.step === 'confirm' && state.outline && !viewingStep && (
          <ConfirmStep outline={state.outline} />
        )}
      </main>
    </div>
  )
}
