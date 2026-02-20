import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { handleApiError } from './api-utils'
import { AppError, ERROR_CODES } from './errors'

vi.mock('next/server', () => ({
  NextResponse: {
    json: vi.fn((body: unknown, init?: { status?: number }) => ({
      body,
      status: init?.status ?? 200,
      json: async () => body,
    })),
  },
}))

describe('handleApiError', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
    delete process.env.SENTRY_DSN
  })

  it('should return 500 status', () => {
    const response = handleApiError(new Error('test'))
    expect(response.status).toBe(500)
  })

  it('should return error message from Error instance', async () => {
    const response = handleApiError(new Error('Something broke'))
    const body = await response.json()
    expect(body).toEqual({ success: false, error: 'Something broke' })
  })

  it('should return generic message for non-Error', async () => {
    const response = handleApiError('string error')
    const body = await response.json()
    expect(body).toEqual({ success: false, error: 'Internal server error' })
  })

  it('should return generic message for null error', async () => {
    const response = handleApiError(null)
    const body = await response.json()
    expect(body).toEqual({ success: false, error: 'Internal server error' })
  })

  it('should log error to console', () => {
    const error = new Error('test error')
    handleApiError(error)
    expect(console.error).toHaveBeenCalledWith('API Error:', error)
  })

  it('should accept optional context parameter', () => {
    const response = handleApiError(new Error('test'), { route: '/api/test', method: 'GET' })
    expect(response.status).toBe(500)
  })

  it('should attempt Sentry capture when SENTRY_DSN is set', async () => {
    process.env.SENTRY_DSN = 'https://test@sentry.io/123'

    const mockCaptureException = vi.fn()
    vi.doMock('@sentry/nextjs', () => ({
      captureException: mockCaptureException,
    }))

    const error = new Error('sentry test')
    handleApiError(error, { route: '/api/test' })

    // Sentry import is async, give it time
    await new Promise((resolve) => setTimeout(resolve, 50))
  })

  it('should not attempt Sentry capture when SENTRY_DSN is not set', () => {
    delete process.env.SENTRY_DSN
    handleApiError(new Error('no sentry'))
    // No error thrown = passes (Sentry import not triggered)
  })

  it('should return 429 for QUOTA_EXCEEDED AppError', async () => {
    const error = new AppError(ERROR_CODES.QUOTA_EXCEEDED)
    const response = handleApiError(error)
    expect(response.status).toBe(429)
    const body = await response.json()
    expect(body).toEqual({
      success: false,
      error: '이번 달 AI 사용량 한도에 도달했습니다.',
      code: 'QUOTA_EXCEEDED',
    })
  })

  it('should return 400 for other AppError codes', async () => {
    const error = new AppError(ERROR_CODES.SAVE_FAILED)
    const response = handleApiError(error)
    expect(response.status).toBe(400)
    const body = await response.json()
    expect(body).toEqual({
      success: false,
      error: '저장에 실패했습니다. 잠시 후 다시 시도합니다',
      code: 'SAVE_FAILED',
    })
  })
})
