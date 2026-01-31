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
      // 초기 로드 실패는 무시
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
        setError('목차 생성에 실패했습니다.')
        setState(prev => ({ ...prev, step: 'settings', isLoading: false }))
      }
    } catch {
      setError('목차 생성에 실패했습니다. 다시 시도해주세요.')
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
        setError('목차 저장에 실패했습니다.')
        setState(prev => ({ ...prev, isLoading: false }))
      }
    } catch {
      setError('목차 저장에 실패했습니다. 다시 시도해주세요.')
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

  return (
    <div className="min-h-screen">
      <StageHeader
        title="목차 설계"
        description="책의 구조를 설계하고 목차를 확정합니다"
        stage="outline"
        onPrevious={handlePreviousStage}
        onNext={state.step === 'confirm' ? handleNextStage : undefined}
        nextLabel="집필 시작"
        previousLabel="리서치로"
      />

      <div className="max-w-4xl mx-auto px-6 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-600 dark:text-red-400">
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
      </div>
    </div>
  )
}
