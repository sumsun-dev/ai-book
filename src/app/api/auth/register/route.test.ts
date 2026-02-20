import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST, clearRegisterRateLimit } from './route'
import { NextRequest } from 'next/server'

vi.mock('@/lib/db/client', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    userQuota: {
      upsert: vi.fn(),
    },
  },
}))

vi.mock('@/lib/token-quota', () => ({
  ensureUserQuota: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('@/lib/auth/password', () => ({
  hashPassword: vi.fn().mockResolvedValue('$2a$12$hashedpassword'),
}))

import { prisma } from '@/lib/db/client'
import { ensureUserQuota } from '@/lib/token-quota'

const mockFindUnique = prisma.user.findUnique as unknown as ReturnType<typeof vi.fn>
const mockCreate = prisma.user.create as unknown as ReturnType<typeof vi.fn>
const mockEnsureUserQuota = ensureUserQuota as unknown as ReturnType<typeof vi.fn>

function createRequest(body: Record<string, unknown>): NextRequest {
  return new NextRequest('http://localhost:3000/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  })
}

describe('POST /api/auth/register', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    clearRegisterRateLimit()
  })

  it('should register a new user successfully', async () => {
    mockFindUnique.mockResolvedValue(null)
    mockCreate.mockResolvedValue({
      id: 'user-1',
      email: 'test@test.com',
      name: '테스트',
      password: '$2a$12$hashedpassword',
      image: null,
      provider: 'credentials',
      emailVerified: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    const response = await POST(
      createRequest({
        email: 'test@test.com',
        password: 'Password123!',
        name: '테스트',
      })
    )

    expect(response.status).toBe(201)
    const body = await response.json()
    expect(body.success).toBe(true)
    expect(body.data.email).toBe('test@test.com')
    expect(body.data).not.toHaveProperty('password')
  })

  it('should return 400 for missing email', async () => {
    const response = await POST(
      createRequest({ password: 'Password123!', name: '테스트' })
    )
    expect(response.status).toBe(400)
  })

  it('should return 400 for missing password', async () => {
    const response = await POST(
      createRequest({ email: 'test@test.com', name: '테스트' })
    )
    expect(response.status).toBe(400)
  })

  it('should return 400 for invalid email format', async () => {
    const response = await POST(
      createRequest({ email: 'notanemail', password: 'Password123!', name: '테스트' })
    )
    expect(response.status).toBe(400)
  })

  it('should return 400 for short password', async () => {
    const response = await POST(
      createRequest({ email: 'test@test.com', password: '123', name: '테스트' })
    )
    expect(response.status).toBe(400)
  })

  it('should return 409 for duplicate email', async () => {
    mockFindUnique.mockResolvedValue({
      id: 'existing-user',
      email: 'test@test.com',
      name: '기존 사용자',
      password: 'hashed',
      image: null,
      provider: 'credentials',
      emailVerified: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    const response = await POST(
      createRequest({
        email: 'test@test.com',
        password: 'Password123!',
        name: '테스트',
      })
    )

    expect(response.status).toBe(409)
    const body = await response.json()
    expect(body.error).toContain('이미 사용 중')
  })

  it('should call ensureUserQuota after user creation', async () => {
    mockFindUnique.mockResolvedValue(null)
    mockCreate.mockResolvedValue({
      id: 'user-1',
      email: 'test@test.com',
      name: '테스트',
      password: '$2a$12$hashedpassword',
      image: null,
      provider: 'credentials',
      emailVerified: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    const response = await POST(
      createRequest({
        email: 'test@test.com',
        password: 'Password123!',
        name: '테스트',
      })
    )

    expect(response.status).toBe(201)
    expect(mockEnsureUserQuota).toHaveBeenCalledWith('user-1')
  })

  it('should hash the password before storing', async () => {
    const { hashPassword } = await import('@/lib/auth/password')
    mockFindUnique.mockResolvedValue(null)
    mockCreate.mockResolvedValue({
      id: 'user-1',
      email: 'test@test.com',
      name: '테스트',
      password: '$2a$12$hashedpassword',
      image: null,
      provider: 'credentials',
      emailVerified: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    await POST(
      createRequest({
        email: 'test@test.com',
        password: 'Password123!',
        name: '테스트',
      })
    )

    expect(hashPassword).toHaveBeenCalledWith('Password123!')
    expect(mockCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        password: '$2a$12$hashedpassword',
      }),
    })
  })
})
