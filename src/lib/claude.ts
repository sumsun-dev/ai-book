import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic()

export interface AgentConfig {
  name: string
  systemPrompt: string
  temperature?: number
}

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
    max_tokens: 4096,
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
    max_tokens: 4096,
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
