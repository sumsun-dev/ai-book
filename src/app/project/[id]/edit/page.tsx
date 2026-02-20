'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import StageHeader from '@/components/project/StageHeader'
import RichTextEditor from '@/components/RichTextEditor'
import { BookOutline, Chapter, EditSuggestion } from '@/types/book'

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
  const t = useTranslations('edit')

  const [state, setState] = useState<EditState>({
    outline: null,
    chapters: new Map(),
    currentChapter: 1,
    suggestions: [],
    isAnalyzing: false,
    editedContent: ''
  })
  const [error, setError] = useState<string | null>(null)

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
      setError('Failed to load project.')
    }
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { loadProjectData() }, [projectId])

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
      setError('Analysis failed. Please try again.')
      setState(prev => ({ ...prev, isAnalyzing: false }))
    }
  }

  const handleAcceptSuggestion = async (suggestion: EditSuggestion) => {
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

  const getSeverityStyles = (severity: EditSuggestion['severity']) => {
    switch (severity) {
      case 'major': return 'bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 border-red-200 dark:border-red-900/50'
      case 'moderate': return 'bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-900/50'
      case 'minor': return 'bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-900/50'
    }
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex flex-col transition-colors duration-700">
      <StageHeader
        title={t('title')}
        description={t('description')}
        stage="edit"
        onPrevious={handlePreviousStage}
        onNext={handleNextStage}
        nextLabel={t('nextLabel')}
        previousLabel={t('previousLabel')}
      />

      {error && (
        <div className="mx-8 mt-4 p-5 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 text-sm">
          {error}
        </div>
      )}

      <div className="flex-1 flex overflow-hidden">
        {/* Chapter Sidebar */}
        <aside className="w-64 bg-white dark:bg-neutral-900 border-r border-neutral-200 dark:border-neutral-800 overflow-auto">
          <div className="p-6 border-b border-neutral-200 dark:border-neutral-800">
            <h3 className="text-xs tracking-widest uppercase text-neutral-500 dark:text-neutral-400">
              {t('chapter')}
            </h3>
          </div>
          <div className="py-2">
            {state.outline?.chapters.map((ch) => {
              const chapter = state.chapters.get(ch.number)
              const hasContent = chapter?.content && chapter.content.length > 0

              return (
                <button
                  key={ch.number}
                  onClick={() => handleChapterChange(ch.number)}
                  className={`
                    w-full text-left px-6 py-4 transition-all duration-300 border-l-2
                    ${state.currentChapter === ch.number
                      ? 'border-neutral-900 dark:border-white bg-neutral-50 dark:bg-neutral-800'
                      : 'border-transparent hover:bg-neutral-50 dark:hover:bg-neutral-800/50'
                    }
                  `}
                >
                  <div className="flex items-center gap-3">
                    <span className={`
                      w-6 h-6 flex items-center justify-center text-xs font-medium
                      ${hasContent
                        ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900'
                        : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-500 dark:text-neutral-400'
                      }
                    `}>
                      {ch.number}
                    </span>
                    <span className={`
                      text-sm truncate
                      ${state.currentChapter === ch.number
                        ? 'text-neutral-900 dark:text-white'
                        : 'text-neutral-600 dark:text-neutral-400'
                      }
                    `}>
                      {ch.title}
                    </span>
                  </div>
                </button>
              )
            })}
          </div>
        </aside>

        {/* Editor Area */}
        <main className="flex-1 flex flex-col bg-neutral-50 dark:bg-neutral-950">
          {/* Toolbar */}
          <div className="px-8 py-4 bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-light text-neutral-900 dark:text-white">
                {state.currentChapter}. {state.outline?.chapters.find(c => c.number === state.currentChapter)?.title}
              </h2>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                {t('charCount', { count: state.editedContent.replace(/<[^>]*>/g, '').length.toLocaleString() })}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleSaveChapter}
                className="px-4 py-2 text-sm text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors"
              >
                {t('save')}
              </button>
              <button
                onClick={handleAnalyze}
                disabled={state.isAnalyzing}
                className={`
                  flex items-center gap-2 px-5 py-2.5 text-sm font-medium tracking-wide transition-all duration-500
                  ${state.isAnalyzing
                    ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-400 dark:text-neutral-600'
                    : 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 hover:bg-neutral-700 dark:hover:bg-neutral-200'
                  }
                `}
              >
                {state.isAnalyzing ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    {t('analyzing')}
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                    {t('analyze')}
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="flex-1 flex overflow-hidden">
            {/* Text Editor */}
            <div className="flex-1 p-8">
              <div className="h-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 overflow-auto">
                <RichTextEditor
                  value={state.editedContent}
                  onChange={(html) => setState(prev => ({ ...prev, editedContent: html }))}
                  placeholder="편집할 내용이 없습니다"
                  className="min-h-[500px]"
                />
              </div>
            </div>

            {/* Suggestions Panel */}
            {state.suggestions.length > 0 && (
              <aside className="w-96 bg-white dark:bg-neutral-900 border-l border-neutral-200 dark:border-neutral-800 overflow-auto">
                <div className="p-6 border-b border-neutral-200 dark:border-neutral-800">
                  <h3 className="text-xs tracking-widest uppercase text-neutral-500 dark:text-neutral-400">
                    {t('suggestions', { count: pendingSuggestions.length })}
                  </h3>
                </div>
                <div className="p-4 space-y-4">
                  {state.suggestions.map((suggestion) => (
                    <div
                      key={suggestion.id}
                      className={`
                        p-5 border transition-all duration-300
                        ${suggestion.status !== 'pending'
                          ? 'opacity-50'
                          : ''
                        }
                        ${getSeverityStyles(suggestion.severity)}
                      `}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-medium uppercase tracking-wider">
                          {suggestion.type}
                        </span>
                        {suggestion.status === 'pending' && (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleAcceptSuggestion(suggestion)}
                              className="w-8 h-8 flex items-center justify-center text-green-600 hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleRejectSuggestion(suggestion.id)}
                              className="w-8 h-8 flex items-center justify-center text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400 line-through mb-2">
                        {suggestion.originalText.substring(0, 60)}...
                      </p>
                      <p className="text-sm text-neutral-900 dark:text-white mb-3">
                        {suggestion.suggestedText.substring(0, 60)}...
                      </p>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400">
                        {suggestion.reason}
                      </p>
                    </div>
                  ))}
                </div>
              </aside>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
