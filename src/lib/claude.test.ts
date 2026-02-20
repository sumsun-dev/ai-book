import { describe, it, expect, vi, beforeEach } from 'vitest'

const { mockCreate, mockStream } = vi.hoisted(() => ({
  mockCreate: vi.fn(),
  mockStream: vi.fn(),
}))

vi.mock('@anthropic-ai/sdk', () => {
  return {
    default: class MockAnthropic {
      messages = {
        create: mockCreate,
        stream: mockStream,
      }
    },
  }
})

import { runAgent, streamAgent, streamAgentWithHistory, withRetry } from './claude'
import type { AgentConfig } from './claude'

const testConfig: AgentConfig = {
  name: 'Test Agent',
  systemPrompt: 'You are a test agent.',
  temperature: 0.5,
  maxTokens: 1000,
}

describe('runAgent', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('AgentResult를 반환한다 (text + usage)', async () => {
    mockCreate.mockResolvedValue({
      content: [{ type: 'text', text: 'Hello response' }],
      usage: { input_tokens: 100, output_tokens: 50 },
    })

    const result = await runAgent(testConfig, 'Hello')
    expect(result.text).toBe('Hello response')
    expect(result.usage).toEqual({ inputTokens: 100, outputTokens: 50 })
  })

  it('텍스트 블록이 없으면 빈 문자열을 반환한다', async () => {
    mockCreate.mockResolvedValue({
      content: [{ type: 'tool_use', id: '1', name: 'test', input: {} }],
      usage: { input_tokens: 50, output_tokens: 0 },
    })

    const result = await runAgent(testConfig, 'Hello')
    expect(result.text).toBe('')
  })

  it('context가 있으면 systemPrompt에 추가한다', async () => {
    mockCreate.mockResolvedValue({
      content: [{ type: 'text', text: 'ok' }],
      usage: { input_tokens: 10, output_tokens: 5 },
    })

    await runAgent(testConfig, 'Hello', 'some context')
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        system: expect.stringContaining('some context'),
      })
    )
  })

  it('기본 maxTokens와 temperature를 사용한다', async () => {
    mockCreate.mockResolvedValue({
      content: [{ type: 'text', text: 'ok' }],
      usage: { input_tokens: 10, output_tokens: 5 },
    })

    const minConfig: AgentConfig = {
      name: 'Min',
      systemPrompt: 'test',
    }
    await runAgent(minConfig, 'Hello')
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        max_tokens: 8192,
        temperature: 0.7,
      })
    )
  })

  it('usage가 없으면 0으로 반환한다', async () => {
    mockCreate.mockResolvedValue({
      content: [{ type: 'text', text: 'ok' }],
    })

    const result = await runAgent(testConfig, 'Hello')
    expect(result.usage).toEqual({ inputTokens: 0, outputTokens: 0 })
  })
})

