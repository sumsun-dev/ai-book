'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import PageToolbar from './PageToolbar'
import PageThumbnails from './PageThumbnails'
import PageCanvas from './PageCanvas'
import SourcesCollapsible from './SourcesCollapsible'
import { splitChapterToPages, countWords, getPageStatus, redistributePages, PAGE_CHAR_LIMITS, getTextLength } from '@/lib/page-utils'
import type { Page, PageViewMode, PageEditorState, PageGenerateMode, ChapterOutline, PaperSize } from '@/types/book'

interface PageEditorProps {
  projectId: string
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

  // 챕터 변경 시 페이지 상태 초기화 (initialContent prop 변경 감지)
  useEffect(() => {
    const newPages = splitChapterToPages(initialContent).map((p, idx) => ({
      ...p,
      id: `temp-${idx}`,
      chapterId,
    }))
    setState(prev => ({
      ...prev,
      pages: newPages,
      currentPage: 1,
      totalPages: newPages.length,
      isDirty: false,
      lastSaved: null,
    }))
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
      setState((prev) => ({
        ...prev,
        isDirty: false,
        lastSaved: new Date(),
      }))
    } catch {
      // 저장 실패 시 상태 유지 (다음 저장 시 재시도)
    } finally {
      setIsSaving(false)
    }
  }, [state.isDirty, mergePagesContent, onSave])

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

  const handleDeletePage = (pageNumber: number) => {
    setState((prev) => {
      // 페이지가 1개뿐이면 삭제 불가
      if (prev.pages.length <= 1) return prev

      // 해당 페이지 삭제 및 번호 재조정
      const newPages = prev.pages
        .filter((p) => p.pageNumber !== pageNumber)
        .map((p, idx) => ({
          ...p,
          pageNumber: idx + 1,
        }))

      // 현재 페이지 조정
      const newCurrentPage = pageNumber > newPages.length ? newPages.length : pageNumber

      return {
        ...prev,
        pages: newPages,
        currentPage: newCurrentPage,
        totalPages: newPages.length,
        isDirty: true,
      }
    })
  }

  const handleGenerate = async (mode: PageGenerateMode) => {
    setIsGenerating(true)
    setStreamingContent('')

    try {
      // 이전 페이지들의 내용 수집 (컨텍스트용)
      const previousPages = state.pages
        .filter((p) => p.pageNumber < state.currentPage)
        .sort((a, b) => b.pageNumber - a.pageNumber)
        .slice(0, 2)
        .map((p) => p.content)
        .reverse()
        .join('\n\n')

      // 현재 페이지 내용 (continue/rewrite 모드용)
      const currentPageData = state.pages.find((p) => p.pageNumber === state.currentPage)
      const currentPageContent = currentPageData?.content || ''

      const outlineContext = chapterOutline
        ? `챕터 ${chapterNumber}: ${chapterTitle}\n개요: ${chapterOutline.summary}\n핵심 포인트: ${chapterOutline.keyPoints.join(', ')}`
        : `챕터 ${chapterNumber}: ${chapterTitle}`

      // continue 모드일 때 이전 내용 + 현재 페이지 내용까지 포함
      let context = outlineContext
      if (previousPages || currentPageContent) {
        const allPreviousContent = previousPages
          ? (currentPageContent ? `${previousPages}\n\n${currentPageContent}` : previousPages)
          : currentPageContent
        context = `${outlineContext}\n\n이전 내용:\n${allPreviousContent}`
      }

      // AI 생성 호출 및 결과 받기
      const generatedContent = await onAIGenerate(mode, state.currentPage, context)

      // 생성된 내용을 현재 페이지에 반영
      if (generatedContent) {
        // continue 모드면 기존 내용에 이어붙이기, 아니면 교체
        const newContent = mode.mode === 'continue' && currentPageContent
          ? `${currentPageContent}\n\n${generatedContent}`
          : generatedContent

        setState((prev) => {
          const maxChars = PAGE_CHAR_LIMITS[prev.paperSize]
          const textLength = getTextLength(newContent)

          // 오버플로우 체크 및 자동 분리 (HTML 태그 제외)
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
      console.error('AI generation failed:', error)
    } finally {
      setIsGenerating(false)
      setStreamingContent('')
    }
  }

  const handleManualSave = () => {
    saveContent()
  }

  return (
    <div className="flex flex-col h-full bg-neutral-100 dark:bg-neutral-900">
      <PageToolbar
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

      <div className="flex-1 flex min-h-0">
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

      {/* 출처 패널 */}
      <SourcesCollapsible projectId={projectId} />

      <div className="flex items-center justify-between px-4 py-2 bg-white dark:bg-neutral-800 border-t border-neutral-200 dark:border-neutral-700 text-sm text-neutral-500 dark:text-neutral-400">
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
