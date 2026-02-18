import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/db/client', () => ({
  prisma: {
    newsletterSubscriber: {
      upsert: vi.fn(),
    },
  },
}))

import { POST } from './route'
import { prisma } from '@/lib/db/client'
import { NextRequest } from 'next/server'

function createRequest(body: Record<string, unknown>): NextRequest {
  return new NextRequest('http://localhost/api/newsletter', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  })
}

describe('POST /api/newsletter', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should subscribe with valid email', async () => {
    vi.mocked(prisma.newsletterSubscriber.upsert).mockResolvedValue({} as never)

    const res = await POST(createRequest({ email: 'test@example.com' }))
    expect(res.status).toBe(200)

    const data = await res.json()
    expect(data.success).toBe(true)
  })

  it('should return 400 for invalid email', async () => {
    const res = await POST(createRequest({ email: 'invalid' }))
    expect(res.status).toBe(400)
  })

  it('should accept locale parameter', async () => {
    vi.mocked(prisma.newsletterSubscriber.upsert).mockResolvedValue({} as never)

    const res = await POST(createRequest({ email: 'test@example.com', locale: 'en' }))
    expect(res.status).toBe(200)

    expect(prisma.newsletterSubscriber.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({ locale: 'en' }),
      })
    )
  })
})
