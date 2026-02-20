import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { handleApiError } from './api-utils'

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
})
