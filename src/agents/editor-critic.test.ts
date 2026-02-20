import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/claude', () => ({
  runAgent: vi.fn(),
}))

import {
  runEditorCriticAgent,
  runEditorCriticLoop,
  runSinglePassEditorCritic,
} from './editor-critic'
import { runAgent } from '@/lib/claude'

const mockRunAgent = vi.mocked(runAgent)

const mockUsage = { inputTokens: 0, outputTokens: 0 }

function createMockEditorCriticResponse(
  decision: 'pass' | 'revise' = 'pass',
  overallScore = 8
) {
  return JSON.stringify({
    editedContent: '교정된 내용',
    grammarCheck: {
      totalErrors: 2,
      errorsByCategory: {
        spelling: 1,
        grammar: 1,
        punctuation: 0,
        word_choice: 0,
        sentence_flow: 0,
        style: 0,
      },
      corrections: [
        {
          location: '1문단',
          original: '오류',
          corrected: '수정',
          category: 'spelling',
          severity: 'minor',
          reason: '맞춤법',
        },
      ],
    },
    qualityEvaluation: {
      decision,
      overallScore,
      scores: {
        grammar: overallScore,
        clarity: overallScore,
        coherence: overallScore,
        engagement: overallScore,
        targetFit: overallScore,
      },
      strengths: ['좋은 구성'],
      weaknesses: decision === 'revise' ? ['개선 필요'] : [],
      priorityRevisions: decision === 'revise' ? ['수정 사항'] : [],
    },
  })
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('runEditorCriticAgent', () => {
  it('JSON 응답을 파싱한다', async () => {
    mockRunAgent.mockResolvedValue({ text: createMockEditorCriticResponse(), usage: mockUsage })

    const result = await runEditorCriticAgent('내용', '제목', '독자', '톤')

    expect(result.editedContent).toBe('교정된 내용')
    expect(result.grammarCheck.totalErrors).toBe(2)
    expect(result.qualityEvaluation.decision).toBe('pass')
    expect(result.qualityEvaluation.overallScore).toBe(8)
  })

  it('코드 블록 안의 JSON을 파싱한다', async () => {
    const json = createMockEditorCriticResponse()
    mockRunAgent.mockResolvedValue({ text: `\`\`\`json\n${json}\n\`\`\``, usage: mockUsage })

    const result = await runEditorCriticAgent('내용', '제목', '독자', '톤')
    expect(result.editedContent).toBe('교정된 내용')
  })

  it('파싱 실패 시 기본 결과를 반환한다', async () => {
    mockRunAgent.mockResolvedValue({ text: '파싱 불가 텍스트', usage: mockUsage })

    const result = await runEditorCriticAgent('원본 내용', '제목', '독자', '톤')

    expect(result.editedContent).toBe('원본 내용')
    expect(result.grammarCheck.totalErrors).toBe(0)
    expect(result.qualityEvaluation.decision).toBe('pass')
    expect(result.qualityEvaluation.overallScore).toBe(7)
  })

  it('부분적 응답에 기본값을 채운다', async () => {
    mockRunAgent.mockResolvedValue({
      text: JSON.stringify({ editedContent: '내용만 있음' }),
      usage: mockUsage,
    })

    const result = await runEditorCriticAgent('내용', '제목', '독자', '톤')
    expect(result.editedContent).toBe('내용만 있음')
    expect(result.grammarCheck.totalErrors).toBe(0)
    expect(result.qualityEvaluation.overallScore).toBe(5)
  })
})

describe('runEditorCriticLoop', () => {
  it('첫 반복에서 pass하면 즉시 반환한다', async () => {
    mockRunAgent.mockResolvedValue({ text: createMockEditorCriticResponse('pass', 8), usage: mockUsage })

    const result = await runEditorCriticLoop('내용', '제목', '독자', '톤')

    expect(result.iterationCount).toBe(1)
    expect(result.finalStatus).toBe('passed')
    expect(mockRunAgent).toHaveBeenCalledTimes(1)
  })

  it('revise 후 최대 반복에 도달하면 max_iterations_reached를 반환한다', async () => {
    mockRunAgent.mockResolvedValue({
      text: createMockEditorCriticResponse('revise', 5),
      usage: mockUsage,
    })

    const result = await runEditorCriticLoop('내용', '제목', '독자', '톤', {
      maxIterations: 2,
    })

    expect(result.finalStatus).toBe('max_iterations_reached')
    expect(result.iterationCount).toBe(2)
    // editorCritic 2번 + revision 1번(마지막 반복에서는 revision 안함) = 3번
    expect(mockRunAgent).toHaveBeenCalledTimes(3)
  })

  it('onIteration 콜백을 호출한다', async () => {
    mockRunAgent.mockResolvedValue({ text: createMockEditorCriticResponse('pass', 8), usage: mockUsage })
    const onIteration = vi.fn()

    await runEditorCriticLoop('내용', '제목', '독자', '톤', { onIteration })

    expect(onIteration).toHaveBeenCalledWith(1, expect.objectContaining({
      iterationCount: 1,
    }))
  })

  it('기본 maxIterations는 3이다', async () => {
    mockRunAgent.mockResolvedValue({
      text: createMockEditorCriticResponse('revise', 5),
      usage: mockUsage,
    })

    const result = await runEditorCriticLoop('내용', '제목', '독자', '톤')

    expect(result.iterationCount).toBe(3)
  })

  it('passThreshold를 커스터마이즈할 수 있다', async () => {
    // score 8이지만 threshold 9이므로 pass 안됨
    mockRunAgent.mockResolvedValue({
      text: createMockEditorCriticResponse('pass', 8),
      usage: mockUsage,
    })

    const result = await runEditorCriticLoop('내용', '제목', '독자', '톤', {
      maxIterations: 1,
      passThreshold: 9,
    })

    expect(result.finalStatus).toBe('max_iterations_reached')
  })

  it('두 번째 반복에서 pass하면 종료한다', async () => {
    mockRunAgent
      .mockResolvedValueOnce({ text: createMockEditorCriticResponse('revise', 5), usage: mockUsage })
      .mockResolvedValueOnce({ text: '수정된 내용', usage: mockUsage }) // revision
      .mockResolvedValueOnce({ text: createMockEditorCriticResponse('pass', 8), usage: mockUsage })

    const result = await runEditorCriticLoop('내용', '제목', '독자', '톤')

    expect(result.iterationCount).toBe(2)
    expect(result.finalStatus).toBe('passed')
  })
})

describe('runSinglePassEditorCritic', () => {
  it('단일 패스를 실행하고 single_pass 상태를 반환한다', async () => {
    mockRunAgent.mockResolvedValue({ text: createMockEditorCriticResponse('pass', 8), usage: mockUsage })

    const result = await runSinglePassEditorCritic('내용', '제목', '독자', '톤')

    expect(result.iterationCount).toBe(1)
    expect(result.finalStatus).toBe('single_pass')
    expect(result.editedContent).toBe('교정된 내용')
  })

  it('파싱 실패 시에도 single_pass 상태를 반환한다', async () => {
    mockRunAgent.mockResolvedValue({ text: '파싱 불가', usage: mockUsage })

    const result = await runSinglePassEditorCritic('원본', '제목', '독자', '톤')

    expect(result.finalStatus).toBe('single_pass')
    expect(result.editedContent).toBe('원본')
  })
})
