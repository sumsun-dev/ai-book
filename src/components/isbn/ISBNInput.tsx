'use client'

import { useState, useEffect, useCallback } from 'react'
import { ISBNData, ISBNStatus } from '@/types/book'
import { formatISBN, validateAndParseISBN, generateDraftISBN } from '@/lib/isbn'
import { generateBarcodeDataURL, downloadBarcode } from '@/lib/barcode'
import ISBNAgencyGuide from './ISBNAgencyGuide'
import ISBNStatusTracker from './ISBNStatusTracker'

interface ISBNInputProps {
  projectId: string
  onSave?: (isbn: ISBNData) => void
}

export default function ISBNInput({ projectId, onSave }: ISBNInputProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isbn, setIsbn] = useState('')
  const [savedISBN, setSavedISBN] = useState<ISBNData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [validationResult, setValidationResult] = useState<{
    isValid: boolean
    formatted?: string
    error?: string
  } | null>(null)
  const [barcodeDataUrl, setBarcodeDataUrl] = useState<string | null>(null)

  const loadISBN = useCallback(async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}/isbn`)
      const { data } = await res.json()
      if (data) {
        setSavedISBN(data)
        setIsbn(formatISBN(data.isbn13))
        generateBarcode(data.isbn13)
      }
    } catch {
      // ISBN이 없는 경우 무시
    } finally {
      setIsLoading(false)
    }
  }, [projectId])

  useEffect(() => {
    loadISBN()
  }, [loadISBN])

  const generateBarcode = (isbnValue: string) => {
    try {
      const dataUrl = generateBarcodeDataURL(isbnValue)
      setBarcodeDataUrl(dataUrl)
    } catch {
      setBarcodeDataUrl(null)
    }
  }

  const handleInputChange = (value: string) => {
    setIsbn(value)
    setError(null)

    // 하이픈 제거 후 길이 확인
    const normalized = value.replace(/\D/g, '')
    if (normalized.length === 10 || normalized.length === 13) {
      const result = validateAndParseISBN(normalized)
      setValidationResult({
        isValid: result.isValid,
        formatted: result.isbn13 ? formatISBN(result.isbn13) : undefined,
        error: result.error,
      })
      if (result.isValid && result.isbn13) {
        generateBarcode(result.isbn13)
      }
    } else {
      setValidationResult(null)
      setBarcodeDataUrl(null)
    }
  }

  const handleSave = async () => {
    if (!validationResult?.isValid) {
      setError('유효한 ISBN을 입력해주세요.')
      return
    }

    setIsSaving(true)
    setError(null)

    try {
      const res = await fetch(`/api/projects/${projectId}/isbn`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isbn: isbn.replace(/\D/g, ''),
          barcodeUrl: barcodeDataUrl,
        }),
      })

      if (!res.ok) {
        const { error } = await res.json()
        throw new Error(error)
      }

      const { data } = await res.json()
      setSavedISBN(data)
      onSave?.(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : '저장에 실패했습니다.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleGenerateDraft = () => {
    const draftISBN = generateDraftISBN()
    setIsbn(formatISBN(draftISBN))
    handleInputChange(draftISBN)
  }

  const handleDownloadBarcode = () => {
    if (savedISBN?.isbn13) {
      downloadBarcode(savedISBN.isbn13)
    }
  }

  const handleDelete = async () => {
    if (!savedISBN || !confirm('ISBN을 삭제하시겠습니까?')) return

    try {
      await fetch(`/api/projects/${projectId}/isbn`, { method: 'DELETE' })
      setSavedISBN(null)
      setIsbn('')
      setBarcodeDataUrl(null)
      setValidationResult(null)
    } catch {
      setError('삭제에 실패했습니다.')
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <svg className="w-5 h-5 animate-spin text-neutral-400" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
          ISBN
        </h3>
        <button
          type="button"
          onClick={handleGenerateDraft}
          className="text-xs text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300"
        >
          테스트용 ISBN 생성
        </button>
      </div>

      {error && (
        <div className="p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-xs">
          {error}
        </div>
      )}

      <div className="flex gap-2">
        <div className="flex-1 relative">
          <input
            type="text"
            value={isbn}
            onChange={(e) => handleInputChange(e.target.value)}
            placeholder="978-89-xxxxx-xx-x"
            className={`
              w-full px-3 py-2 text-sm font-mono border bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none
              ${validationResult?.isValid
                ? 'border-emerald-400 dark:border-emerald-600'
                : validationResult?.error
                  ? 'border-red-400 dark:border-red-600'
                  : 'border-neutral-300 dark:border-neutral-600 focus:border-neutral-500'
              }
            `}
          />
          {validationResult && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2">
              {validationResult.isValid ? (
                <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-4 h-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving || !validationResult?.isValid}
          className="px-4 py-2 text-sm bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 hover:bg-neutral-700 dark:hover:bg-neutral-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isSaving ? '저장 중...' : '저장'}
        </button>
      </div>

      {validationResult?.error && (
        <p className="text-xs text-red-500 dark:text-red-400">{validationResult.error}</p>
      )}

      {validationResult?.isValid && validationResult?.formatted && (
        <p className="text-xs text-emerald-600 dark:text-emerald-400">
          포맷: {validationResult.formatted}
        </p>
      )}

      {/* 바코드 미리보기 */}
      {barcodeDataUrl && (
        <div className="mt-4 p-4 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-neutral-500 dark:text-neutral-400">바코드 미리보기</span>
            <div className="flex gap-2">
              {savedISBN && (
                <>
                  <button
                    type="button"
                    onClick={handleDownloadBarcode}
                    className="text-xs text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
                  >
                    다운로드
                  </button>
                  <button
                    type="button"
                    onClick={handleDelete}
                    className="text-xs text-red-500 hover:text-red-700"
                  >
                    삭제
                  </button>
                </>
              )}
            </div>
          </div>
          <div className="flex justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={barcodeDataUrl} alt="ISBN Barcode" className="max-w-full" />
          </div>
        </div>
      )}

      {/* 저장된 ISBN 정보 */}
      {savedISBN && (
        <div className="mt-4 p-3 bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-700 text-xs">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <span className="text-neutral-500 dark:text-neutral-400">ISBN-13:</span>
              <span className="ml-2 font-mono text-neutral-900 dark:text-white">
                {formatISBN(savedISBN.isbn13)}
              </span>
            </div>
            {savedISBN.isbn10 && (
              <div>
                <span className="text-neutral-500 dark:text-neutral-400">ISBN-10:</span>
                <span className="ml-2 font-mono text-neutral-900 dark:text-white">
                  {savedISBN.isbn10}
                </span>
              </div>
            )}
            <div>
              <span className="text-neutral-500 dark:text-neutral-400">등록일:</span>
              <span className="ml-2 text-neutral-900 dark:text-white">
                {savedISBN.assignedAt
                  ? new Date(savedISBN.assignedAt).toLocaleDateString('ko-KR')
                  : '-'
                }
              </span>
            </div>
            <div>
              <span className="text-neutral-500 dark:text-neutral-400">상태:</span>
              <span className={`ml-2 ${savedISBN.isValid ? 'text-emerald-600' : 'text-red-600'}`}>
                {savedISBN.isValid ? '유효' : '미확인'}
              </span>
            </div>
          </div>

          {/* ISBN 상태 트래커 */}
          <ISBNStatusTracker
            projectId={projectId}
            currentStatus={savedISBN.status || 'draft'}
            appliedAt={savedISBN.appliedAt}
            issuedAt={savedISBN.issuedAt}
            onStatusChange={(status: ISBNStatus) => {
              setSavedISBN({ ...savedISBN, status })
            }}
          />
        </div>
      )}

      {/* ISBN 신청 가이드 */}
      <ISBNAgencyGuide />
    </div>
  )
}
