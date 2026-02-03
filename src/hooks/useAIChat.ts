'use client'

import { useState, useCallback, useEffect } from 'react'
import type { ChatMessage, ChatContext } from '@/types/book'

interface UseAIChatProps {
  projectId: string
  chapterId: string | null
}

interface UseAIChatReturn {
  messages: ChatMessage[]
  isLoading: boolean
  sendMessage: (message: string, context: ChatContext) => Promise<void>
  clearMessages: () => Promise<void>
}

export function useAIChat({ projectId, chapterId }: UseAIChatProps): UseAIChatReturn {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)

  // 챕터 변경 시 DB에서 히스토리 로드
  useEffect(() => {
    if (!chapterId) {
      setMessages([])
      return
    }

    const loadHistory = async () => {
      try {
        const response = await fetch(`/api/projects/${projectId}/chapters/${chapterId}/chat?limit=50`)
        if (response.ok) {
          const { data } = await response.json()
          const loadedMessages: ChatMessage[] = data.map((m: { id: string; role: string; content: string; createdAt: string; pageNumber?: number }) => ({
            id: m.id,
            role: m.role as 'user' | 'assistant',
            content: m.content,
            timestamp: new Date(m.createdAt),
            pageNumber: m.pageNumber,
          }))
          setMessages(loadedMessages)
        }
      } catch (error) {
        console.error('채팅 히스토리 로드 실패:', error)
      }
    }

    loadHistory()
  }, [projectId, chapterId])

  const sendMessage = useCallback(async (message: string, context: ChatContext) => {
    if (!chapterId || !message.trim()) return

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: message.trim(),
      timestamp: new Date(),
      chapterNumber: context.chapterNumber,
      pageNumber: context.pageNumber,
    }

    setMessages(prev => [...prev, userMessage])
    setIsLoading(true)

    try {
      const history = messages.slice(-10).map(m => ({
        role: m.role,
        content: m.content,
      }))

      const response = await fetch(`/api/projects/${projectId}/chapters/${chapterId}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: message.trim(),
          context,
          history,
        }),
      })

      if (!response.body) {
        throw new Error('No response body')
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let assistantContent = ''

      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: '',
        timestamp: new Date(),
        chapterNumber: context.chapterNumber,
        pageNumber: context.pageNumber,
      }

      setMessages(prev => [...prev, assistantMessage])

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        assistantContent += decoder.decode(value, { stream: true })

        setMessages(prev =>
          prev.map(m =>
            m.id === assistantMessage.id
              ? { ...m, content: assistantContent }
              : m
          )
        )
      }
    } catch (error) {
      console.error('AI 채팅 실패:', error)

      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: '죄송합니다. 요청을 처리하는 중 오류가 발생했습니다. 다시 시도해주세요.',
        timestamp: new Date(),
        chapterNumber: context.chapterNumber,
        pageNumber: context.pageNumber,
      }

      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }, [projectId, chapterId, messages])

  const clearMessages = useCallback(async () => {
    if (!chapterId) return

    try {
      await fetch(`/api/projects/${projectId}/chapters/${chapterId}/chat`, {
        method: 'DELETE',
      })
    } catch (error) {
      console.error('채팅 히스토리 삭제 실패:', error)
    }

    setMessages([])
  }, [projectId, chapterId])

  return {
    messages,
    isLoading,
    sendMessage,
    clearMessages,
  }
}
