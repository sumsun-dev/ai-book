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

      resetSelection()
      return editedText
    } catch (error) {
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
    setEditInstruction,
    handleSelectionChange,
    handleAIEdit,
    resetSelection,
  }
}
