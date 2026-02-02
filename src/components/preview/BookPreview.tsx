'use client'

import { useState } from 'react'
import type { BookProject } from '@/types/book'
import { BookCover } from './BookCover'
import { TableOfContents } from './TableOfContents'
import { ChapterView } from './ChapterView'
import { CoverDesigner } from '../CoverDesigner'
import { MetadataForm } from '../metadata'
import { ISBNInput } from '../isbn'
import { SourcesPanel } from '../SourcesPanel'
import { MemoPanel } from '../MemoPanel'

type ViewMode = 'cover' | 'toc' | 'chapter'
type ModalType = 'none' | 'cover' | 'metadata' | 'isbn' | 'export'
type PanelType = 'none' | 'sources' | 'memos'

interface BookPreviewProps {
  project: BookProject
  coverImageUrl?: string
  onDownloadPDF: () => void
  onEdit: () => void
  onCoverUpdate?: (imageUrl: string, template?: string, prompt?: string) => void
}

export function BookPreview({
  project,
  coverImageUrl,
  onDownloadPDF,
  onEdit,
  onCoverUpdate,
}: BookPreviewProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('cover')
  const [currentChapter, setCurrentChapter] = useState<number | null>(null)
  const [activeModal, setActiveModal] = useState<ModalType>('none')
  const [localCoverUrl, setLocalCoverUrl] = useState<string | undefined>(coverImageUrl)
  const [showExportMenu, setShowExportMenu] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [activePanel, setActivePanel] = useState<PanelType>('none')

  const handleOpenBook = () => {
    setViewMode('toc')
  }

  const handleCoverSave = (imageUrl: string, template?: string, prompt?: string) => {
    setLocalCoverUrl(imageUrl)
    setActiveModal('none')
    onCoverUpdate?.(imageUrl, template, prompt)
  }

  const handleExportEPUB = async () => {
    setIsExporting(true)
    setShowExportMenu(false)
    try {
      const response = await fetch(`/api/projects/${project.id}/export/epub`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
      if (!response.ok) throw new Error('EPUB 생성 실패')
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${project.title}.epub`
      link.click()
      URL.revokeObjectURL(url)
    } catch (error) {
      alert('EPUB 다운로드에 실패했습니다.')
    } finally {
      setIsExporting(false)
    }
  }

  const handleExportPrintCover = async () => {
    setIsExporting(true)
    setShowExportMenu(false)
    try {
      const response = await fetch(`/api/projects/${project.id}/cover/cmyk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dpi: 300, bleed: 3 }),
      })
      if (!response.ok) throw new Error('인쇄용 표지 생성 실패')
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${project.title}-cover-print.tiff`
      link.click()
      URL.revokeObjectURL(url)
    } catch (error) {
      alert('인쇄용 표지 다운로드에 실패했습니다.')
    } finally {
      setIsExporting(false)
    }
  }

  const handleSelectChapter = (chapterNumber: number) => {
    setCurrentChapter(chapterNumber)
    setViewMode('chapter')
  }

  const handleBackToToc = () => {
    setViewMode('toc')
    setCurrentChapter(null)
  }

  const handlePreviousChapter = () => {
    if (currentChapter && currentChapter > 1) {
      const prevChapter = project.chapters.find((ch) => ch.number === currentChapter - 1)
      if (prevChapter) {
        setCurrentChapter(prevChapter.number)
      }
    }
  }

  const handleNextChapter = () => {
    const maxChapter = Math.max(...project.chapters.map((ch) => ch.number))
    if (currentChapter && currentChapter < maxChapter) {
      const nextChapter = project.chapters.find((ch) => ch.number === currentChapter + 1)
      if (nextChapter) {
        setCurrentChapter(nextChapter.number)
      }
    }
  }

  const selectedChapter = currentChapter
    ? project.chapters.find((ch) => ch.number === currentChapter)
    : null

  const chapterOutline = currentChapter
    ? project.outline?.chapters.find((ch) => ch.number === currentChapter)
    : undefined

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <header className="bg-gray-800/50 border-b border-gray-700 sticky top-0 z-10 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {viewMode !== 'cover' && (
              <button
                onClick={() => setViewMode('cover')}
                className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                표지
              </button>
            )}
            <h1 className="text-xl font-bold text-white">{project.title}</h1>
            <span
              className={`px-2 py-1 rounded-full text-xs ${
                project.status === 'completed'
                  ? 'bg-green-500/20 text-green-400'
                  : 'bg-yellow-500/20 text-yellow-400'
              }`}
            >
              {project.status === 'completed' ? '완료' : '작성 중'}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* 메타데이터 버튼 */}
            <button
              onClick={() => setActiveModal('metadata')}
              className="px-3 py-2 text-gray-400 hover:text-white transition-colors flex items-center gap-1.5 text-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              메타데이터
            </button>

            {/* ISBN 버튼 */}
            <button
              onClick={() => setActiveModal('isbn')}
              className="px-3 py-2 text-gray-400 hover:text-white transition-colors flex items-center gap-1.5 text-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
              </svg>
              ISBN
            </button>

            {/* 표지 디자인 */}
            <button
              onClick={() => setActiveModal('cover')}
              className="px-3 py-2 text-purple-400 hover:text-purple-300 transition-colors flex items-center gap-1.5 text-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              표지
            </button>

            {/* 출처 버튼 */}
            <button
              onClick={() => setActivePanel(activePanel === 'sources' ? 'none' : 'sources')}
              className={`px-3 py-2 transition-colors flex items-center gap-1.5 text-sm ${
                activePanel === 'sources' ? 'text-blue-400' : 'text-gray-400 hover:text-white'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              출처
            </button>

            {/* 메모 버튼 */}
            <button
              onClick={() => setActivePanel(activePanel === 'memos' ? 'none' : 'memos')}
              className={`px-3 py-2 transition-colors flex items-center gap-1.5 text-sm ${
                activePanel === 'memos' ? 'text-yellow-400' : 'text-gray-400 hover:text-white'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              메모
            </button>

            <button
              onClick={onEdit}
              className="px-3 py-2 text-gray-300 hover:text-white transition-colors text-sm"
            >
              편집
            </button>

            {/* 내보내기 드롭다운 */}
            <div className="relative">
              <button
                onClick={() => setShowExportMenu(!showExportMenu)}
                disabled={isExporting}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                {isExporting ? (
                  <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                )}
                내보내기
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {showExportMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50">
                  <button
                    onClick={onDownloadPDF}
                    className="w-full px-4 py-3 text-left text-white hover:bg-gray-700 flex items-center gap-3 rounded-t-lg"
                  >
                    <span className="text-red-400 font-medium">PDF</span>
                    <span className="text-gray-400 text-sm">기본 형식</span>
                  </button>
                  <button
                    onClick={handleExportEPUB}
                    className="w-full px-4 py-3 text-left text-white hover:bg-gray-700 flex items-center gap-3"
                  >
                    <span className="text-green-400 font-medium">EPUB</span>
                    <span className="text-gray-400 text-sm">전자책 / Kindle</span>
                  </button>
                  <div className="border-t border-gray-700" />
                  <button
                    onClick={handleExportPrintCover}
                    className="w-full px-4 py-3 text-left text-white hover:bg-gray-700 flex items-center gap-3 rounded-b-lg"
                  >
                    <span className="text-purple-400 font-medium">CMYK</span>
                    <span className="text-gray-400 text-sm">인쇄용 표지</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="container mx-auto px-4 py-12">
        {viewMode === 'cover' && (
          <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <BookCover
              project={project}
              coverImageUrl={localCoverUrl}
              onClick={handleOpenBook}
            />
          </div>
        )}

        {viewMode === 'toc' && (
          <div className="max-w-2xl mx-auto">
            <TableOfContents
              outline={project.outline}
              chapters={project.chapters}
              currentChapter={currentChapter}
              onSelectChapter={handleSelectChapter}
            />
          </div>
        )}

        {viewMode === 'chapter' && currentChapter && (
          <div className="max-w-4xl mx-auto">
            <ChapterView
              chapter={selectedChapter}
              chapterOutline={chapterOutline}
              chapterNumber={currentChapter}
              totalChapters={project.outline?.chapters.length ?? project.chapters.length}
              onPrevious={currentChapter > 1 ? handlePreviousChapter : undefined}
              onNext={
                currentChapter < (project.outline?.chapters.length ?? project.chapters.length)
                  ? handleNextChapter
                  : undefined
              }
              onBackToToc={handleBackToToc}
            />
          </div>
        )}
      </main>

      {/* Cover Designer Modal */}
      {activeModal === 'cover' && (
        <CoverDesigner
          project={project}
          onSave={handleCoverSave}
          onCancel={() => setActiveModal('none')}
        />
      )}

      {/* Metadata Modal */}
      {activeModal === 'metadata' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-neutral-900 w-full max-w-2xl max-h-[90vh] overflow-auto shadow-2xl rounded-lg">
            <div className="p-6 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
              <h2 className="text-xl font-light text-neutral-900 dark:text-white">
                출판 메타데이터
              </h2>
              <button
                onClick={() => setActiveModal('none')}
                className="w-10 h-10 flex items-center justify-center text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6">
              <MetadataForm
                projectId={project.id}
                onClose={() => setActiveModal('none')}
              />
            </div>
          </div>
        </div>
      )}

      {/* ISBN Modal */}
      {activeModal === 'isbn' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-neutral-900 w-full max-w-md max-h-[90vh] overflow-auto shadow-2xl rounded-lg">
            <div className="p-6 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
              <h2 className="text-xl font-light text-neutral-900 dark:text-white">
                ISBN 관리
              </h2>
              <button
                onClick={() => setActiveModal('none')}
                className="w-10 h-10 flex items-center justify-center text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6">
              <ISBNInput projectId={project.id} />
            </div>
          </div>
        </div>
      )}

      {/* Export menu backdrop */}
      {showExportMenu && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowExportMenu(false)}
        />
      )}

      {/* Sources Panel */}
      <SourcesPanel
        isOpen={activePanel === 'sources'}
        onClose={() => setActivePanel('none')}
      />

      {/* Memo Panel */}
      <MemoPanel
        projectId={project.id}
        isOpen={activePanel === 'memos'}
        onClose={() => setActivePanel('none')}
        currentChapter={currentChapter}
      />
    </div>
  )
}
