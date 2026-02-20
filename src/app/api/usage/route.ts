import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/auth-utils'
import { getTokenUsageInfo } from '@/lib/token-quota'

export async function GET() {
  try {
    const { userId, error: authError } = await requireAuth()
    if (authError) return authError

    const usageInfo = await getTokenUsageInfo(userId!)

    return NextResponse.json({
      success: true,
      data: usageInfo,
    })
  } catch {
    return NextResponse.json(
      { success: false, error: '사용량 조회에 실패했습니다.' },
      { status: 500 }
    )
  }
}
