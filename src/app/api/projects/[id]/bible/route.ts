import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/auth-utils'
import { handleApiError } from '@/lib/api-utils'
import { z } from 'zod'
import { prisma } from '@/lib/db/client'
import type { BookBible } from '@/types/book-bible'
import { createEmptyBible } from '@/types/book-bible'

// Bible 기본 스키마 검증 (완전한 검증은 타입으로)
const BibleSchema = z.object({
  type: z.enum(['fiction', 'selfhelp']),
  version: z.number().optional(),
}).passthrough() // 나머지 필드 허용

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET /api/projects/[id]/bible - Bible 조회
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { error: authError } = await requireAuth()
    if (authError) return authError

    const { id } = await params
    const project = await prisma.project.findUnique({
      where: { id },
      select: { id: true, type: true, bible: true },
    })

    if (!project) {
      return NextResponse.json(
        { success: false, error: '프로젝트를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    let bible: BookBible | null = null
    if (project.bible) {
      try {
        bible = JSON.parse(project.bible) as BookBible
      } catch {
        bible = null
      }
    }

    // Bible이 없으면 프로젝트 타입에 맞는 빈 Bible 반환
    if (!bible) {
      bible = createEmptyBible(project.type)
    }

    return NextResponse.json({ success: true, data: bible })
  } catch (error) {
    return handleApiError(error, { route: 'projects/[id]/bible', method: 'GET' })
  }
}

// PUT /api/projects/[id]/bible - Bible 저장
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { error: authError } = await requireAuth()
    if (authError) return authError

    const { id } = await params
    const body = await request.json()

    // 입력 유효성 검사
    const parseResult = BibleSchema.safeParse(body)
    if (!parseResult.success) {
      return NextResponse.json(
        { success: false, error: '잘못된 Bible 형식입니다.', details: z.flattenError(parseResult.error) },
        { status: 400 }
      )
    }

    const bible = body as BookBible

    const project = await prisma.project.findUnique({
      where: { id },
      select: { id: true },
    })

    if (!project) {
      return NextResponse.json(
        { success: false, error: '프로젝트를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // Bible 버전 업데이트
    const updatedBible: BookBible = {
      ...bible,
      updatedAt: new Date().toISOString(),
    }

    await prisma.project.update({
      where: { id },
      data: { bible: JSON.stringify(updatedBible) },
    })

    return NextResponse.json({ success: true, data: updatedBible })
  } catch (error) {
    return handleApiError(error, { route: 'projects/[id]/bible', method: 'PUT' })
  }
}
