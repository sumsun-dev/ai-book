'use client'

import { useState } from 'react'
import type { BookProject } from '@/types/book'
import { coverTemplates, getRecommendedTemplate } from '@/lib/cover-templates'
import { TemplatePreview } from './TemplatePreview'
import { LoadingSpinner } from './LoadingSpinner'

interface CoverDesignerProps {
  project: BookProject
  onSave: (imageUrl: string, template?: string, prompt?: string) => void
  onCancel: () => void
}

export function CoverDesigner({ project, onSave, onCancel }: CoverDesignerProps) {
  const recommendedTemplate = getRecommendedTemplate(project.type)
  const [selectedTemplateId, setSelectedTemplateId] = useState(recommendedTemplate.id)
  const [customPrompt, setCustomPrompt] = useState('')
  const [isGeneratingAI, setIsGeneratingAI] = useState(false)
  const [aiImageUrl, setAiImageUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [mode, setMode] = useState<'template' | 'ai'>('template')

  const handleSaveTemplate = () => {
    const selectedTemplate = coverTemplates.find((t) => t.id === selectedTemplateId)
    if (selectedTemplate) {
      // For template, we save a reference to regenerate it
      onSave(`template:${selectedTemplateId}`, selectedTemplateId)
    }
  }

  const handleGenerateAI = async () => {
    setIsGeneratingAI(true)
    setError(null)

    try {
      const response = await fetch('/api/cover/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: project.id,
          title: project.title,
          type: project.type,
          description: project.description,
          customPrompt: customPrompt || undefined,
        }),
      })

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || 'AI 표지 생성에 실패했습니다.')
      }

      setAiImageUrl(data.imageUrl)
    } catch (err) {
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.')
    } finally {
      setIsGeneratingAI(false)
    }
  }

  const handleSaveAI = () => {
    if (aiImageUrl) {
      onSave(aiImageUrl, undefined, customPrompt)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
      <div className="bg-white dark:bg-gray-900 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto m-4">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-neutral-900 dark:text-white">표지 디자인</h2>
          <p className="text-gray-500 dark:text-gray-400 mt-1">{project.title}</p>
        </div>

        {/* Mode tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setMode('template')}
            className={`flex-1 py-3 text-center transition-colors ${
              mode === 'template'
                ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white border-b-2 border-blue-500'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            템플릿 선택
          </button>
          <button
            onClick={() => setMode('ai')}
            className={`flex-1 py-3 text-center transition-colors ${
              mode === 'ai'
                ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white border-b-2 border-blue-500'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            AI 생성
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {mode === 'template' && (
            <div>
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                책 유형에 맞는 템플릿이 추천되었습니다. 원하는 템플릿을 선택하세요.
              </p>

              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4">
                {coverTemplates.map((template) => (
                  <TemplatePreview
                    key={template.id}
                    template={template}
                    title={project.title}
                    selected={selectedTemplateId === template.id}
                    onClick={() => setSelectedTemplateId(template.id)}
                  />
                ))}
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={onCancel}
                  className="px-4 py-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                  취소
                </button>
                <button
                  onClick={handleSaveTemplate}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  적용하기
                </button>
              </div>
            </div>
          )}

          {mode === 'ai' && (
            <div>
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                AI가 책 내용에 맞는 표지 이미지를 생성합니다. DALL-E API 키가 필요합니다.
              </p>

              <div className="mb-4">
                <label className="block text-sm text-gray-700 dark:text-gray-300 mb-2">
                  커스텀 프롬프트 (선택사항)
                </label>
                <textarea
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-neutral-900 dark:text-white focus:border-blue-500 focus:outline-none"
                  placeholder="원하는 스타일이나 요소를 설명하세요..."
                  rows={3}
                />
              </div>

              {error && (
                <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/50 border border-red-300 dark:border-red-700 rounded-lg text-red-700 dark:text-red-200">
                  {error}
                </div>
              )}

              {aiImageUrl && (
                <div className="mb-4 flex justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={aiImageUrl}
                    alt="AI Generated Cover"
                    className="w-64 h-96 object-cover rounded-lg shadow-xl"
                  />
                </div>
              )}

              <div className="flex justify-end gap-3">
                <button
                  onClick={onCancel}
                  className="px-4 py-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                  취소
                </button>
                {aiImageUrl ? (
                  <>
                    <button
                      onClick={handleGenerateAI}
                      disabled={isGeneratingAI}
                      className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                    >
                      다시 생성
                    </button>
                    <button
                      onClick={handleSaveAI}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      적용하기
                    </button>
                  </>
                ) : (
                  <button
                    onClick={handleGenerateAI}
                    disabled={isGeneratingAI}
                    className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
                  >
                    {isGeneratingAI ? (
                      <>
                        <LoadingSpinner size="sm" />
                        생성 중...
                      </>
                    ) : (
                      <>
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M13 10V3L4 14h7v7l9-11h-7z"
                          />
                        </svg>
                        AI로 생성하기
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
