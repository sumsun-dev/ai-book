'use client'

import { useMemo } from 'react'
import PageContent from './PageContent'
import PageNavigator from './PageNavigator'
import AIGenerateButton from './AIGenerateButton'
import type { Page, PageViewMode, PageGenerateMode, PaperSize } from '@/types/book'
import { PAPER_SIZES } from '@/types/book'

interface PageCanvasProps {
  pages: Page[]
  currentPage: number
  onPageChange: (pageNumber: number) => void
  onContentChange: (pageNumber: number, content: string) => void
  onGenerate: (mode: PageGenerateMode) => void
  onCancelGenerate?: () => void
  onDeletePage: (pageNumber: number) => void
  isGenerating: boolean
  streamingContent?: string
  zoom: number
  viewMode: PageViewMode
  paperSize: PaperSize
  chapterTitle: string
  projectId?: string
  chapterId?: string
}

export default function PageCanvas({
  pages,
  currentPage,
  onPageChange,
  onContentChange,
  onGenerate,
  onCancelGenerate,
  onDeletePage,
  isGenerating,
  streamingContent,
  zoom,
  viewMode,
  paperSize,
  chapterTitle,
  projectId,
  chapterId,
}: PageCanvasProps) {
  const currentPageData = useMemo(
    () => pages.find((p) => p.pageNumber === currentPage),
    [pages, currentPage]
  )

  const paper = PAPER_SIZES[paperSize]
  const scale = zoom / 100

  // 양면 펼침에서 현재 페이지가 홀수면 왼쪽, 짝수면 오른쪽
  const spreadPages = useMemo(() => {
    if (viewMode !== 'spread') return { left: null, right: null }

    // 홀수 페이지가 왼쪽, 짝수 페이지가 오른쪽
    const leftPageNum = currentPage % 2 === 1 ? currentPage : currentPage - 1
    const rightPageNum = leftPageNum + 1

    return {
      left: pages.find((p) => p.pageNumber === leftPageNum) || null,
      right: pages.find((p) => p.pageNumber === rightPageNum) || null,
    }
  }, [pages, currentPage, viewMode])

  const handleContentChange = (content: string) => {
    onContentChange(currentPage, content)
  }

  // 페이지 스타일 계산
  const pageStyle = {
    width: `${paper.width}px`,
    height: `${paper.height}px`,
  }

  // 단일 페이지 렌더링
  const renderSinglePage = (page: Page | null | undefined, pageNumber: number, isActive: boolean) => {
    if (!page && pageNumber > pages.length) {
      // 새 페이지 추가 버튼
      return (
        <div
          style={pageStyle}
          className="bg-white dark:bg-neutral-800 shadow-2xl border border-neutral-300 dark:border-neutral-600 flex flex-col"
        >
          <div className="flex-1 flex items-center justify-center">
            <button
              onClick={() => onPageChange(pageNumber)}
              className="text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors"
            >
              <div className="text-center">
                <span className="text-4xl block mb-2">+</span>
                <span className="text-sm">새 페이지 추가</span>
              </div>
            </button>
          </div>
        </div>
      )
    }

    const content = page?.content || ''
    const showAIButton = isActive

    return (
      <div
        style={pageStyle}
        className="bg-white dark:bg-neutral-800 shadow-2xl border border-neutral-300 dark:border-neutral-600 flex flex-col overflow-hidden"
      >
        {/* 페이지 헤더 - 고정 높이로 양면 모드에서 일관된 높이 유지 */}
        <div className="flex items-center justify-between px-4 h-12 bg-neutral-50 dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-700 shrink-0">
          <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
            {pageNumber}
          </span>
          <div className="flex items-center gap-2">
            {/* 페이지 삭제 버튼 */}
            {isActive && (
              <button
                onClick={() => {
                  if (window.confirm(`${pageNumber}페이지를 삭제하시겠습니까?`))  {
                    onDeletePage(pageNumber)
                  }
                }}
                className="p-1.5 text-neutral-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                title="페이지 삭제"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            )}
            {/* AI 버튼 영역 - 항상 공간 확보하여 높이 일관성 유지 */}
            <div className="h-8 flex items-center">
              {showAIButton && (
                <AIGenerateButton
                  onGenerate={onGenerate}
                  onCancel={onCancelGenerate}
                  isGenerating={isGenerating}
                  hasContent={!!content.trim()}
                />
              )}
            </div>
          </div>
        </div>

        {/* 페이지 콘텐츠 */}
        <div className="flex-1 overflow-hidden">
          <PageContent
            content={content}
            onChange={(newContent) => onContentChange(pageNumber, newContent)}
            isGenerating={isGenerating && isActive}
            streamingContent={isActive ? streamingContent : undefined}
            zoom={100}
            paperSize={paperSize}
            projectId={projectId}
            chapterId={chapterId}
          />
        </div>

        {/* 페이지 푸터 */}
        <div className="px-4 py-1 bg-neutral-50 dark:bg-neutral-900 border-t border-neutral-200 dark:border-neutral-700 text-center shrink-0">
          <span className="text-xs text-neutral-400 dark:text-neutral-500">{pageNumber}</span>
        </div>
      </div>
    )
  }

  // 연속 스크롤 모드
  if (viewMode === 'continuous') {
    return (
      <div className="flex-1 overflow-y-auto bg-neutral-200 dark:bg-neutral-900 p-8">
        <div
          className="mx-auto space-y-8"
          style={{
            width: `${paper.width * scale}px`,
            transform: `scale(${scale})`,
            transformOrigin: 'top center',
          }}
        >
          {pages.map((page) => (
            <div
              key={page.id || page.pageNumber}
              id={`page-${page.pageNumber}`}
              onClick={() => onPageChange(page.pageNumber)}
              className={`cursor-pointer transition-all ${
                page.pageNumber === currentPage ? 'ring-4 ring-neutral-900 dark:ring-white' : ''
              }`}
            >
              {renderSinglePage(page, page.pageNumber, page.pageNumber === currentPage)}
            </div>
          ))}
        </div>
      </div>
    )
  }

  // 양면 펼침 모드
  if (viewMode === 'spread') {
    return (
      <div className="flex-1 flex flex-col bg-neutral-200 dark:bg-neutral-900">
        <div className="flex-1 flex items-center justify-center p-4 overflow-auto">
          <div
            className="flex gap-1 bg-neutral-800 dark:bg-neutral-950 p-4 shadow-2xl"
            style={{
              transform: `scale(${scale})`,
              transformOrigin: 'center center',
            }}
          >
            {/* 왼쪽 페이지 (홀수) */}
            <div
              onClick={() => spreadPages.left && onPageChange(spreadPages.left.pageNumber)}
              className={`cursor-pointer transition-all ${
                spreadPages.left?.pageNumber === currentPage ? 'ring-4 ring-white' : ''
              }`}
            >
              {renderSinglePage(
                spreadPages.left,
                spreadPages.left?.pageNumber || 1,
                spreadPages.left?.pageNumber === currentPage
              )}
            </div>

            {/* 오른쪽 페이지 (짝수) */}
            <div
              onClick={() => {
                if (spreadPages.right) {
                  onPageChange(spreadPages.right.pageNumber)
                } else if (spreadPages.left) {
                  onPageChange(spreadPages.left.pageNumber + 1)
                }
              }}
              className={`cursor-pointer transition-all ${
                spreadPages.right?.pageNumber === currentPage ? 'ring-4 ring-white' : ''
              }`}
            >
              {renderSinglePage(
                spreadPages.right,
                spreadPages.right?.pageNumber || (spreadPages.left?.pageNumber || 0) + 1,
                spreadPages.right?.pageNumber === currentPage
              )}
            </div>
          </div>
        </div>

        <PageNavigator
          currentPage={currentPage}
          totalPages={Math.max(pages.length, 1)}
          onPageChange={onPageChange}
        />
      </div>
    )
  }

  // 단일 페이지 모드
  return (
    <div className="flex-1 flex flex-col bg-neutral-200 dark:bg-neutral-900">
      <div className="flex-1 flex items-center justify-center p-4 overflow-auto">
        <div
          style={{
            transform: `scale(${scale})`,
            transformOrigin: 'center center',
          }}
        >
          {renderSinglePage(currentPageData, currentPage, true)}
        </div>
      </div>

      <PageNavigator
        currentPage={currentPage}
        totalPages={Math.max(pages.length, 1)}
        onPageChange={onPageChange}
      />
    </div>
  )
}
