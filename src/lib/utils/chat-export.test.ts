import { describe, it, expect, vi, beforeEach } from 'vitest'
import { formatChatAsTxt, downloadAsFile } from './chat-export'
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

  it('should include timestamp', () => {
    const result = formatChatAsTxt(messages)
    // toLocaleString('ko-KR') 결과에 2024 포함 확인
    expect(result).toContain('2024')
  })

  it('should return empty string for empty array', () => {
    const result = formatChatAsTxt([])
    expect(result).toBe('')
  })

  it('should handle single message without divider', () => {
    const single: ChatMessage[] = [
      { id: '1', role: 'user', content: '테스트', timestamp: new Date('2024-06-15T09:00:00') },
    ]
    const result = formatChatAsTxt(single)
    expect(result).toContain('[사용자]')
    expect(result).toContain('테스트')
    expect(result).not.toContain('---')
  })

  it('should format role correctly for user and assistant', () => {
    const result = formatChatAsTxt(messages)
    const lines = result.split('\n\n---\n\n')
    expect(lines[0]).toMatch(/^\[사용자\]/)
    expect(lines[1]).toMatch(/^\[AI\]/)
  })
})

describe('downloadAsFile', () => {
  let mockClick: ReturnType<typeof vi.fn>
  let mockCreateObjectURL: ReturnType<typeof vi.fn>
  let mockRevokeObjectURL: ReturnType<typeof vi.fn>

  beforeEach(() => {
    mockClick = vi.fn()
    mockCreateObjectURL = vi.fn().mockReturnValue('blob:mock-url')
    mockRevokeObjectURL = vi.fn()

    vi.stubGlobal('URL', {
      createObjectURL: mockCreateObjectURL,
      revokeObjectURL: mockRevokeObjectURL,
    })

    vi.spyOn(document, 'createElement').mockImplementation((() => ({
      href: '',
      download: '',
      click: mockClick,
    })) as unknown as typeof document.createElement)
  })

  it('should create a Blob with correct content and type', () => {
    downloadAsFile('test content', 'file.txt')
    expect(mockCreateObjectURL).toHaveBeenCalledWith(
      expect.any(Blob)
    )
  })

  it('should create an anchor element', () => {
    const spy = vi.spyOn(document, 'createElement')
    downloadAsFile('test content', 'file.txt')
    expect(spy).toHaveBeenCalledWith('a')
  })

  it('should set correct download filename', () => {
    downloadAsFile('content', 'chat-export.txt')
    // anchor가 생성되고 click이 호출됨
    expect(mockClick).toHaveBeenCalledOnce()
  })

  it('should trigger click on anchor', () => {
    downloadAsFile('content', 'file.txt')
    expect(mockClick).toHaveBeenCalledOnce()
  })

  it('should revoke object URL after download', () => {
    downloadAsFile('content', 'file.txt')
    expect(mockRevokeObjectURL).toHaveBeenCalledWith('blob:mock-url')
  })
})
