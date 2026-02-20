import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getCurrentUserId, requireAuth, unauthorizedResponse, forbiddenResponse, checkProjectOwnership } from './auth-utils'

vi.mock('@/auth', () => ({
  auth: vi.fn(),
}))

import { auth } from '@/auth'
const mockAuth = vi.mocked(auth)

describe('auth-utils', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('unauthorizedResponse', () => {
    it('should return 401 JSON response', async () => {
      const response = unauthorizedResponse()
      expect(response.status).toBe(401)
      const body = await response.json()
      expect(body).toEqual({ success: false, error: '로그인이 필요합니다.' })
    })
  })

  describe('forbiddenResponse', () => {
    it('should return 403 JSON response', async () => {
      const response = forbiddenResponse()
      expect(response.status).toBe(403)
      const body = await response.json()
      expect(body).toEqual({ success: false, error: '접근 권한이 없습니다.' })
    })
  })

  describe('getCurrentUserId', () => {
    it('should return userId when session exists', async () => {
      mockAuth.mockResolvedValue({
        user: { id: 'user-123', email: 'test@test.com' },
        expires: new Date(Date.now() + 86400000).toISOString(),
      } as unknown as Awaited<ReturnType<typeof auth>>)

      const userId = await getCurrentUserId()
      expect(userId).toBe('user-123')
    })

    it('should return null when no session', async () => {
      mockAuth.mockResolvedValue(null as unknown as Awaited<ReturnType<typeof auth>>)
      const userId = await getCurrentUserId()
      expect(userId).toBeNull()
    })

    it('should return null when session has no user', async () => {
      mockAuth.mockResolvedValue({
        user: undefined,
        expires: new Date(Date.now() + 86400000).toISOString(),
      } as unknown as Awaited<ReturnType<typeof auth>>)

      const userId = await getCurrentUserId()
      expect(userId).toBeNull()
    })
  })

  describe('requireAuth', () => {
    it('should return userId when authenticated', async () => {
      mockAuth.mockResolvedValue({
        user: { id: 'user-456', email: 'test@test.com' },
        expires: new Date(Date.now() + 86400000).toISOString(),
      } as unknown as Awaited<ReturnType<typeof auth>>)

      const result = await requireAuth()
      expect(result).toEqual({ userId: 'user-456', error: null })
    })

    it('should return error response when not authenticated', async () => {
      mockAuth.mockResolvedValue(null as unknown as Awaited<ReturnType<typeof auth>>)

      const result = await requireAuth()
      expect(result.userId).toBeNull()
      expect(result.error).toBeDefined()
      expect(result.error!.status).toBe(401)
    })
  })

  describe('checkProjectOwnership', () => {
    it('레거시 프로젝트(userId=null)는 null을 반환한다', () => {
      const result = checkProjectOwnership(null, 'user-123')
      expect(result).toBeNull()
    })

    it('소유자가 일치하면 null을 반환한다', () => {
      const result = checkProjectOwnership('user-123', 'user-123')
      expect(result).toBeNull()
    })

    it('소유자가 불일치하면 403 응답을 반환한다', async () => {
      const result = checkProjectOwnership('user-456', 'user-123')
      expect(result).not.toBeNull()
      expect(result!.status).toBe(403)
      const body = await result!.json()
      expect(body).toEqual({ success: false, error: '접근 권한이 없습니다.' })
    })
  })
})
