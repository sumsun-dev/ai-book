import { NextResponse } from 'next/server'
import { auth } from '@/auth'

export function unauthorizedResponse(): NextResponse {
  return NextResponse.json(
    { success: false, error: '로그인이 필요합니다.' },
    { status: 401 }
  )
}

export function forbiddenResponse(): NextResponse {
  return NextResponse.json(
    { success: false, error: '접근 권한이 없습니다.' },
    { status: 403 }
  )
}

export async function getCurrentUserId(): Promise<string | null> {
  const session = await auth()
  return session?.user?.id ?? null
}

export async function requireAuth(): Promise<{
  userId: string | null
  error: NextResponse | null
}> {
  const userId = await getCurrentUserId()
  if (!userId) {
    return { userId: null, error: unauthorizedResponse() }
  }
  return { userId, error: null }
}

/**
 * 프로젝트 소유권을 검증합니다.
 * - userId가 null인 레거시 프로젝트: 모든 로그인 사용자 접근 허용
 * - userId가 있는 프로젝트: 소유자만 접근 허용
 */
export function checkProjectOwnership(
  projectUserId: string | null,
  currentUserId: string
): NextResponse | null {
  if (projectUserId && projectUserId !== currentUserId) {
    return forbiddenResponse()
  }
  return null
}

/**
 * 프로젝트 조회 시 소유권 필터를 반환합니다.
 * - 소유자 본인 또는 레거시(userId=null) 프로젝트만 접근 허용
 */
export function projectOwnerWhere(projectId: string, userId: string) {
  return {
    id: projectId,
    OR: [{ userId }, { userId: null }],
  }
}
