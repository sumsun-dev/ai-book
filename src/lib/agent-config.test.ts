import { describe, it, expect } from 'vitest'
import {
  parseAgentConfig,
  mergeWriterConfig,
  mergeEditorConfig,
  mergeCriticConfig,
} from './agent-config'
import type { AgentConfig } from '@/lib/claude'

const baseConfig: AgentConfig = {
  name: 'Test Agent',
  systemPrompt: 'Base prompt',
  temperature: 0.7,
}

describe('parseAgentConfig', () => {
  it('should parse valid JSON', () => {
    const json = JSON.stringify({ writer: { creativity: 0.9 } })
    const result = parseAgentConfig(json)
    expect(result.writer?.creativity).toBe(0.9)
  })

  it('should return empty for null', () => {
    expect(parseAgentConfig(null)).toEqual({})
  })

  it('should return empty for invalid JSON', () => {
    expect(parseAgentConfig('not json')).toEqual({})
  })
})

describe('mergeWriterConfig', () => {
  it('should use custom creativity as temperature', () => {
    const result = mergeWriterConfig(baseConfig, { creativity: 0.9 })
    expect(result.temperature).toBe(0.9)
  })

  it('should add concise instructions', () => {
    const result = mergeWriterConfig(baseConfig, { styleIntensity: 'concise' })
    expect(result.systemPrompt).toContain('간결')
  })

  it('should add detailed instructions', () => {
    const result = mergeWriterConfig(baseConfig, { styleIntensity: 'detailed' })
    expect(result.systemPrompt).toContain('풍부한 묘사')
  })

  it('should add custom instructions', () => {
    const result = mergeWriterConfig(baseConfig, {
      customInstructions: '항상 한국어로 작성',
    })
    expect(result.systemPrompt).toContain('항상 한국어로 작성')
  })

  it('should use defaults when no custom config', () => {
    const result = mergeWriterConfig(baseConfig)
    expect(result.temperature).toBe(0.8)
  })
})

describe('mergeEditorConfig', () => {
  it('should set strict temperature low', () => {
    const result = mergeEditorConfig(baseConfig, { strictness: 'strict' })
    expect(result.temperature).toBe(0.1)
  })

  it('should set lenient temperature higher', () => {
    const result = mergeEditorConfig(baseConfig, { strictness: 'lenient' })
    expect(result.temperature).toBe(0.5)
  })

  it('should add focus area instructions for subset', () => {
    const result = mergeEditorConfig(baseConfig, {
      focusAreas: ['grammar', 'style'],
    })
    expect(result.systemPrompt).toContain('grammar, style')
  })

  it('should not add focus instruction when all areas', () => {
    const result = mergeEditorConfig(baseConfig, {
      focusAreas: ['grammar', 'style', 'clarity', 'structure'],
    })
    expect(result.systemPrompt).not.toContain('집중 영역')
  })
})

describe('mergeCriticConfig', () => {
  it('should add grammar focus instruction', () => {
    const result = mergeCriticConfig(baseConfig, {
      evaluationFocus: 'grammar',
    })
    expect(result.systemPrompt).toContain('문법과 맞춤법')
  })

  it('should add pass threshold instruction', () => {
    const result = mergeCriticConfig(baseConfig, { passThreshold: 8 })
    expect(result.systemPrompt).toContain('8점')
  })

  it('should use default threshold when no custom', () => {
    const result = mergeCriticConfig(baseConfig)
    expect(result.systemPrompt).toContain('7점')
  })
})
