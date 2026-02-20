'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import PageToolbar from './PageToolbar'
import PageThumbnails from './PageThumbnails'
import PageCanvas from './PageCanvas'
import SourcesCollapsible from './SourcesCollapsible'
import { AIChatPanel } from '@/components/ai-chat'
import { splitChapterToPages, countWords, getPageStatus, redistributePages, PAGE_CHAR_LIMITS, getTextLength } from '@/lib/page-utils'
import { useToast } from '@/hooks/useToast'
import { getErrorMessage } from '@/lib/errors'
import type { Page, PageViewMode, PageEditorState, PageGenerateMode, ChapterOutline, PaperSize } from '@/types/book'

interface PageEditorProps {
  projectId: string
  projectTitle?: string
  chapterId: string
  chapterNumber: number
  chapterTitle: string
  chapterOutline?: ChapterOutline
  initialContent: string
  onSave: (content: string) => Promise<void>
  onAIGenerate: (mode: PageGenerateMode, pageNumber: number, context: string) => Promise<string>
}

export default function PageEditor({
  projectId,
  projectTitle,
  chapterId,
  chapterNumber,
  chapterTitle,
  chapterOutline,
  initialContent,
  onSave,
  onAIGenerate,
}: PageEditorProps) {
  const [state, setState] = useState<PageEditorState>(() => {
    const initialPages = splitChapterToPages(initialContent).map((p, idx) => ({
      ...p,
      id: `temp-${idx}`,
      chapterId,
    }))
    return {
      pages: initialPages,
      currentPage: 1,
      totalPages: initialPages.length,
      zoom: 100,
      viewMode: 'spread' as PageViewMode,
      paperSize: 'a4' as PaperSize,
      isDirty: false,
      lastSaved: null,
    }
  })

  const [isSaving, setIsSaving] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [streamingContent, setStreamingContent] = useState('')
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const prevInitialContentRef = useRef(initialContent)
  const abortControllerRef = useRef<AbortController | null>(null)
  const { showToast } = useToast()

  // initialContent가 외부에서 변경되면 상태 동기화
  useEffect(() => {
    if (initialContent !== prevInitialContentRef.current) {
      prevInitialContentRef.current = initialContent
      const newPages = splitChapterToPages(initialContent).map((p, idx) => ({
        ...p,
        id: `temp-${idx}`,
        chapterId,
      }))
      setState((prev) => ({
        ...prev,
        pages: newPages,
        totalPages: newPages.length,
        currentPage: Math.min(prev.currentPage, newPages.length || 1),
        isDirty: false,
      }))
    }
  }, [initialContent, chapterId])

  const mergePagesContent = useCallback(() => {
    return state.pages
      .slice()
      .sort((a, b) => a.pageNumber - b.pageNumber)
      .map((p) => p.content)
      .filter((c) => c.trim())
      .join('\n\n')
  }, [state.pages])

  const saveContent = useCallback(async () => {
    if (!state.isDirty) return

    setIsSaving(true)
    try {
      const content = mergePagesContent()
      await onSave(content)
      prevInitialContentRef.current = content
      setState((prev) => ({
        ...prev,
        isDirty: false,
        lastSaved: new Date(),
      }))
    } catch (error) {
      showToast({
        type: 'error',
        message: getErrorMessage(error),
        action: { label: '지금 저장', onClick: () => saveContent() },
      })
      setTimeout(() => saveContent(), 5000)
    } finally {
      setIsSaving(false)
    }
  }, [state.isDirty, mergePagesContent, onSave, showToast])

  useEffect(() => {
    if (state.isDirty) {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
      saveTimeoutRef.current = setTimeout(() => {
        saveContent()
      }, 1000)
    }

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [state.isDirty, saveContent])

  // beforeunload 경고 - 저장되지 않은 변경사항 또는 AI 생성 중일 때
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (state.isDirty || isGenerating) {
        e.preventDefault()
        e.returnValue = ''
      }
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [state.isDirty, isGenerating])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 's') {
        e.preventDefault()
        saveContent()
      }
      if (e.key === 'PageUp') {
        e.preventDefault()
        handlePageChange(Math.max(1, state.currentPage - 1))
      }
      if (e.key === 'PageDown') {
        e.preventDefault()
        handlePageChange(Math.min(state.totalPages, state.currentPage + 1))
      }
      if (e.ctrlKey && e.key === 'g') {
        e.preventDefault()
        const currentPageData = state.pages.find((p) => p.pageNumber === state.currentPage)
        handleGenerate({ mode: currentPageData?.content.trim() ? 'continue' : 'new' })
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.currentPage, state.totalPages, state.pages, saveContent])

  const handlePageChange = (pageNumber: number) => {
    if (pageNumber > state.pages.length) {
      const newPage: Page = {
        id: `temp-new-${Date.now()}`,
        chapterId,
        pageNumber,
        content: '',
        status: 'empty',
        wordCount: 0,
      }
      setState((prev) => ({
        ...prev,
        pages: [...prev.pages, newPage],
        currentPage: pageNumber,
        totalPages: pageNumber,
        isDirty: true,
      }))
    } else {
      setState((prev) => ({
        ...prev,
        currentPage: pageNumber,
      }))
    }
  }

  const handleContentChange = (pageNumber: number, content: string) => {
    setState((prev) => {
      const maxChars = PAGE_CHAR_LIMITS[prev.paperSize]
      const textLength = getTextLength(content)

      // 오버플로우 체크 (HTML 태그 제외한 텍스트 길이)
      if (textLength > maxChars) {
        // 자동 페이지 분리
        const newPages = redistributePages(
          prev.pages,
          pageNumber,
          content,
          prev.paperSize,
          chapterId
        )
        return {
          ...prev,
          pages: newPages,
          totalPages: newPages.length,
          isDirty: true,
        }
      }

      // 오버플로우가 없으면 일반 업데이트
      return {
        ...prev,
        pages: prev.pages.map((p) =>
          p.pageNumber === pageNumber
            ? {
                ...p,
                content,
                wordCount: countWords(content),
                status: getPageStatus(content),
              }
            : p
        ),
        isDirty: true,
      }
    })
  }

  const handleZoomChange = (zoom: number) => {
    setState((prev) => ({ ...prev, zoom }))
  }

  const handleViewModeChange = (viewMode: PageViewMode) => {
    setState((prev) => ({ ...prev, viewMode }))
  }

  const handlePaperSizeChange = (paperSize: PaperSize) => {
    setState((prev) => ({ ...prev, paperSize }))
  }

  const handleDeletePage = async (pageNumber: number) => {
    // 해당 페이지 삭제 및 번호 재조정
    let newPages = state.pages
      .filter((p) => p.pageNumber !== pageNumber)
      .map((p, idx) => ({
        ...p,
        pageNumber: idx + 1,
      }))

    // 모든 페이지가 삭제되면 빈 페이지 1개 자동 생성
    if (newPages.length === 0) {
      newPages = [{
        id: `temp-empty-${Date.now()}`,
        chapterId,
        pageNumber: 1,
        content: '',
        status: 'empty' as const,
        wordCount: 0,
      }]
    }

    // 현재 페이지 조정
    const newCurrentPage = Math.min(pageNumber, newPages.length)

    // 삭제된 페이지 배열로 내용 생성
    const content = newPages
      .slice()
      .sort((a, b) => a.pageNumber - b.pageNumber)
      .map((p) => p.content)
      .filter((c) => c.trim())
      .join('\n\n')

    // 즉시 저장
    setIsSaving(true)
    try {
      await onSave(content)
      setState((prev) => ({
        ...prev,
        pages: newPages,
        currentPage: newCurrentPage,
        totalPages: newPages.length,
        isDirty: false,
        lastSaved: new Date(),
      }))
    } catch {
      // 저장 실패 시 상태만 업데이트 (다음 저장 시 재시도)
      setState((prev) => ({
        ...prev,
        pages: newPages,
        currentPage: newCurrentPage,
        totalPages: newPages.length,
        isDirty: true,
      }))
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancelGenerate = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }
    setIsGenerating(false)
    setStreamingContent('')
    showToast({
      type: 'info',
      message: 'AI 작성이 취소되었습니다',
    })
  }, [showToast])

  const handleGenerate = async (mode: PageGenerateMode) => {
    // 이전 요청이 있으면 취소
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    abortControllerRef.current = new AbortController()

    setIsGenerating(true)
    setStreamingContent('')

    try {
      const previousPages = state.pages
        .filter((p) => p.pageNumber < state.currentPage)
        .sort((a, b) => b.pageNumber - a.pageNumber)
        .slice(0, 2)
        .map((p) => p.content)
        .reverse()
        .join('\n\n')

      const currentPageData = state.pages.find((p) => p.pageNumber === state.currentPage)
      const currentPageContent = currentPageData?.content || ''

      const outlineContext = chapterOutline
        ? `챕터 ${chapterNumber}: ${chapterTitle}\n개요: ${chapterOutline.summary}\n핵심 포인트: ${chapterOutline.keyPoints.join(', ')}`
        : `챕터 ${chapterNumber}: ${chapterTitle}`

      let context = outlineContext
      if (previousPages || currentPageContent) {
        const allPreviousContent = previousPages
          ? (currentPageContent ? `${previousPages}\n\n${currentPageContent}` : previousPages)
          : currentPageContent
        context = `${outlineContext}\n\n이전 내용:\n${allPreviousContent}`
      }

      const generatedContent = await onAIGenerate(mode, state.currentPage, context)

      // 취소된 경우 결과 무시
      if (abortControllerRef.current?.signal.aborted) {
        return
      }

      if (generatedContent) {
        const newContent = mode.mode === 'continue' && currentPageContent
          ? `${currentPageContent}\n\n${generatedContent}`
          : generatedContent

        setState((prev) => {
          const maxChars = PAGE_CHAR_LIMITS[prev.paperSize]
          const textLength = getTextLength(newContent)

          if (textLength > maxChars) {
            const newPages = redistributePages(
              prev.pages,
              state.currentPage,
              newContent,
              prev.paperSize,
              chapterId
            )
            return {
              ...prev,
              pages: newPages,
              totalPages: newPages.length,
              isDirty: true,
            }
          }

          return {
            ...prev,
            pages: prev.pages.map((p) =>
              p.pageNumber === state.currentPage
                ? {
                    ...p,
                    content: newContent,
                    wordCount: countWords(newContent),
                    status: getPageStatus(newContent),
                  }
                : p
            ),
            isDirty: true,
          }
        })
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return
      }
      showToast({
        type: 'error',
        message: getErrorMessage(error),
      })
    } finally {
      setIsGenerating(false)
      setStreamingContent('')
      abortControllerRef.current = null
    }
  }

  const handleManualSave = () => {
    saveContent()
  }

  return (
    <div className="flex flex-col h-full overflow-hidden bg-neutral-100 dark:bg-neutral-900">
      <div className="shrink-0">
        <PageToolbar
          projectId={projectId}
          projectTitle={projectTitle}
          chapterNumber={chapterNumber}
          chapterTitle={chapterTitle}
          currentPage={state.currentPage}
          totalPages={state.totalPages}
          zoom={state.zoom}
          onZoomChange={handleZoomChange}
          viewMode={state.viewMode}
          onViewModeChange={handleViewModeChange}
          paperSize={state.paperSize}
          onPaperSizeChange={handlePaperSizeChange}
          isSaving={isSaving}
          lastSaved={state.lastSaved}
          isDirty={state.isDirty}
          onSave={handleManualSave}
        />
      </div>

      {/* 메인 콘텐츠 영역: Edit Area + AI Panel (가로 배치) */}
      <div className="flex-1 flex min-h-0">
        {/* 좌측: 썸네일 + 캔버스 */}
        <div className="flex-1 flex min-w-0">
          <PageThumbnails
            pages={state.pages}
            currentPage={state.currentPage}
            onPageSelect={handlePageChange}
          />

          <PageCanvas
            pages={state.pages}
            currentPage={state.currentPage}
            onPageChange={handlePageChange}
            onContentChange={handleContentChange}
            onGenerate={handleGenerate}
            onCancelGenerate={handleCancelGenerate}
            onDeletePage={handleDeletePage}
            isGenerating={isGenerating}
            streamingContent={streamingContent}
            zoom={state.zoom}
            viewMode={state.viewMode}
            paperSize={state.paperSize}
            chapterTitle={`챕터 ${chapterNumber}: ${chapterTitle}`}
            projectId={projectId}
            chapterId={chapterId}
          />
        </div>

        {/* 우측: AI 채팅 패널 */}
        <AIChatPanel
          projectId={projectId}
          chapterId={chapterId}
          chapterNumber={chapterNumber}
          pages={state.pages}
          getPageContent={(pageNumber) => {
            if (pageNumber === null) {
              return state.pages
                .slice()
                .sort((a, b) => a.pageNumber - b.pageNumber)
                .map((p) => p.content)
                .filter((c) => c.trim())
                .join('\n\n')
            }
            const page = state.pages.find((p) => p.pageNumber === pageNumber)
            return page?.content || ''
          }}
          onApplyContent={(content) => {
            handleContentChange(state.currentPage, content)
          }}
        />
      </div>

      {/* 출처 패널 */}
      <div className="shrink-0">
        <SourcesCollapsible projectId={projectId} />
      </div>

      <div className="shrink-0 flex items-center justify-between px-4 h-10 bg-white dark:bg-neutral-800 border-t border-neutral-200 dark:border-neutral-700 text-sm text-neutral-500 dark:text-neutral-400">
        <span>
          챕터 {chapterNumber} · {state.pages.length}페이지 · {state.pages.reduce((sum, p) => sum + p.wordCount, 0).toLocaleString()}단어
        </span>
        <div className="flex items-center gap-4 text-xs">
          <span>Ctrl+S: 저장</span>
          <span>PageUp/Down: 페이지 이동</span>
          <span>Ctrl+G: AI 생성</span>
        </div>
      </div>
    </div>
  )
}
