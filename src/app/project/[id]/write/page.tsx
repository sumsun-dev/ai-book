'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import StageHeader from '@/components/project/StageHeader'
import { ChapterList, ChapterEditor } from '@/components/write'
import { PageEditor } from '@/components/page-editor'
import { AIChatPanel } from '@/components/ai-chat'
import { FileUploader, ChapterSplitter } from '@/components/upload'
import { MemoPanel } from '@/components/MemoPanel'
import { BiblePanel } from '@/components/bible'
import MemoButton from '@/components/page-editor/MemoButton'
import { BookOutline, ChapterOutline, Chapter, ParsedFile, SplitChapter, PageGenerateMode } from '@/types/book'
import { textToHtml } from '@/lib/utils/text-to-html'
import { useToast } from '@/hooks/useToast'
import type { BookBible, FictionBible, SelfHelpBible } from '@/types/book-bible'

interface WriteState {
  outline: BookOutline | null
  chapters: Map<number, Chapter>
  currentChapter: number
  isWriting: boolean
  writingChapter: number | null
  streamingContent: string
}

type ImportStep = 'upload' | 'split'
type EditorMode = 'chapter' | 'page'

export default function WritePage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.id as string
  const { showToast } = useToast()
  const t = useTranslations('write')
  const tc = useTranslations('common')

  const [state, setState] = useState<WriteState>({
    outline: null,
    chapters: new Map(),
    currentChapter: 1,
    isWriting: false,
    writingChapter: null,
    streamingContent: ''
  })
  const [isSaving, setIsSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showImportModal, setShowImportModal] = useState(false)
  const [importStep, setImportStep] = useState<ImportStep>('upload')
  const [parsedFile, setParsedFile] = useState<ParsedFile | null>(null)
  const [isImporting, setIsImporting] = useState(false)
  const [editorMode, setEditorMode] = useState<EditorMode>('chapter')
  const [chapterId, setChapterId] = useState<string | null>(null)
  const [showMemoPanel, setShowMemoPanel] = useState(false)
  const [showBiblePanel, setShowBiblePanel] = useState(false)
  const [memoCount, setMemoCount] = useState(0)
  const [projectType, setProjectType] = useState<string>('fiction')
  const [isFirstBibleVisit, setIsFirstBibleVisit] = useState(false)
  const [hasBibleContent, setHasBibleContent] = useState(false)

  // Bible이 지원되는 타입인지 확인
  const isBibleSupported = projectType === 'fiction' || projectType === 'selfhelp'

  useEffect(() => {
    loadProjectData()
    fetchMemoCount()
  }, [projectId])

  // Bible 지원 타입일 때만 Bible 관련 초기화 실행
  useEffect(() => {
    if (isBibleSupported) {
      checkBibleVisit()
      fetchBibleStatus()
      // Bible 지원 타입이면 패널 기본 열림
      setShowBiblePanel(true)
    }
  }, [projectType])

  const checkBibleVisit = () => {
    const visited = localStorage.getItem(`bible-visited-${projectId}`)
    if (!visited) {
      setIsFirstBibleVisit(true)
      localStorage.setItem(`bible-visited-${projectId}`, 'true')
    }
  }

  const fetchBibleStatus = async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}/bible`)
      const data = await res.json()
      if (data.success && data.data) {
        const bible = data.data as BookBible
        if (bible.type === 'fiction') {
          const fBible = bible as FictionBible
          setHasBibleContent(fBible.characters.length > 0 || fBible.worldSettings.length > 0 || fBible.plotThreads.length > 0)
        } else {
          const sBible = bible as SelfHelpBible
          setHasBibleContent(sBible.coreMessages.length > 0 || sBible.frameworks.length > 0)
        }
      }
    } catch {
      // Bible 로드 실패 무시
    }
  }

  const fetchMemoCount = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}/memos`)
      const data = await response.json()
      if (data.success) {
        setMemoCount(data.data.length)
      }
    } catch (error) {
      console.error('메모 개수 로드 실패:', error)
    }
  }

  // 초기 로드 후 첫 번째 챕터 자동 선택
  useEffect(() => {
    if (state.outline && state.outline.chapters.length > 0 && !chapterId) {
      handleChapterSelect(1)
    }
  }, [state.outline])

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
        setProjectType(project.type || 'fiction')
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
      const res = await fetch(`/api/projects/${projectId}/chapters`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          number,
          title: chapter.title,
          content: chapter.content,
          status: chapter.status || 'writing'
        })
      })
      if (res.ok) {
        const { data } = await res.json()
        // 현재 챕터의 ID가 없으면 설정
        if (data?.id && number === state.currentChapter && !chapterId) {
          setChapterId(data.id)
        }
        // 챕터 로컬 상태에 ID 업데이트
        if (data?.id) {
          setState(prev => {
            const newChapters = new Map(prev.chapters)
            const existing = newChapters.get(number)
            if (existing && !existing.id) {
              newChapters.set(number, { ...existing, id: data.id })
            }
            return { ...prev, chapters: newChapters }
          })
        }
      }
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

  const handleAIWrite = async (mode: 'new' | 'continue' = 'new') => {
    const chapterOutline = getCurrentChapterOutline()
    if (!chapterOutline || state.isWriting) return

    const currentChapter = getCurrentChapter()
    const existingContent = currentChapter?.content || ''

    // Bible 사용 여부 표시 (Bible 지원 타입일 때만)
    if (isBibleSupported && hasBibleContent) {
      showToast({
        type: 'info',
        message: 'Bible 설정을 반영하여 AI가 작성합니다',
        action: { label: 'Bible 보기', onClick: () => setShowBiblePanel(true) },
      })
    }

    // continue 모드일 때 기존 내용을 스트리밍 콘텐츠 초기값으로 설정
    const writingChapterNumber = state.currentChapter
    setState(prev => ({
      ...prev,
      isWriting: true,
      writingChapter: writingChapterNumber,
      streamingContent: mode === 'continue' ? existingContent : ''
    }))
    setError(null)

    try {
      const previousChapters: { number: number; title: string; summary: string }[] = []
      state.outline?.chapters.forEach(ch => {
        if (ch.number < state.currentChapter) {
          const existingChapter = state.chapters.get(ch.number)
          const summary = existingChapter?.summary
            || ch.summary
            || existingChapter?.content?.substring(0, 500)
            || ''
          previousChapters.push({
            number: ch.number,
            title: ch.title,
            summary,
          })
        }
      })

      const response = await fetch(`/api/projects/${projectId}/write`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chapterNumber: state.currentChapter,
          chapterOutline,
          previousChapters,
          mode,
          existingContent: mode === 'continue' ? existingContent : undefined
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
        // 스트리밍 중에는 raw 콘텐츠 직접 표시 (HTML 태그가 점진적으로 쌓임)
        const displayContent = mode === 'continue'
          ? existingContent + fullContent
          : fullContent
        setState(prev => ({ ...prev, streamingContent: displayContent }))
      }

      // 최종 콘텐츠를 HTML로 변환
      const htmlContent = textToHtml(fullContent)
      // continue 모드면 기존 내용에 새 내용 추가
      const finalContent = mode === 'continue'
        ? existingContent + htmlContent
        : htmlContent

      const updatedChapter: Chapter = {
        number: writingChapterNumber,
        title: chapterOutline.title,
        content: finalContent,
        status: 'writing',
        revisions: []
      }

      setState(prev => {
        const newChapters = new Map(prev.chapters)
        newChapters.set(writingChapterNumber, updatedChapter)
        return {
          ...prev,
          chapters: newChapters,
          isWriting: false,
          writingChapter: null,
          streamingContent: ''
        }
      })

      await saveChapter(writingChapterNumber, updatedChapter)
    } catch {
      setError('AI writing failed. Please try again.')
      setState(prev => ({ ...prev, isWriting: false, writingChapter: null }))
    }
  }

  const handleChapterSelect = async (number: number) => {
    setState(prev => ({ ...prev, currentChapter: number }))
    const chapter = state.chapters.get(number)

    if (chapter?.id) {
      setChapterId(chapter.id)
    } else {
      // 챕터가 DB에 없으면 자동 생성
      const chapterOutline = state.outline?.chapters.find(ch => ch.number === number)
      if (chapterOutline) {
        try {
          const res = await fetch(`/api/projects/${projectId}/chapters`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              number,
              title: chapterOutline.title,
              content: '',
              status: 'pending'
            })
          })
          if (res.ok) {
            const { data } = await res.json()
            if (data?.id) {
              setChapterId(data.id)
              // 로컬 상태에도 추가
              setState(prev => {
                const newChapters = new Map(prev.chapters)
                newChapters.set(number, {
                  id: data.id,
                  number,
                  title: chapterOutline.title,
                  content: '',
                  status: 'pending',
                  revisions: []
                })
                return { ...prev, chapters: newChapters }
              })
            }
          }
        } catch (err) {
          console.error('Failed to create chapter:', err)
        }
      }
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

    // 기존 챕터 정보 유지 (id 포함)
    const existingChapter = state.chapters.get(state.currentChapter)

    const updatedChapter: Chapter = {
      ...existingChapter,
      id: existingChapter?.id || chapterId || undefined,
      number: state.currentChapter,
      title: chapterOutline.title,
      content,
      status: 'writing',
      revisions: existingChapter?.revisions || []
    }

    setState(prev => {
      const newChapters = new Map(prev.chapters)
      newChapters.set(state.currentChapter, updatedChapter)
      return { ...prev, chapters: newChapters }
    })

    await saveChapter(state.currentChapter, updatedChapter)
  }, [state.currentChapter, state.chapters, chapterId])

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

  const getIncompleteChapterCount = (): number => {
    if (!state.outline) return 0
    return state.outline.chapters.filter(ch => {
      const chapter = state.chapters.get(ch.number)
      return !chapter || !chapter.content || chapter.content.length < 100
    }).length
  }

  const handleNextStageWithConfirm = async () => {
    const incompleteCount = getIncompleteChapterCount()
    if (incompleteCount > 0) {
      const message = t('incompleteWarning', { count: incompleteCount })
      if (!window.confirm(message)) return
    }
    await handleNextStage()
  }

  const currentChapter = getCurrentChapter()
  const currentChapterOutline = getCurrentChapterOutline()
  const isWritingCurrentChapter = state.isWriting && state.writingChapter === state.currentChapter
  const displayContent = isWritingCurrentChapter ? state.streamingContent : (currentChapter?.content || '')

  return (
    <div className="h-screen bg-neutral-50 dark:bg-neutral-950 flex flex-col overflow-hidden transition-colors duration-700">
      <StageHeader
        title={t('title')}
        description={t('description')}
        stage="write"
        onPrevious={handlePreviousStage}
        onNext={handleNextStageWithConfirm}
        nextLabel={t('nextLabel')}
        previousLabel={t('previousLabel')}
      >
        {/* Save Status */}
        <div className="flex items-center gap-2 text-sm text-neutral-500 dark:text-neutral-400">
          {isSaving ? (
            <>
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              {tc('saving')}
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
            {t('chapter')}
          </button>
          <button
            onClick={() => setEditorMode('page')}
            className={`px-4 py-2 text-xs tracking-wider uppercase transition-colors ${
              editorMode === 'page'
                ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900'
                : 'bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800'
            }`}
          >
            {t('page')}
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
          {t('import')}
        </button>

        {/* Bible Button - fiction/selfhelp 타입에만 표시 */}
        {isBibleSupported && (
          <button
            onClick={() => {
              setShowBiblePanel(!showBiblePanel)
              setIsFirstBibleVisit(false)
            }}
            className={`flex items-center gap-2 px-4 py-2 text-sm transition-colors relative ${
              showBiblePanel
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
            } ${isFirstBibleVisit ? 'animate-pulse' : ''}`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            {t('bible')}
            {isFirstBibleVisit && (
              <span className="absolute -top-1 -right-1 px-1.5 py-0.5 text-[10px] bg-emerald-500 text-white rounded-full">
                {t('newBadge')}
              </span>
            )}
            {hasBibleContent && state.isWriting && (
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 px-1 py-0.5 text-[9px] bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-300 rounded whitespace-nowrap">
                {t('applying')}
              </span>
            )}
          </button>
        )}

        {/* Memo Button */}
        <MemoButton
          onClick={() => setShowMemoPanel(!showMemoPanel)}
          isActive={showMemoPanel}
          memoCount={memoCount}
        />

        {/* Save Button */}
        <button
          onClick={handleManualSave}
          className="px-4 py-2 text-sm text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors"
        >
          {t('save')}
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
              isWriting={isWritingCurrentChapter}
              currentChapter={state.currentChapter}
              totalChapters={state.outline?.chapters.length || 0}
              projectId={projectId}
              chapterId={chapterId}
              onContentChange={handleContentChange}
              onAIWrite={handleAIWrite}
              onPreviousChapter={handlePreviousChapter}
              onNextChapter={handleNextChapter}
            />

            {/* AI 채팅 패널 - 챕터 모드 */}
            {chapterId && (
              <AIChatPanel
                projectId={projectId}
                chapterId={chapterId}
                chapterNumber={state.currentChapter}
                pages={[]}
                getPageContent={() => currentChapter?.content || ''}
                onApplyContent={(content) => {
                  handleContentChange(content)
                }}
              />
            )}
          </>
        ) : (
          <>
            {/* Page Mode Chapter Sidebar */}
            {state.outline && (
              <aside className="w-56 bg-white dark:bg-neutral-900 border-r border-neutral-200 dark:border-neutral-800 overflow-auto">
                <div className="p-4 border-b border-neutral-200 dark:border-neutral-800">
                  <h3 className="text-xs tracking-widest uppercase text-neutral-500 dark:text-neutral-400">
                    {t('chapter')}
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
                key={`${chapterId}-${state.currentChapter}-${editorMode}-${currentChapter?.content?.length || 0}`}
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
                {t('importModal.title')}
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
                    {t('importModal.description')}
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

      {/* Memo Panel */}
      <MemoPanel
        projectId={projectId}
        isOpen={showMemoPanel}
        onClose={() => setShowMemoPanel(false)}
        currentChapter={state.currentChapter}
      />

      {/* Bible Panel - fiction/selfhelp 타입에만 표시 */}
      {isBibleSupported && showBiblePanel && (
        <div className="fixed top-0 right-0 h-full w-80 bg-white dark:bg-neutral-900 border-l border-neutral-200 dark:border-neutral-700 shadow-xl z-40 flex flex-col">
          <div className="flex items-center justify-between p-3 border-b border-neutral-200 dark:border-neutral-700">
            <h3 className="text-sm font-medium text-neutral-900 dark:text-white">Book Bible</h3>
            <button
              onClick={() => setShowBiblePanel(false)}
              className="w-8 h-8 flex items-center justify-center text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="flex-1 overflow-hidden">
            <BiblePanel
              projectId={projectId}
              projectType={projectType}
              currentChapter={state.currentChapter}
              chapterContent={currentChapter?.content?.replace(/<[^>]*>/g, ' ') || ''}
            />
          </div>
        </div>
      )}
    </div>
  )
}
