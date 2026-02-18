import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { resetEnv } from './env'

describe('env', () => {
  const originalEnv = { ...process.env }

  beforeEach(() => {
    resetEnv()
    vi.resetModules()
    process.env = {
      ...originalEnv,
      ANTHROPIC_API_KEY: 'test-key',
      AUTH_SECRET: 'test-secret',
      DATABASE_URL: 'file:./prisma/test.db',
      NODE_ENV: 'test',
    }
  })

  afterEach(() => {
    process.env = originalEnv
    resetEnv()
  })

  it('should validate and return valid env', async () => {
    const { env } = await import('./env')
    resetEnv()
    expect(env.ANTHROPIC_API_KEY).toBe('test-key')
    expect(env.AUTH_SECRET).toBe('test-secret')
  })

  it('should throw when ANTHROPIC_API_KEY is missing', async () => {
    delete process.env.ANTHROPIC_API_KEY
    const { env } = await import('./env')
    resetEnv()
    expect(() => env.ANTHROPIC_API_KEY).toThrow(
      'Environment variable validation failed'
    )
  })

  it('should throw when AUTH_SECRET is missing', async () => {
    delete process.env.AUTH_SECRET
    const { env } = await import('./env')
    resetEnv()
    expect(() => env.AUTH_SECRET).toThrow(
      'Environment variable validation failed'
    )
  })

  it('should use default DATABASE_URL when not set', async () => {
    delete process.env.DATABASE_URL
    const { env } = await import('./env')
    resetEnv()
    expect(env.DATABASE_URL).toBe('file:./prisma/dev.db')
  })

  it('should use default NODE_ENV when not set', async () => {
    delete process.env.NODE_ENV
    const { env } = await import('./env')
    resetEnv()
    expect(env.NODE_ENV).toBe('development')
  })

  it('should allow optional AUTH_GOOGLE_ID', async () => {
    const { env } = await import('./env')
    resetEnv()
    expect(env.AUTH_GOOGLE_ID).toBeUndefined()
  })

  it('should allow optional OPENAI_API_KEY', async () => {
    const { env } = await import('./env')
    resetEnv()
    expect(env.OPENAI_API_KEY).toBeUndefined()
  })

  it('should reject invalid NODE_ENV', async () => {
    process.env.NODE_ENV = 'invalid' as string
    const { env } = await import('./env')
    resetEnv()
    expect(() => env.NODE_ENV).toThrow(
      'Environment variable validation failed'
    )
  })

  it('should cache env after first access', async () => {
    const { env } = await import('./env')
    resetEnv()
    const first = env.ANTHROPIC_API_KEY
    process.env.ANTHROPIC_API_KEY = 'changed-key'
    const second = env.ANTHROPIC_API_KEY
    expect(first).toBe(second)
  })
})
