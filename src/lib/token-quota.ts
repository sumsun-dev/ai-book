import { prisma } from './db/client'
import { AppError, ERROR_CODES } from './errors'
import type { TokenUsageInfo } from '@/types/book'

const DEFAULT_MONTHLY_LIMIT = 50000
const CACHE_TTL_MS = 5_000

interface CacheEntry {
  value: number
  expiresAt: number
}

const usageCache = new Map<string, CacheEntry>()

/** 테스트 전용: 캐시 초기화 */
export function clearUsageCache(): void {
  usageCache.clear()
}

function getMonthStart(): Date {
  const now = new Date()
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))
}

function getNextMonthStart(): Date {
  const now = new Date()
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1))
}

export async function getCurrentUsage(userId: string): Promise<number> {
  const cacheKey = `usage:${userId}`
  const cached = usageCache.get(cacheKey)
  if (cached && Date.now() < cached.expiresAt) {
    return cached.value
  }

  const result = await prisma.tokenUsage.aggregate({
    where: {
      userId,
      createdAt: {
        gte: getMonthStart(),
      },
    },
    _sum: { totalTokens: true },
  })

  const used = result._sum.totalTokens ?? 0
  usageCache.set(cacheKey, { value: used, expiresAt: Date.now() + CACHE_TTL_MS })
  return used
}

export async function getUserLimit(userId: string): Promise<number> {
  const quota = await prisma.userQuota.findUnique({ where: { userId } })
  return quota?.monthlyLimit ?? DEFAULT_MONTHLY_LIMIT
}

export async function getTokenUsageInfo(userId: string): Promise<TokenUsageInfo> {
  const [used, limit] = await Promise.all([
    getCurrentUsage(userId),
    getUserLimit(userId),
  ])

  const percentage = Math.min(Math.round((used / limit) * 100), 100)

  return {
    used,
    limit,
    percentage,
    periodStart: getMonthStart(),
    periodEnd: getNextMonthStart(),
  }
}

export async function checkQuota(userId: string): Promise<void> {
  const [used, limit] = await Promise.all([
    getCurrentUsage(userId),
    getUserLimit(userId),
  ])

  if (used >= limit) {
    const nextReset = getNextMonthStart()
    throw new AppError(
      ERROR_CODES.QUOTA_EXCEEDED,
      `이번 달 AI 사용량 한도(${limit.toLocaleString()}토큰)에 도달했습니다. ${nextReset.toLocaleDateString('ko-KR')}에 초기화됩니다.`
    )
  }
}

export async function recordUsage(
  userId: string,
  agentName: string,
  usage: { inputTokens: number; outputTokens: number },
  projectId?: string
): Promise<void> {
  const totalTokens = usage.inputTokens + usage.outputTokens

  await prisma.tokenUsage.create({
    data: {
      userId,
      agentName,
      inputTokens: usage.inputTokens,
      outputTokens: usage.outputTokens,
      totalTokens,
      projectId,
    },
  })

  // 캐시 무효화
  usageCache.delete(`usage:${userId}`)
}

export async function ensureUserQuota(userId: string): Promise<void> {
  await prisma.userQuota.upsert({
    where: { userId },
    create: { userId, plan: 'free', monthlyLimit: DEFAULT_MONTHLY_LIMIT },
    update: {},
  })
}
