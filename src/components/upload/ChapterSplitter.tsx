'use client'

import { useState, useMemo, useCallback } from 'react'
import { PlusIcon, XMarkIcon, CheckIcon, ArrowPathIcon } from '@heroicons/react/24/outline'
import type { ChapterBoundary, SplitChapter, ParsedFile } from '@/types/book'

interface ChapterSplitterProps {
  parsedFile: ParsedFile
  onConfirm: (chapters: SplitChapter[]) => void
  onCancel: () => void
  isProcessing?: boolean
}

export default function ChapterSplitter({
  parsedFile,
  onConfirm,
  onCancel,
  isProcessing = false
}: ChapterSplitterProps) {
  const lines = useMemo(() => parsedFile.content.split('\n'), [parsedFile.content])
  const [boundaries, setBoundaries] = useState<ChapterBoundary[]>([
    { startLine: 0, endLine: lines.length - 1, title: '챕터 1' }
  ])
  const [selectedBoundary, setSelectedBoundary] = useState<number>(0)

  const addBoundary = (lineIndex: number) => {
    const currentBoundaryIndex = boundaries.findIndex(
      (b) => lineIndex >= b.startLine && lineIndex <= b.endLine
    )

    if (currentBoundaryIndex === -1) return

    const current = boundaries[currentBoundaryIndex]

    if (lineIndex === current.startLine) return

    const newBoundaries = [...boundaries]
    newBoundaries[currentBoundaryIndex] = {
      ...current,
      endLine: lineIndex - 1
    }

    const newChapterNum = currentBoundaryIndex + 2
    newBoundaries.splice(currentBoundaryIndex + 1, 0, {
      startLine: lineIndex,
      endLine: current.endLine,
      title: `챕터 ${newChapterNum}`
    })

    for (let i = currentBoundaryIndex + 2; i < newBoundaries.length; i++) {
      const num = i + 1
      if (newBoundaries[i].title.startsWith('챕터 ')) {
        newBoundaries[i] = { ...newBoundaries[i], title: `챕터 ${num}` }
      }
    }

    setBoundaries(newBoundaries)
    setSelectedBoundary(currentBoundaryIndex + 1)
  }

  const removeBoundary = (index: number) => {
    if (boundaries.length <= 1 || index === 0) return

    const newBoundaries = [...boundaries]
    const removed = newBoundaries[index]
    newBoundaries[index - 1] = {
      ...newBoundaries[index - 1],
      endLine: removed.endLine
    }
    newBoundaries.splice(index, 1)

    for (let i = index; i < newBoundaries.length; i++) {
      const num = i + 1
      if (newBoundaries[i].title.startsWith('챕터 ')) {
        newBoundaries[i] = { ...newBoundaries[i], title: `챕터 ${num}` }
      }
    }

    setBoundaries(newBoundaries)
    setSelectedBoundary(Math.min(index - 1, newBoundaries.length - 1))
  }

  const updateTitle = (index: number, title: string) => {
    const newBoundaries = [...boundaries]
    newBoundaries[index] = { ...newBoundaries[index], title }
    setBoundaries(newBoundaries)
  }

  const handleLineClick = (lineIndex: number) => {
    addBoundary(lineIndex)
  }

  const handleConfirm = () => {
    const chapters: SplitChapter[] = boundaries.map((boundary, index) => ({
      number: index + 1,
      title: boundary.title,
      content: lines.slice(boundary.startLine, boundary.endLine + 1).join('\n')
    }))
    onConfirm(chapters)
  }

  const getLineChapterIndex = useCallback((lineIndex: number): number => {
    return boundaries.findIndex(
      (b) => lineIndex >= b.startLine && lineIndex <= b.endLine
    )
  }, [boundaries])

  const isChapterStart = useCallback((lineIndex: number): boolean => {
    return boundaries.some((b) => b.startLine === lineIndex)
  }, [boundaries])

  const visibleLines = useMemo(() => {
    const selected = boundaries[selectedBoundary]
    if (!selected) return []

    const start = Math.max(0, selected.startLine - 5)
    const end = Math.min(lines.length - 1, selected.endLine + 5)

    return lines.slice(start, end + 1).map((line, i) => ({
      index: start + i,
      text: line
    }))
  }, [boundaries, selectedBoundary, lines])

  return (
    <div className="flex flex-col h-full max-h-[80vh]">
      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          챕터 분할
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          텍스트를 클릭하여 챕터 경계를 지정하세요. 총 {lines.length}줄
        </p>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="w-64 border-r border-gray-200 dark:border-gray-700 overflow-y-auto">
          <div className="p-3 space-y-2">
            {boundaries.map((boundary, index) => (
              <div
                key={index}
                onClick={() => setSelectedBoundary(index)}
                className={`
                  p-3 rounded-lg cursor-pointer transition-colors
                  ${selectedBoundary === index
                    ? 'bg-blue-100 dark:bg-blue-900/30 border border-blue-300 dark:border-blue-700'
                    : 'bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }
                `}
              >
                <div className="flex items-center justify-between mb-1">
                  <input
                    type="text"
                    value={boundary.title}
                    onChange={(e) => updateTitle(index, e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    className="flex-1 bg-transparent text-sm font-medium text-gray-900 dark:text-white focus:outline-none"
                    placeholder="챕터 제목"
                  />
                  {index > 0 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        removeBoundary(index)
                      }}
                      className="ml-2 p-1 text-gray-400 hover:text-red-500"
                    >
                      <XMarkIcon className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {boundary.startLine + 1}~{boundary.endLine + 1}줄 ({boundary.endLine - boundary.startLine + 1}줄)
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 bg-gray-50 dark:bg-gray-900">
          <div className="font-mono text-sm space-y-0.5">
            {visibleLines.map(({ index, text }) => {
              const chapterIndex = getLineChapterIndex(index)
              const isStart = isChapterStart(index)
              const isSelected = chapterIndex === selectedBoundary

              return (
                <div
                  key={index}
                  onClick={() => handleLineClick(index)}
                  className={`
                    flex items-start gap-2 px-2 py-0.5 rounded cursor-pointer transition-colors
                    ${isStart ? 'border-t-2 border-blue-400 pt-2 mt-2' : ''}
                    ${isSelected
                      ? 'bg-blue-50 dark:bg-blue-900/20'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                    }
                  `}
                >
                  <span className="w-12 text-right text-gray-400 dark:text-gray-600 select-none shrink-0">
                    {index + 1}
                  </span>
                  <span className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap break-all">
                    {text || '\u00A0'}
                  </span>
                  {!isStart && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        addBoundary(index)
                      }}
                      className="opacity-0 group-hover:opacity-100 ml-auto p-1 text-blue-500 hover:text-blue-600"
                      title="여기서 챕터 분할"
                    >
                      <PlusIcon className="w-4 h-4" />
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {boundaries.length}개 챕터로 분할됨
        </p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={isProcessing}
            className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white disabled:opacity-50"
          >
            취소
          </button>
          <button
            onClick={handleConfirm}
            disabled={isProcessing}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProcessing ? (
              <>
                <ArrowPathIcon className="w-4 h-4 animate-spin" />
                처리 중...
              </>
            ) : (
              <>
                <CheckIcon className="w-4 h-4" />
                확인
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
