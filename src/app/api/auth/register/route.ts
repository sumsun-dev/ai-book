import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db/client'
import { hashPassword } from '@/lib/auth/password'
import { ensureUserQuota } from '@/lib/token-quota'

const registerSchema = z.object({
  email: z.string().email('올바른 이메일 형식이 아닙니다.'),
  password: z.string().min(8, '비밀번호는 최소 8자 이상이어야 합니다.'),
  name: z.string().min(1, '이름을 입력해주세요.').optional(),
})

// 인메모리 rate limit (Upstash 없어도 동작)
const registerAttempts = new Map<string, { count: number; resetAt: number }>()
const MAX_REGISTER_ATTEMPTS = 3
const REGISTER_WINDOW_MS = 60_000 * 10 // 10분

/** 테스트 전용: rate limit 초기화 */
export function clearRegisterRateLimit(): void {
  registerAttempts.clear()
}

function checkRegisterRateLimit(ip: string): boolean {
  const now = Date.now()
  const entry = registerAttempts.get(ip)
  if (!entry || now > entry.resetAt) {
    registerAttempts.set(ip, { count: 1, resetAt: now + REGISTER_WINDOW_MS })
    return true
  }
  if (entry.count >= MAX_REGISTER_ATTEMPTS) return false
  entry.count++
  return true
}

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
    if (!checkRegisterRateLimit(ip)) {
      return NextResponse.json(
        { success: false, error: '너무 많은 가입 시도입니다. 10분 후 다시 시도해주세요.' },
        { status: 429 }
      )
    }

    const body = await request.json()
    const parsed = registerSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.errors[0].message },
        { status: 400 }
      )
    }

    const { email, password, name } = parsed.data

    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: '이미 사용 중인 이메일입니다.' },
        { status: 409 }
      )
    }

    const hashedPassword = await hashPassword(password)

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name: name || null,
        provider: 'credentials',
      },
    })

    await ensureUserQuota(user.id)

    return NextResponse.json(
      {
        success: true,
        data: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
      },
      { status: 201 }
    )
  } catch {
    return NextResponse.json(
      { success: false, error: '회원가입에 실패했습니다.' },
      { status: 500 }
    )
  }
}
