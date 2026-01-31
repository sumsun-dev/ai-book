'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import StageHeader from '@/components/project/StageHeader'
import { ChapterList, ChapterEditor } from '@/components/write'
import { BookOutline, ChapterOutline, Chapter } from '@/types/book'
import { CheckIcon, ArrowPathIcon } from '@heroicons/react/24/outline'

interface WriteState {
  outline: BookOutline | null
  chapters: Map<number, Chapter>
  currentChapter: number
  isWriting: boolean
  streamingContent: string
}

export default function WritePage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.id as string

  const [state, setState] = useState<WriteState>({
    outline: null,
    chapters: new Map(),
    currentChapter: 1,
    isWriting: false,
    streamingContent: ''
  })
  const [isSaving, setIsSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadProjectData()
  }, [projectId])

  useEffect(() => {
    const interval = setInterval(() => {
      const currentContent = state.chapters.get(state.currentChapter)
      if (currentContent && currentContent.content) {
        saveChapter(state.currentChapter, currentContent)
      }
    }, 30000)
    return () => clearInterval(interval)
  }, [state.chapters, state.currentChapter])

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
        setState(prev => ({
          ...prev,
          outline: project.outline,
          chapters: chaptersMap
        }))
      }
    } catch {
      setError('프로젝트를 불러오는데 실패했습니다.')
    }
  }

  const getCurrentChapterOutline = (): ChapterOutline | null => {
    if (!state.outline) return null
    return state.outline.chapters.find(ch => ch.number === state.currentChapter) || null
  }

  const getCurrentChapter = (): Chapter | null => {
    return state.chapters.get(state.currentChapter) || null
  }

  const saveChapter = async (number: number, chapter: Chapter) => {
    setIsSaving(true)
    try {
      await fetch(`/api/projects/${projectId}/chapters`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          number,
          title: chapter.title,
          content: chapter.content,
          status: chapter.status || 'writing'
        })
      })
      setLastSaved(new Date())
    } catch {
      setError('챕터 저장에 실패했습니다.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleContentChange = (content: string) => {
    const chapterOutline = getCurrentChapterOutline()
    if (!chapterOutline) return

    const updatedChapter: Chapter = {
      number: state.currentChapter,
      title: chapterOutline.title,
      content,
      status: 'writing',
      revisions: []
    }

    setState(prev => {
      const newChapters = new Map(prev.chapters)
      newChapters.set(state.currentChapter, updatedChapter)
      return { ...prev, chapters: newChapters }
    })
  }

  const handleAIWrite = async () => {
    const chapterOutline = getCurrentChapterOutline()
    if (!chapterOutline || state.isWriting) return

    setState(prev => ({ ...prev, isWriting: true, streamingContent: '' }))
    setError(null)

    try {
      const previousChapters: { number: number; title: string; summary: string }[] = []
      state.outline?.chapters.forEach(ch => {
        if (ch.number < state.currentChapter) {
          const existingChapter = state.chapters.get(ch.number)
          previousChapters.push({
            number: ch.number,
            title: ch.title,
            summary: existingChapter?.content?.substring(0, 500) || ch.summary
          })
        }
      })

      const response = await fetch(`/api/projects/${projectId}/write`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chapterNumber: state.currentChapter,
          chapterOutline,
          previousChapters
        })
      })

      if (!response.body) {
        throw new Error('No response body')
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let fullContent = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value, { stream: true })
        fullContent += chunk
        setState(prev => ({ ...prev, streamingContent: fullContent }))
      }

      const updatedChapter: Chapter = {
        number: state.currentChapter,
        title: chapterOutline.title,
        content: fullContent,
        status: 'writing',
        revisions: []
      }

      setState(prev => {
        const newChapters = new Map(prev.chapters)
        newChapters.set(state.currentChapter, updatedChapter)
        return {
          ...prev,
          chapters: newChapters,
          isWriting: false,
          streamingContent: ''
        }
      })

      await saveChapter(state.currentChapter, updatedChapter)
    } catch {
      setError('AI 집필에 실패했습니다. 다시 시도해주세요.')
      setState(prev => ({ ...prev, isWriting: false }))
    }
  }

  const handleChapterSelect = (number: number) => {
    setState(prev => ({ ...prev, currentChapter: number }))
  }

  const handlePreviousChapter = () => {
    if (state.currentChapter > 1) {
      setState(prev => ({ ...prev, currentChapter: prev.currentChapter - 1 }))
    }
  }

  const handleNextChapter = () => {
    if (state.outline && state.currentChapter < state.outline.chapters.length) {
      setState(prev => ({ ...prev, currentChapter: prev.currentChapter + 1 }))
    }
  }

  const handleManualSave = async () => {
    const chapter = getCurrentChapter()
    if (chapter) {
      await saveChapter(state.currentChapter, chapter)
    }
  }

  const handleNextStage = async () => {
    try {
      await fetch(`/api/projects/${projectId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stage: 'edit', status: 'writing' })
      })
      router.push(`/project/${projectId}/edit`)
    } catch {
      setError('다음 단계로 이동하는데 실패했습니다.')
    }
  }

  const handlePreviousStage = () => {
    router.push(`/project/${projectId}/outline`)
  }

  const allChaptersDone = (): boolean => {
    if (!state.outline) return false
    return state.outline.chapters.every(ch => {
      const chapter = state.chapters.get(ch.number)
      return chapter && chapter.content && chapter.content.length > 2000
    })
  }

  const currentChapter = getCurrentChapter()
  const displayContent = state.isWriting ? state.streamingContent : (currentChapter?.content || '')

  return (
    <div className="min-h-screen flex flex-col">
      <StageHeader
        title="집필"
        description="각 챕터를 작성합니다"
        stage="write"
        onPrevious={handlePreviousStage}
        onNext={allChaptersDone() ? handleNextStage : undefined}
        nextLabel="편집으로"
        previousLabel="목차로"
      >
        <div className="flex items-center gap-2 text-sm text-gray-500">
          {isSaving ? (
            <>
              <ArrowPathIcon className="w-4 h-4 animate-spin" />
              저장 중...
            </>
          ) : lastSaved ? (
            <>
              <CheckIcon className="w-4 h-4 text-green-500" />
              {lastSaved.toLocaleTimeString()} 저장됨
            </>
          ) : null}
        </div>
        <button
          onClick={handleManualSave}
          className="px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-800 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
        >
          저장
        </button>
      </StageHeader>

      {error && (
        <div className="mx-6 mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      <div className="flex-1 flex">
        {state.outline && (
          <ChapterList
            chapters={state.outline.chapters}
            chapterContents={state.chapters}
            currentChapter={state.currentChapter}
            onChapterSelect={handleChapterSelect}
          />
        )}

        <ChapterEditor
          chapterOutline={getCurrentChapterOutline()}
          content={displayContent}
          isWriting={state.isWriting}
          currentChapter={state.currentChapter}
          totalChapters={state.outline?.chapters.length || 0}
          onContentChange={handleContentChange}
          onAIWrite={handleAIWrite}
          onPreviousChapter={handlePreviousChapter}
          onNextChapter={handleNextChapter}
        />
      </div>
    </div>
  )
}
