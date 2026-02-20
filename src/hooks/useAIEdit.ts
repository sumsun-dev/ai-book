'use client'

import { useState, useCallback } from 'react'

interface SelectionRange {
  from: number
  to: number
}

interface UseAIEditProps {
  projectId: string
  chapterId: string | null
}

interface UseAIEditReturn {
  selectedText: string
  selectionRange: SelectionRange | null
  isEditing: boolean
  editInstruction: string
  editError: string | null
  setEditInstruction: (instruction: string) => void
  handleSelectionChange: (text: string, range: SelectionRange | null) => void
  handleAIEdit: (context: string) => Promise<string | null>
  resetSelection: () => void
}

export function useAIEdit({ projectId, chapterId }: UseAIEditProps): UseAIEditReturn {
  const [selectedText, setSelectedText] = useState('')
  const [selectionRange, setSelectionRange] = useState<SelectionRange | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editInstruction, setEditInstruction] = useState('')
  const [editError, setEditError] = useState<string | null>(null)

  const handleSelectionChange = useCallback((text: string, range: SelectionRange | null) => {
    setSelectedText(text)
    setSelectionRange(range)
  }, [])

  const resetSelection = useCallback(() => {
    setSelectedText('')
    setSelectionRange(null)
    setEditInstruction('')
  }, [])

  const handleAIEdit = useCallback(async (context: string): Promise<string | null> => {
    if (!selectedText || !editInstruction || !chapterId || !selectionRange) {
      return null
    }

    setIsEditing(true)
    setEditError(null)

    try {
      const response = await fetch(`/api/projects/${projectId}/chapters/${chapterId}/edit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          selectedText,
          instruction: editInstruction,
          context,
        }),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(
          data.error || (response.status === 429
            ? '이번 달 AI 사용량 한도에 도달했습니다.'
            : 'AI 수정 요청에 실패했습니다.')
        )
      }

      if (!response.body) {
        throw new Error('No response body')
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let editedText = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        editedText += decoder.decode(value, { stream: true })
      }

      window.dispatchEvent(new CustomEvent('quota-updated'))
      resetSelection()
      return editedText
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'AI 수정 요청에 실패했습니다.'
      setEditError(msg)
      console.error('AI 수정 실패:', error)
      return null
    } finally {
      setIsEditing(false)
    }
  }, [selectedText, editInstruction, chapterId, selectionRange, projectId, resetSelection])

  return {
    selectedText,
    selectionRange,
    isEditing,
    editInstruction,
    editError,
    setEditInstruction,
    handleSelectionChange,
    handleAIEdit,
    resetSelection,
  }
}
