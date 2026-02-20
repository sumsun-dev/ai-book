import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { getCurrentUsage, getUserLimit, getTokenUsageInfo, checkQuota, recordUsage, ensureUserQuota, clearUsageCache } from './token-quota'
import { prisma } from './db/client'
import { AppError, ERROR_CODES } from './errors'

vi.mock('./db/client', () => ({
  prisma: {
    tokenUsage: {
      aggregate: vi.fn(),
      create: vi.fn(),
    },
    userQuota: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
    },
  },
}))

const mockAggregate = vi.mocked(prisma.tokenUsage.aggregate)
const mockCreate = vi.mocked(prisma.tokenUsage.create)
const mockFindUnique = vi.mocked(prisma.userQuota.findUnique)
const mockUpsert = vi.mocked(prisma.userQuota.upsert)

describe('token-quota', () => {
  const userId = 'user-123'

  beforeEach(() => {
    vi.clearAllMocks()
    clearUsageCache()
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-02-15T12:00:00Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('getCurrentUsage', () => {
    it('현재 월의 총 사용량을 반환한다', async () => {
      mockAggregate.mockResolvedValue({
        _sum: { totalTokens: 30000 },
        _count: {},
        _avg: {},
        _min: {},
        _max: {},
      } as never)

      const usage = await getCurrentUsage(userId)
      expect(usage).toBe(30000)
      expect(mockAggregate).toHaveBeenCalledWith({
        where: {
          userId,
          createdAt: {
            gte: new Date('2026-02-01T00:00:00.000Z'),
          },
        },
        _sum: { totalTokens: true },
      })
    })

    it('사용량이 없으면 0을 반환한다', async () => {
      mockAggregate.mockResolvedValue({
        _sum: { totalTokens: null },
        _count: {},
        _avg: {},
        _min: {},
        _max: {},
      } as never)

      const usage = await getCurrentUsage(userId)
      expect(usage).toBe(0)
    })

    it('캐시된 값을 반환한다 (60초 이내)', async () => {
      mockAggregate.mockResolvedValue({
        _sum: { totalTokens: 10000 },
        _count: {},
        _avg: {},
        _min: {},
        _max: {},
      } as never)

      const first = await getCurrentUsage(userId)
      expect(first).toBe(10000)

      mockAggregate.mockResolvedValue({
        _sum: { totalTokens: 20000 },
        _count: {},
        _avg: {},
        _min: {},
        _max: {},
      } as never)

      const second = await getCurrentUsage(userId)
      expect(second).toBe(10000)
      expect(mockAggregate).toHaveBeenCalledTimes(1)
    })

    it('캐시 만료 후 새 값을 반환한다', async () => {
      mockAggregate.mockResolvedValue({
        _sum: { totalTokens: 10000 },
        _count: {},
        _avg: {},
        _min: {},
        _max: {},
      } as never)

      await getCurrentUsage(userId)

      vi.advanceTimersByTime(61_000)

      mockAggregate.mockResolvedValue({
        _sum: { totalTokens: 20000 },
        _count: {},
        _avg: {},
        _min: {},
        _max: {},
      } as never)

      const result = await getCurrentUsage(userId)
      expect(result).toBe(20000)
      expect(mockAggregate).toHaveBeenCalledTimes(2)
    })
  })

  describe('getUserLimit', () => {
    it('UserQuota에서 한도를 조회한다', async () => {
      mockFindUnique.mockResolvedValue({
        id: 'quota-1',
        userId,
        plan: 'free',
        monthlyLimit: 50000,
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      const limit = await getUserLimit(userId)
      expect(limit).toBe(50000)
    })

    it('UserQuota가 없으면 기본 50,000을 반환한다', async () => {
      mockFindUnique.mockResolvedValue(null)

      const limit = await getUserLimit(userId)
      expect(limit).toBe(50000)
    })
  })

  describe('getTokenUsageInfo', () => {
    it('사용량 정보를 종합하여 반환한다', async () => {
      mockAggregate.mockResolvedValue({
        _sum: { totalTokens: 42500 },
        _count: {},
        _avg: {},
        _min: {},
        _max: {},
      } as never)
      mockFindUnique.mockResolvedValue({
        id: 'quota-1',
        userId,
        plan: 'free',
        monthlyLimit: 50000,
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      const info = await getTokenUsageInfo(userId)
      expect(info).toEqual({
        used: 42500,
        limit: 50000,
        percentage: 85,
        periodStart: new Date('2026-02-01T00:00:00.000Z'),
        periodEnd: new Date('2026-03-01T00:00:00.000Z'),
      })
    })

    it('100%를 초과하면 100으로 캡핑한다', async () => {
      mockAggregate.mockResolvedValue({
        _sum: { totalTokens: 60000 },
        _count: {},
        _avg: {},
        _min: {},
        _max: {},
      } as never)
      mockFindUnique.mockResolvedValue(null)

      const info = await getTokenUsageInfo(userId)
      expect(info.percentage).toBe(100)
    })
  })

  describe('checkQuota', () => {
    it('한도 미만이면 통과한다', async () => {
      mockAggregate.mockResolvedValue({
        _sum: { totalTokens: 30000 },
        _count: {},
        _avg: {},
        _min: {},
        _max: {},
      } as never)
      mockFindUnique.mockResolvedValue(null)

      await expect(checkQuota(userId)).resolves.not.toThrow()
    })

    it('한도 초과 시 QUOTA_EXCEEDED 에러를 던진다', async () => {
      mockAggregate.mockResolvedValue({
        _sum: { totalTokens: 50000 },
        _count: {},
        _avg: {},
        _min: {},
        _max: {},
      } as never)
      mockFindUnique.mockResolvedValue(null)

      await expect(checkQuota(userId)).rejects.toThrow(AppError)
      await expect(checkQuota(userId)).rejects.toMatchObject({
        code: ERROR_CODES.QUOTA_EXCEEDED,
      })
    })

    it('한도 초과 메시지에 리셋 날짜를 포함한다', async () => {
      mockAggregate.mockResolvedValue({
        _sum: { totalTokens: 50000 },
        _count: {},
        _avg: {},
        _min: {},
        _max: {},
      } as never)
      mockFindUnique.mockResolvedValue(null)

      try {
        await checkQuota(userId)
        expect.fail('should have thrown')
      } catch (error) {
        expect(error).toBeInstanceOf(AppError)
        const appError = error as AppError
        expect(appError.message).toContain('50,000토큰')
        expect(appError.message).toContain('초기화됩니다')
        // 2026-02-15 기준 → 다음달 2026. 3. 1.
        expect(appError.message).toContain('2026')
      }
    })
  })

  describe('recordUsage', () => {
    it('DB에 사용량을 기록한다', async () => {
      mockCreate.mockResolvedValue({} as never)

      await recordUsage(userId, 'writer', { inputTokens: 1000, outputTokens: 500 }, 'project-1')

      expect(mockCreate).toHaveBeenCalledWith({
        data: {
          userId,
          agentName: 'writer',
          inputTokens: 1000,
          outputTokens: 500,
          totalTokens: 1500,
          projectId: 'project-1',
        },
      })
    })

    it('projectId 없이도 기록한다', async () => {
      mockCreate.mockResolvedValue({} as never)

      await recordUsage(userId, 'chat', { inputTokens: 200, outputTokens: 100 })

      expect(mockCreate).toHaveBeenCalledWith({
        data: {
          userId,
          agentName: 'chat',
          inputTokens: 200,
          outputTokens: 100,
          totalTokens: 300,
          projectId: undefined,
        },
      })
    })
  })

  describe('ensureUserQuota', () => {
    it('UserQuota 레코드를 upsert한다', async () => {
      mockUpsert.mockResolvedValue({} as never)

      await ensureUserQuota(userId)

      expect(mockUpsert).toHaveBeenCalledWith({
        where: { userId },
        create: { userId, plan: 'free', monthlyLimit: 50000 },
        update: {},
      })
    })
  })
})
