import Anthropic from '@anthropic-ai/sdk'
import type { MessageParam } from '@anthropic-ai/sdk/resources/messages'

const anthropic = new Anthropic()

export interface AgentConfig {
  name: string
  systemPrompt: string
  temperature?: number
  maxTokens?: number
}

export type { MessageParam }

export async function runAgent(
  config: AgentConfig,
  userMessage: string,
  context?: string
): Promise<string> {
  const systemPrompt = context
    ? `${config.systemPrompt}\n\n## Current Context:\n${context}`
    : config.systemPrompt

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: config.maxTokens ?? 8192,
    temperature: config.temperature ?? 0.7,
    system: systemPrompt,
    messages: [
      { role: 'user', content: userMessage }
    ],
  })

  const textBlock = message.content.find(block => block.type === 'text')
  return textBlock?.type === 'text' ? textBlock.text : ''
}

export async function streamAgent(
  config: AgentConfig,
  userMessage: string,
  context?: string,
  onChunk: (chunk: string) => void = () => {}
): Promise<string> {
  const systemPrompt = context
    ? `${config.systemPrompt}\n\n## Current Context:\n${context}`
    : config.systemPrompt

  const stream = await anthropic.messages.stream({
    model: 'claude-sonnet-4-20250514',
    max_tokens: config.maxTokens ?? 8192,
    temperature: config.temperature ?? 0.7,
    system: systemPrompt,
    messages: [
      { role: 'user', content: userMessage }
    ],
  })

  let fullResponse = ''

  for await (const event of stream) {
    if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
      const chunk = event.delta.text
      fullResponse += chunk
      onChunk(chunk)
    }
  }

  return fullResponse
}

/**
 * 대화 히스토리를 포함한 스트리밍 에이전트 호출
 * @param config 에이전트 설정
 * @param messages 전체 대화 히스토리 (user/assistant 번갈아가며)
 * @param onChunk 스트리밍 청크 콜백
 */
export async function streamAgentWithHistory(
  config: AgentConfig,
  messages: MessageParam[],
  onChunk: (chunk: string) => void = () => {}
): Promise<string> {
  const stream = await anthropic.messages.stream({
    model: 'claude-sonnet-4-20250514',
    max_tokens: config.maxTokens ?? 8192,
    temperature: config.temperature ?? 0.7,
    system: config.systemPrompt,
    messages,
  })

  let fullResponse = ''

  for await (const event of stream) {
    if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
      const chunk = event.delta.text
      fullResponse += chunk
      onChunk(chunk)
    }
  }

  return fullResponse
}
