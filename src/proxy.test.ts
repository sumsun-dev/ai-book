import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

vi.mock('next-auth', () => ({
  default: vi.fn().mockReturnValue({
    auth: vi.fn().mockImplementation((handler: (...args: unknown[]) => unknown) => handler),
  }),
}))

vi.mock('./auth.config', () => ({
  authConfig: {},
}))

vi.mock('./lib/rate-limit', () => ({
  checkRateLimit: vi.fn().mockResolvedValue(null),
}))

describe('proxy - CSRF verification', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
  })

  function createRequest(
    method: string,
    pathname: string,
    headers: Record<string, string> = {}
  ) {
    const url = `http://localhost:3000${pathname}`
    return new NextRequest(url, {
      method,
      headers: {
        host: 'localhost:3000',
        ...headers,
      },
    })
  }

  it('allows GET requests without Origin/Referer', async () => {
    const { default: proxy } = await import('./proxy')
    const request = createRequest('GET', '/api/projects')
    const response = await proxy(request, {} as never)

    expect((response as Response)?.status ?? 200).not.toBe(403)
  })

  it('blocks POST without Origin or Referer', async () => {
    const { default: proxy } = await import('./proxy')
    const request = createRequest('POST', '/api/projects')
    const response = await proxy(request, {} as never)

    expect((response as Response).status).toBe(403)
  })

  it('allows POST with matching Origin', async () => {
    const { default: proxy } = await import('./proxy')
    const request = createRequest('POST', '/api/projects', {
      origin: 'http://localhost:3000',
    })
    const response = await proxy(request, {} as never)

    expect((response as Response)?.status ?? 200).not.toBe(403)
  })

  it('blocks POST with mismatched Origin', async () => {
    const { default: proxy } = await import('./proxy')
    const request = createRequest('POST', '/api/projects', {
      origin: 'http://evil.com',
    })
    const response = await proxy(request, {} as never)

    expect((response as Response).status).toBe(403)
  })

  it('allows POST with matching Referer', async () => {
    const { default: proxy } = await import('./proxy')
    const request = createRequest('POST', '/api/projects', {
      referer: 'http://localhost:3000/dashboard',
    })
    const response = await proxy(request, {} as never)

    expect((response as Response)?.status ?? 200).not.toBe(403)
  })

  it('exempts /api/auth/ paths from CSRF', async () => {
    const { default: proxy } = await import('./proxy')
    const request = createRequest('POST', '/api/auth/callback/google')
    const response = await proxy(request, {} as never)

    expect((response as Response)?.status ?? 200).not.toBe(403)
  })

  it('exempts /api/health from CSRF', async () => {
    const { default: proxy } = await import('./proxy')
    const request = createRequest('POST', '/api/health')
    const response = await proxy(request, {} as never)

    expect((response as Response)?.status ?? 200).not.toBe(403)
  })
})
