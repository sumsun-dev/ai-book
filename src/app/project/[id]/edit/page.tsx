'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import StageHeader from '@/components/project/StageHeader'
import { BookOutline, Chapter, EditSuggestion } from '@/types/book'
import {
  PencilSquareIcon,
  CheckIcon,
  XMarkIcon,
  ArrowPathIcon,
  SparklesIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'

interface EditState {
  outline: BookOutline | null
  chapters: Map<number, Chapter>
  currentChapter: number
  suggestions: EditSuggestion[]
  isAnalyzing: boolean
  editedContent: string
}

export default function EditPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.id as string

  const [state, setState] = useState<EditState>({
    outline: null,
    chapters: new Map(),
    currentChapter: 1,
    suggestions: [],
    isAnalyzing: false,
    editedContent: ''
  })
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadProjectData()
  }, [projectId])

  const loadProjectData = async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}`)
      if (res.ok) {
        const { data: project } = await res.json()

        if (!project.outline) {
          router.push(`/project/${projectId}/outline`)
          return
        }

        const chaptersMap = new Map<number, Chapter>()
        project.chapters?.forEach((ch: Chapter) => {
          chaptersMap.set(ch.number, ch)
        })

        const firstChapter = chaptersMap.get(1)
        setState(prev => ({
          ...prev,
          outline: project.outline,
          chapters: chaptersMap,
          editedContent: firstChapter?.content || ''
        }))
      }
    } catch {
      setError('프로젝트를 불러오는데 실패했습니다.')
    }
  }

  const getCurrentChapter = (): Chapter | null => {
    return state.chapters.get(state.currentChapter) || null
  }

  const handleAnalyze = async () => {
    const chapter = getCurrentChapter()
    if (!chapter || state.isAnalyzing) return

    setState(prev => ({ ...prev, isAnalyzing: true, suggestions: [] }))

    try {
      const res = await fetch(`/api/projects/${projectId}/edit/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chapterNumber: state.currentChapter,
          content: state.editedContent
        })
      })

      const data = await res.json()
      if (data.suggestions) {
        setState(prev => ({
          ...prev,
          suggestions: data.suggestions,
          isAnalyzing: false
        }))
      }
    } catch {
      setError('분석에 실패했습니다. 다시 시도해주세요.')
      setState(prev => ({ ...prev, isAnalyzing: false }))
    }
  }

  const handleAcceptSuggestion = async (suggestion: EditSuggestion) => {
    // 제안 적용
    const newContent = state.editedContent.replace(
      suggestion.originalText,
      suggestion.suggestedText
    )

    setState(prev => ({
      ...prev,
      editedContent: newContent,
      suggestions: prev.suggestions.map(s =>
        s.id === suggestion.id ? { ...s, status: 'accepted' as const } : s
      )
    }))

    // 히스토리 저장
    await fetch(`/api/projects/${projectId}/edit/history`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chapterId: state.currentChapter.toString(),
        type: 'revision',
        agent: 'editor',
        beforeContent: suggestion.originalText,
        afterContent: suggestion.suggestedText,
        feedback: suggestion.reason
      })
    })
  }

  const handleRejectSuggestion = (suggestionId: string) => {
    setState(prev => ({
      ...prev,
      suggestions: prev.suggestions.map(s =>
        s.id === suggestionId ? { ...s, status: 'rejected' as const } : s
      )
    }))
  }

  const handleSaveChapter = async () => {
    await fetch(`/api/projects/${projectId}/chapters`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        number: state.currentChapter,
        title: state.outline?.chapters.find(c => c.number === state.currentChapter)?.title || '',
        content: state.editedContent,
        status: 'editing'
      })
    })

    // 상태 업데이트
    setState(prev => {
      const newChapters = new Map(prev.chapters)
      const currentChapter = newChapters.get(state.currentChapter)
      if (currentChapter) {
        newChapters.set(state.currentChapter, {
          ...currentChapter,
          content: state.editedContent,
          status: 'editing'
        })
      }
      return { ...prev, chapters: newChapters }
    })
  }

  const handleChapterChange = (chapterNumber: number) => {
    const chapter = state.chapters.get(chapterNumber)
    setState(prev => ({
      ...prev,
      currentChapter: chapterNumber,
      editedContent: chapter?.content || '',
      suggestions: []
    }))
  }

  const handleNextStage = async () => {
    await handleSaveChapter()
    await fetch(`/api/projects/${projectId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stage: 'review', status: 'editing' })
    })
    router.push(`/project/${projectId}/review`)
  }

  const handlePreviousStage = () => {
    router.push(`/project/${projectId}/write`)
  }

  const pendingSuggestions = state.suggestions.filter(s => s.status === 'pending')
  const getSeverityColor = (severity: EditSuggestion['severity']) => {
    switch (severity) {
      case 'major': return 'text-red-600 bg-red-50 dark:bg-red-900/20'
      case 'moderate': return 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20'
      case 'minor': return 'text-blue-600 bg-blue-50 dark:bg-blue-900/20'
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <StageHeader
        title="편집"
        description="AI가 문법, 스타일, 내용을 검토하고 개선 제안을 합니다"
        stage="edit"
        onPrevious={handlePreviousStage}
        onNext={handleNextStage}
        nextLabel="최종 검토로"
        previousLabel="집필로"
      />

      {error && (
        <div className="mx-6 mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      <div className="flex-1 flex">
        {/* 챕터 목록 */}
        <aside className="w-56 bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 overflow-auto">
          <div className="p-4">
            <h3 className="font-medium text-gray-900 dark:text-white mb-3">챕터</h3>
            <ul className="space-y-1">
              {state.outline?.chapters.map((ch) => (
                <li key={ch.number}>
                  <button
                    onClick={() => handleChapterChange(ch.number)}
                    className={`
                      w-full text-left px-3 py-2 rounded-lg text-sm
                      ${state.currentChapter === ch.number
                        ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700'
                        : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
                      }
                    `}
                  >
                    {ch.number}. {ch.title}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </aside>

        {/* 에디터 영역 */}
        <main className="flex-1 flex flex-col">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {state.currentChapter}. {state.outline?.chapters.find(c => c.number === state.currentChapter)?.title}
            </h2>
            <div className="flex items-center gap-2">
              <button
                onClick={handleSaveChapter}
                className="px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-800 rounded hover:bg-gray-200"
              >
                저장
              </button>
              <button
                onClick={handleAnalyze}
                disabled={state.isAnalyzing}
                className={`
                  flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors
                  ${state.isAnalyzing
                    ? 'bg-gray-100 dark:bg-gray-800 text-gray-400'
                    : 'bg-purple-600 text-white hover:bg-purple-700'
                  }
                `}
              >
                {state.isAnalyzing ? (
                  <>
                    <ArrowPathIcon className="w-4 h-4 animate-spin" />
                    분석 중...
                  </>
                ) : (
                  <>
                    <SparklesIcon className="w-4 h-4" />
                    AI 분석
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="flex-1 flex">
            {/* 텍스트 에디터 */}
            <div className="flex-1 p-6">
              <textarea
                value={state.editedContent}
                onChange={(e) => setState(prev => ({ ...prev, editedContent: e.target.value }))}
                className="w-full h-full p-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white resize-none focus:outline-none focus:ring-2 focus:ring-purple-500"
                style={{ minHeight: '400px' }}
              />
            </div>

            {/* 제안 패널 */}
            {state.suggestions.length > 0 && (
              <aside className="w-80 border-l border-gray-200 dark:border-gray-800 overflow-auto">
                <div className="p-4">
                  <h3 className="font-medium text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <PencilSquareIcon className="w-5 h-5" />
                    편집 제안 ({pendingSuggestions.length})
                  </h3>
                  <div className="space-y-3">
                    {state.suggestions.map((suggestion) => (
                      <div
                        key={suggestion.id}
                        className={`
                          p-3 rounded-lg border
                          ${suggestion.status === 'accepted'
                            ? 'border-green-200 bg-green-50 dark:bg-green-900/20 opacity-60'
                            : suggestion.status === 'rejected'
                              ? 'border-gray-200 bg-gray-50 dark:bg-gray-800 opacity-60'
                              : 'border-gray-200 dark:border-gray-700'
                          }
                        `}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className={`text-xs px-2 py-0.5 rounded ${getSeverityColor(suggestion.severity)}`}>
                            {suggestion.type}
                          </span>
                          {suggestion.status === 'pending' && (
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleAcceptSuggestion(suggestion)}
                                className="p-1 text-green-600 hover:bg-green-100 rounded"
                              >
                                <CheckIcon className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleRejectSuggestion(suggestion.id)}
                                className="p-1 text-red-600 hover:bg-red-100 rounded"
                              >
                                <XMarkIcon className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 line-through mb-1">
                          {suggestion.originalText.substring(0, 50)}...
                        </p>
                        <p className="text-sm text-gray-900 dark:text-white mb-2">
                          {suggestion.suggestedText.substring(0, 50)}...
                        </p>
                        <p className="text-xs text-gray-500">
                          {suggestion.reason}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </aside>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
