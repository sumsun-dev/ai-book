'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import StageHeader from '@/components/project/StageHeader'
import { ChapterList, ChapterEditor } from '@/components/write'
import { PageEditor } from '@/components/page-editor'
import { FileUploader, ChapterSplitter } from '@/components/upload'
import { BookOutline, ChapterOutline, Chapter, ParsedFile, SplitChapter, PageGenerateMode } from '@/types/book'

interface WriteState {
  outline: BookOutline | null
  chapters: Map<number, Chapter>
  currentChapter: number
  isWriting: boolean
  streamingContent: string
}

type ImportStep = 'upload' | 'split'
type EditorMode = 'chapter' | 'page'

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
  const [showImportModal, setShowImportModal] = useState(false)
  const [importStep, setImportStep] = useState<ImportStep>('upload')
  const [parsedFile, setParsedFile] = useState<ParsedFile | null>(null)
  const [isImporting, setIsImporting] = useState(false)
  const [editorMode, setEditorMode] = useState<EditorMode>('page')
  const [chapterId, setChapterId] = useState<string | null>(null)

  useEffect(() => {
    loadProjectData()
  }, [projectId])

  useEffect(() => {
    if (editorMode === 'chapter') {
      const interval = setInterval(() => {
        const currentContent = state.chapters.get(state.currentChapter)
        if (currentContent && currentContent.content) {
          saveChapter(state.currentChapter, currentContent)
        }
      }, 30000)
      return () => clearInterval(interval)
    }
  }, [state.chapters, state.currentChapter, editorMode])

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
        let firstChapterId: string | null = null
        project.chapters?.forEach((ch: Chapter) => {
          chaptersMap.set(ch.number, ch)
          if (ch.number === 1 && ch.id) {
            firstChapterId = ch.id
          }
          if (ch.number === state.currentChapter && ch.id) {
            setChapterId(ch.id)
          }
        })
        if (!chapterId && firstChapterId) {
          setChapterId(firstChapterId)
        }
        setState(prev => ({
          ...prev,
          outline: project.outline,
          chapters: chaptersMap
        }))
      }
    } catch {
      setError('Failed to load project.')
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
      setError('Failed to save chapter.')
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
      setError('AI writing failed. Please try again.')
      setState(prev => ({ ...prev, isWriting: false }))
    }
  }

  const handleChapterSelect = (number: number) => {
    setState(prev => ({ ...prev, currentChapter: number }))
    const chapter = state.chapters.get(number)
    if (chapter?.id) {
      setChapterId(chapter.id)
    }
  }

  const handlePreviousChapter = () => {
    if (state.currentChapter > 1) {
      handleChapterSelect(state.currentChapter - 1)
    }
  }

  const handleNextChapter = () => {
    if (state.outline && state.currentChapter < state.outline.chapters.length) {
      handleChapterSelect(state.currentChapter + 1)
    }
  }

  const handleManualSave = async () => {
    const chapter = getCurrentChapter()
    if (chapter) {
      await saveChapter(state.currentChapter, chapter)
    }
  }

  const handlePageSave = useCallback(async (content: string) => {
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

    await saveChapter(state.currentChapter, updatedChapter)
  }, [state.currentChapter, projectId])

  const handlePageAIGenerate = useCallback(async (mode: PageGenerateMode, pageNumber: number, context: string): Promise<string> => {
    if (!chapterId) {
      setError('Chapter ID not found.')
      throw new Error('Chapter ID not found')
    }

    const currentChapter = getCurrentChapter()

    const response = await fetch(`/api/projects/${projectId}/chapters/${chapterId}/pages/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        pageNumber,
        mode: mode.mode,
        context,
        currentContent: currentChapter?.content
      })
    })

    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status}`)
    }

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
    }

    // 챕터 내용 저장
    await handlePageSave(fullContent)

    // 생성된 내용 반환 (PageEditor에서 내부 상태 업데이트용)
    return fullContent
  }, [chapterId, projectId, handlePageSave])

  const handleNextStage = async () => {
    try {
      await fetch(`/api/projects/${projectId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stage: 'edit', status: 'writing' })
      })
      router.push(`/project/${projectId}/edit`)
    } catch {
      setError('Failed to proceed to next stage.')
    }
  }

  const handlePreviousStage = () => {
    router.push(`/project/${projectId}/outline`)
  }

  const handleFileLoaded = (file: ParsedFile) => {
    setParsedFile(file)
    setImportStep('split')
  }

  const handleImportChapters = async (chapters: SplitChapter[]) => {
    setIsImporting(true)
    try {
      for (const ch of chapters) {
        await fetch(`/api/projects/${projectId}/chapters`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            number: ch.number,
            title: ch.title,
            content: ch.content,
            status: 'writing'
          })
        })
      }

      if (state.outline) {
        const newOutlineChapters = chapters.map((ch) => ({
          number: ch.number,
          title: ch.title,
          summary: ch.content.substring(0, 200) + '...',
          keyPoints: [],
          sections: []
        }))

        await fetch(`/api/projects/${projectId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            outline: {
              ...state.outline,
              chapters: newOutlineChapters
            }
          })
        })
      }

      closeImportModal()
      await loadProjectData()
    } catch {
      setError('Failed to import chapters.')
    } finally {
      setIsImporting(false)
    }
  }

  const closeImportModal = () => {
    setShowImportModal(false)
    setImportStep('upload')
    setParsedFile(null)
  }

  const allChaptersDone = (): boolean => {
    if (!state.outline) return false
    return state.outline.chapters.every(ch => {
      const chapter = state.chapters.get(ch.number)
      return chapter && chapter.content && chapter.content.length > 2000
    })
  }

  const currentChapter = getCurrentChapter()
  const currentChapterOutline = getCurrentChapterOutline()
  const displayContent = state.isWriting ? state.streamingContent : (currentChapter?.content || '')

  return (
    <div className="h-screen bg-neutral-50 dark:bg-neutral-950 flex flex-col overflow-hidden transition-colors duration-700">
      <StageHeader
        title="집필"
        description="책의 각 챕터를 작성하세요"
        stage="write"
        onPrevious={handlePreviousStage}
        onNext={allChaptersDone() ? handleNextStage : undefined}
        nextLabel="편집 및 검토"
        previousLabel="목차"
      >
        {/* Save Status */}
        <div className="flex items-center gap-2 text-sm text-neutral-500 dark:text-neutral-400">
          {isSaving ? (
            <>
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              저장 중...
            </>
          ) : lastSaved ? (
            <>
              <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              {lastSaved.toLocaleTimeString()}
            </>
          ) : null}
        </div>

        {/* Editor Mode Toggle */}
        <div className="flex border border-neutral-200 dark:border-neutral-800">
          <button
            onClick={() => setEditorMode('chapter')}
            className={`px-4 py-2 text-xs tracking-wider uppercase transition-colors ${
              editorMode === 'chapter'
                ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900'
                : 'bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800'
            }`}
          >
            챕터
          </button>
          <button
            onClick={() => setEditorMode('page')}
            className={`px-4 py-2 text-xs tracking-wider uppercase transition-colors ${
              editorMode === 'page'
                ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900'
                : 'bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800'
            }`}
          >
            페이지
          </button>
        </div>

        {/* Import Button */}
        <button
          onClick={() => setShowImportModal(true)}
          className="flex items-center gap-2 px-4 py-2 text-sm text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
          가져오기
        </button>

        {/* Save Button */}
        <button
          onClick={handleManualSave}
          className="px-4 py-2 text-sm text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors"
        >
          저장
        </button>
      </StageHeader>

      {error && (
        <div className="mx-8 mt-4 p-5 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 text-sm shrink-0">
          {error}
        </div>
      )}

      <div className="flex-1 flex overflow-hidden min-h-0">
        {editorMode === 'chapter' ? (
          <>
            {state.outline && (
              <ChapterList
                chapters={state.outline.chapters}
                chapterContents={state.chapters}
                currentChapter={state.currentChapter}
                onChapterSelect={handleChapterSelect}
              />
            )}

            <ChapterEditor
              chapterOutline={currentChapterOutline}
              content={displayContent}
              isWriting={state.isWriting}
              currentChapter={state.currentChapter}
              totalChapters={state.outline?.chapters.length || 0}
              onContentChange={handleContentChange}
              onAIWrite={handleAIWrite}
              onPreviousChapter={handlePreviousChapter}
              onNextChapter={handleNextChapter}
            />
          </>
        ) : (
          <>
            {/* Page Mode Chapter Sidebar */}
            {state.outline && (
              <aside className="w-56 bg-white dark:bg-neutral-900 border-r border-neutral-200 dark:border-neutral-800 overflow-auto">
                <div className="p-4 border-b border-neutral-200 dark:border-neutral-800">
                  <h3 className="text-xs tracking-widest uppercase text-neutral-500 dark:text-neutral-400">
                    챕터
                  </h3>
                </div>
                <div className="py-2">
                  {state.outline.chapters.map((ch) => {
                    const chapter = state.chapters.get(ch.number)
                    const hasContent = chapter && chapter.content && chapter.content.length > 0
                    const isComplete = chapter && chapter.content && chapter.content.length > 2000

                    return (
                      <button
                        key={ch.number}
                        onClick={() => handleChapterSelect(ch.number)}
                        className={`
                          w-full text-left px-4 py-3 transition-all duration-300 border-l-2
                          ${state.currentChapter === ch.number
                            ? 'border-neutral-900 dark:border-white bg-neutral-50 dark:bg-neutral-800'
                            : 'border-transparent hover:bg-neutral-50 dark:hover:bg-neutral-800/50'
                          }
                        `}
                      >
                        <div className="flex items-center gap-3">
                          <span className={`
                            w-6 h-6 flex items-center justify-center text-xs font-medium
                            ${isComplete
                              ? 'bg-emerald-600 text-white'
                              : hasContent
                                ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900'
                                : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-500 dark:text-neutral-400'
                            }
                          `}>
                            {isComplete ? (
                              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            ) : (
                              ch.number
                            )}
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
            )}

            {chapterId && currentChapterOutline && (
              <PageEditor
                projectId={projectId}
                chapterId={chapterId}
                chapterNumber={state.currentChapter}
                chapterTitle={currentChapterOutline.title}
                chapterOutline={currentChapterOutline}
                initialContent={currentChapter?.content || ''}
                onSave={handlePageSave}
                onAIGenerate={handlePageAIGenerate}
              />
            )}

            {!chapterId && (
              <div className="flex-1 flex items-center justify-center">
                <p className="text-neutral-500 dark:text-neutral-400">챕터를 선택하여 시작하세요</p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-neutral-900 w-full max-w-4xl max-h-[90vh] overflow-auto shadow-2xl">
            <div className="p-6 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
              <h2 className="text-xl font-light text-neutral-900 dark:text-white">
                챕터 가져오기
              </h2>
              <button
                onClick={closeImportModal}
                className="w-10 h-10 flex items-center justify-center text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6">
              {importStep === 'upload' && (
                <>
                  <p className="mb-6 text-sm text-neutral-500 dark:text-neutral-400">
                    원고 파일을 업로드하여 챕터를 추가하거나 대체하세요.
                  </p>
                  <FileUploader
                    onFileLoaded={handleFileLoaded}
                    onCancel={closeImportModal}
                  />
                </>
              )}

              {importStep === 'split' && parsedFile && (
                <ChapterSplitter
                  parsedFile={parsedFile}
                  onConfirm={handleImportChapters}
                  onCancel={closeImportModal}
                  isProcessing={isImporting}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
