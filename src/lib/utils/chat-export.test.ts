import { describe, it, expect } from 'vitest'
import { formatChatAsTxt } from './chat-export'
import type { ChatMessage } from '@/types/book'

describe('formatChatAsTxt', () => {
  const messages: ChatMessage[] = [
    {
      id: '1',
      role: 'user',
      content: '안녕하세요',
      timestamp: new Date('2024-01-01T12:00:00'),
    },
    {
      id: '2',
      role: 'assistant',
      content: '안녕하세요! 어떻게 도와드릴까요?',
      timestamp: new Date('2024-01-01T12:01:00'),
    },
  ]

  it('should format messages with role labels', () => {
    const result = formatChatAsTxt(messages)
    expect(result).toContain('[사용자]')
    expect(result).toContain('[AI]')
  })

  it('should include message content', () => {
    const result = formatChatAsTxt(messages)
    expect(result).toContain('안녕하세요')
    expect(result).toContain('어떻게 도와드릴까요?')
  })

  it('should separate messages with divider', () => {
    const result = formatChatAsTxt(messages)
    expect(result).toContain('---')
  })
})
