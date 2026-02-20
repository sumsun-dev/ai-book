'use client'

import { useState, useCallback, useRef } from 'react'
import type { BookOutline, ChapterOutline, BookType } from '@/types/book'
import { parseAgentPhase, type AgentPhase } from '@/lib/utils/progress-calculator'

interface StreamingState {
  isStreaming: boolean
  currentChapter: number | null
  streamedText: string
  error: string | null
  agentPhase: AgentPhase
}

interface UseStreamingGenerationReturn extends StreamingState {
  startStreaming: (
    bookType: BookType,
    outline: BookOutline,
    chapter: ChapterOutline
  ) => Promise<string>
  stopStreaming: () => void
  resetStreaming: () => void
}

export function useStreamingGeneration(): UseStreamingGenerationReturn {
  const [state, setState] = useState<StreamingState>({
    isStreaming: false,
    currentChapter: null,
    streamedText: '',
    error: null,
    agentPhase: 'idle',
  })

  const abortControllerRef = useRef<AbortController | null>(null)

  const resetStreaming = useCallback(() => {
    setState({
      isStreaming: false,
      currentChapter: null,
      streamedText: '',
      error: null,
      agentPhase: 'idle',
    })
  }, [])

  const stopStreaming = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }
    setState((prev) => ({ ...prev, isStreaming: false }))
  }, [])

  const startStreaming = useCallback(
    async (
      bookType: BookType,
      outline: BookOutline,
      chapter: ChapterOutline
    ): Promise<string> => {
      abortControllerRef.current = new AbortController()

      setState({
        isStreaming: true,
        currentChapter: chapter.number,
        streamedText: '',
        error: null,
        agentPhase: 'start',
      })

      try {
        const response = await fetch('/api/stream', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            phase: 'write',
            bookType,
            outline,
            chapter,
          }),
          signal: abortControllerRef.current.signal,
        })

        if (!response.ok) {
          const data = await response.json().catch(() => ({}))
          throw new Error(
            data.error || (response.status === 429
              ? '이번 달 AI 사용량 한도에 도달했습니다.'
              : '스트리밍 요청에 실패했습니다.')
          )
        }

        const reader = response.body?.getReader()
        if (!reader) {
          throw new Error('응답 스트림을 읽을 수 없습니다.')
        }

        const decoder = new TextDecoder()
        let fullContent = ''
        let buffer = ''

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          buffer = lines.pop() || ''

          for (const line of lines) {
            if (line.startsWith('event: ')) {
              const phase = parseAgentPhase(line)
              if (phase) {
                setState((prev) => ({ ...prev, agentPhase: phase }))
              }
              continue
            }
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6))

                if (data.text) {
                  fullContent += data.text
                  setState((prev) => ({
                    ...prev,
                    streamedText: fullContent,
                  }))
                }

                if (data.content) {
                  fullContent = data.content
                }

                if (data.error) {
                  throw new Error(data.error)
                }
              } catch (parseError) {
                if (parseError instanceof SyntaxError) {
                  continue
                }
                throw parseError
              }
            }
          }
        }

        setState((prev) => ({
          ...prev,
          isStreaming: false,
          streamedText: fullContent,
        }))

        window.dispatchEvent(new CustomEvent('quota-updated'))
        return fullContent
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          setState((prev) => ({ ...prev, isStreaming: false }))
          return state.streamedText
        }

        const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류'
        setState((prev) => ({
          ...prev,
          isStreaming: false,
          error: errorMessage,
        }))
        throw error
      } finally {
        abortControllerRef.current = null
      }
    },
    [state.streamedText]
  )

  return {
    ...state,
    startStreaming,
    stopStreaming,
    resetStreaming,
  }
}
