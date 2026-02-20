import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/claude', () => ({
  runAgent: vi.fn(),
}))

import { runEditorAgent } from './editor'
import { runAgent } from '@/lib/claude'

const mockRunAgent = vi.mocked(runAgent)

const mockUsage = { inputTokens: 0, outputTokens: 0 }

beforeEach(() => {
  vi.clearAllMocks()
})

describe('runEditorAgent', () => {
  it('JSON 응답을 파싱한다', async () => {
    mockRunAgent.mockResolvedValue({
      text: JSON.stringify({
        editedContent: '교정된 내용',
        changes: ['변경 1'],
        suggestions: ['제안 1'],
      }),
      usage: mockUsage,
    })

    const result = await runEditorAgent('원본 내용', '챕터 1', '전문적')

    expect(result.editedContent).toBe('교정된 내용')
    expect(result.changes).toEqual(['변경 1'])
    expect(result.suggestions).toEqual(['제안 1'])
  })

  it('코드 블록 안의 JSON을 파싱한다', async () => {
    mockRunAgent.mockResolvedValue({
      text: '```json\n{"editedContent":"ok","changes":[],"suggestions":[]}\n```',
      usage: mockUsage,
    })

    const result = await runEditorAgent('내용', '제목', '톤')
    expect(result.editedContent).toBe('ok')
  })

  it('파싱 실패 시 fallback을 반환한다', async () => {
    mockRunAgent.mockResolvedValue({ text: '파싱 불가 텍스트', usage: mockUsage })

    const result = await runEditorAgent('원본', '제목', '톤')

    expect(result.editedContent).toBe('원본')
    expect(result.changes).toEqual([])
    expect(result.suggestions).toEqual(['파싱 불가 텍스트'])
  })

  it('챕터 제목과 톤을 프롬프트에 포함한다', async () => {
    mockRunAgent.mockResolvedValue({ text: '{"editedContent":"","changes":[],"suggestions":[]}', usage: mockUsage })

    await runEditorAgent('내용', '1장: 시작', '친근한')

    expect(mockRunAgent).toHaveBeenCalledWith(
      expect.any(Object),
      expect.stringContaining('1장: 시작')
    )
    expect(mockRunAgent).toHaveBeenCalledWith(
      expect.any(Object),
      expect.stringContaining('친근한')
    )
  })
})