describe('streamAgent', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('스트리밍 응답을 합쳐서 AgentResult로 반환한다', async () => {
    const mockIterator = {
      [Symbol.asyncIterator]: async function* () {
        yield {
          type: 'content_block_delta',
          delta: { type: 'text_delta', text: 'Hello ' },
        }
        yield {
          type: 'content_block_delta',
          delta: { type: 'text_delta', text: 'World' },
        }
        yield { type: 'message_stop' }
      },
      finalMessage: vi.fn().mockResolvedValue({
        usage: { input_tokens: 200, output_tokens: 100 },
      }),
    }
    mockStream.mockReturnValue(mockIterator)

    const result = await streamAgent(testConfig, 'Hi')
    expect(result.text).toBe('Hello World')
    expect(result.usage).toEqual({ inputTokens: 200, outputTokens: 100 })
  })

  it('onChunk 콜백을 호출한다', async () => {
    const onChunk = vi.fn()

    const mockIterator = {
      [Symbol.asyncIterator]: async function* () {
        yield {
          type: 'content_block_delta',
          delta: { type: 'text_delta', text: 'chunk1' },
        }
        yield {
          type: 'content_block_delta',
          delta: { type: 'text_delta', text: 'chunk2' },
        }
      },
      finalMessage: vi.fn().mockResolvedValue({
        usage: { input_tokens: 50, output_tokens: 30 },
      }),
    }
    mockStream.mockReturnValue(mockIterator)

    await streamAgent(testConfig, 'Hi', undefined, onChunk)
    expect(onChunk).toHaveBeenCalledWith('chunk1')
    expect(onChunk).toHaveBeenCalledWith('chunk2')
  })

  it('context가 있으면 systemPrompt에 추가한다', async () => {
    mockStream.mockReturnValue({
      [Symbol.asyncIterator]: async function* () {},
      finalMessage: vi.fn().mockResolvedValue({
        usage: { input_tokens: 0, output_tokens: 0 },
      }),
    })

    await streamAgent(testConfig, 'Hi', 'ctx')
    expect(mockStream).toHaveBeenCalledWith(
      expect.objectContaining({
        system: expect.stringContaining('ctx'),
      })
    )
  })

  it('finalMessage 실패 시 이벤트에서 캡처한 usage를 사용한다', async () => {
    const mockIterator = {
      [Symbol.asyncIterator]: async function* () {
        yield {
          type: 'content_block_delta',
          delta: { type: 'text_delta', text: 'text' },
        }
        yield {
          type: 'message_delta',
          usage: { output_tokens: 42 },
        }
      },
      finalMessage: vi.fn().mockRejectedValue(new Error('no final')),
    }
    mockStream.mockReturnValue(mockIterator)

    const result = await streamAgent(testConfig, 'Hi')
    expect(result.text).toBe('text')
    expect(result.usage.outputTokens).toBe(42)
  })
})

describe('streamAgentWithHistory', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('messages 배열을 전달하고 AgentResult를 반환한다', async () => {
    mockStream.mockReturnValue({
      [Symbol.asyncIterator]: async function* () {
        yield {
          type: 'content_block_delta',
          delta: { type: 'text_delta', text: 'response' },
        }
      },
      finalMessage: vi.fn().mockResolvedValue({
        usage: { input_tokens: 300, output_tokens: 150 },
      }),
    })

    const messages = [
      { role: 'user' as const, content: 'Hi' },
      { role: 'assistant' as const, content: 'Hello' },
      { role: 'user' as const, content: 'How are you?' },
    ]

    const result = await streamAgentWithHistory(testConfig, messages)
    expect(result.text).toBe('response')
    expect(result.usage).toEqual({ inputTokens: 300, outputTokens: 150 })
    expect(mockStream).toHaveBeenCalledWith(
      expect.objectContaining({
        messages,
      })
    )
  })
})

// withRetry tests use a patched version with 0 delay for fast testing
describe('withRetry', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('성공 시 즉시 결과를 반환한다', async () => {
    const fn = vi.fn().mockResolvedValue('success')
    const result = await withRetry(fn, 0)
    expect(result).toBe('success')
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('retryable 에러 시 재시도 후 성공한다', async () => {
    const apiError = Object.assign(new Error('Rate limited'), { status: 429 })
    const fn = vi.fn()
      .mockRejectedValueOnce(apiError)
      .mockResolvedValueOnce('success')

    const result = await withRetry(fn, 1)
    expect(result).toBe('success')
    expect(fn).toHaveBeenCalledTimes(2)
  })

  it('최대 재시도 횟수 초과 시 에러를 던진다', async () => {
    const apiError = Object.assign(new Error('Server error'), { status: 500 })
    const fn = vi.fn().mockRejectedValue(apiError)

    await expect(withRetry(fn, 0)).rejects.toThrow('Server error')
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('non-retryable 에러는 즉시 실패한다', async () => {
    const apiError = Object.assign(new Error('Bad request'), { status: 400 })
    const fn = vi.fn().mockRejectedValue(apiError)

    await expect(withRetry(fn, 3)).rejects.toThrow('Bad request')
    expect(fn).toHaveBeenCalledTimes(1)
  })
})
