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
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center flex-1">
                <div className="flex flex-col items-center">
                  <div
                    className={`
                      w-10 h-10 flex items-center justify-center text-sm font-medium transition-all duration-500
                      ${index <= currentStepIndex
                        ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900'
                        : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-400 dark:text-neutral-600'
                      }
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
                  }`}>
                    {step.label}
                  </span>
                </div>
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
            ))}
          </div>
        </div>

        {error && (
          <div className="mb-8 p-5 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 text-sm">
            {error}
          </div>
        )}

        {state.step === 'settings' && (
          <SettingsStep
            settings={state.settings}
            onSettingsChange={handleSettingsChange}
            onSubmit={handleSettingsSave}
            isLoading={state.isLoading}
          />
        )}

        {state.step === 'generate' && <GeneratingStep />}

        {state.step === 'edit' && state.outline && (
          <EditStep
            outline={state.outline}
            onOutlineChange={handleOutlineChange}
            onConfirm={handleConfirmOutline}
            isLoading={state.isLoading}
          />
        )}

        {state.step === 'confirm' && state.outline && (
          <ConfirmStep outline={state.outline} />
        )}
      </main>
    </div>
  )
}
