'use client'

import { useState, useRef, useCallback } from 'react'
import { DocumentArrowUpIcon } from '@heroicons/react/24/outline'
import type { ParsedFile } from '@/types/book'

interface FileUploaderProps {
  onFileLoaded: (file: ParsedFile) => void
  onCancel?: () => void
  isLoading?: boolean
}

export default function FileUploader({
  onFileLoaded,
  onCancel,
  isLoading = false
}: FileUploaderProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const validateFile = (file: File): string | null => {
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      return '파일 크기가 10MB를 초과합니다.'
    }

    const extension = file.name.split('.').pop()?.toLowerCase()
    if (!extension || !['txt', 'docx', 'pdf'].includes(extension)) {
      return '지원하지 않는 파일 형식입니다. (txt, docx, pdf만 지원)'
    }

    return null
  }

  const handleUpload = async (file: File) => {
    const validationError = validateFile(file)
    if (validationError) {
      setError(validationError)
      return
    }

    setError(null)
    setUploading(true)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      })

      const result = await response.json()

      if (!result.success) {
        setError(result.error || '파일 업로드에 실패했습니다.')
        return
      }

      onFileLoaded(result.data)
    } catch {
      setError('파일 업로드 중 오류가 발생했습니다.')
    } finally {
      setUploading(false)
    }
  }

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    const files = e.dataTransfer.files
    if (files.length > 0) {
      handleUpload(files[0])
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleUpload(files[0])
    }
  }

  const handleClick = () => {
    fileInputRef.current?.click()
  }

  const isProcessing = uploading || isLoading

  return (
    <div className="w-full">
      <div
        onClick={!isProcessing ? handleClick : undefined}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={!isProcessing ? handleDrop : undefined}
        className={`
          relative border-2 border-dashed rounded-lg p-8 text-center transition-colors
          ${isProcessing ? 'cursor-wait' : 'cursor-pointer'}
          ${isDragging
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
            : 'border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500'
          }
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".txt,.docx,.pdf"
          onChange={handleFileSelect}
          className="hidden"
          disabled={isProcessing}
        />

        <div className="flex flex-col items-center gap-3">
          <DocumentArrowUpIcon className={`w-12 h-12 ${isDragging ? 'text-blue-500' : 'text-gray-400'}`} />

          {isProcessing ? (
            <div className="flex flex-col items-center gap-2">
              <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-500 border-t-transparent" />
              <p className="text-gray-600 dark:text-gray-300">파일 처리 중...</p>
            </div>
          ) : (
            <>
              <div>
                <p className="text-gray-700 dark:text-gray-200 font-medium">
                  파일을 드래그하거나 클릭하여 업로드
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  .txt, .docx, .pdf (최대 10MB)
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      {error && (
        <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {onCancel && (
        <div className="mt-4 flex justify-end">
          <button
            onClick={onCancel}
            disabled={isProcessing}
            className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white"
          >
            취소
          </button>
        </div>
      )}
    </div>
  )
}
