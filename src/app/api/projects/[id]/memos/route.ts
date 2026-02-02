import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/client'
import { z } from 'zod'

interface RouteParams {
  params: Promise<{ id: string }>
}

const createMemoSchema = z.object({
  content: z.string().min(1, '내용을 입력해주세요'),
  chapterNumber: z.number().int().positive().nullable().optional(),
})

const updateMemoSchema = z.object({
  content: z.string().min(1, '내용을 입력해주세요').optional(),
  chapterNumber: z.number().int().positive().nullable().optional(),
})

// GET /api/projects/[id]/memos - 프로젝트의 모든 메모 조회
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: projectId } = await params
    const { searchParams } = new URL(request.url)
    const chapterNumber = searchParams.get('chapterNumber')

    const where: { projectId: string; chapterNumber?: number | null } = { projectId }

    if (chapterNumber !== null && chapterNumber !== undefined) {
      const num = parseInt(chapterNumber, 10)
      if (!isNaN(num)) {
        where.chapterNumber = num
      }
    }

    const memos = await prisma.memo.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ success: true, data: memos })
  } catch (error) {
    console.error('메모 조회 오류:', error)
    return NextResponse.json(
      { success: false, error: '메모를 불러오는데 실패했습니다.' },
      { status: 500 }
    )
  }
}

// POST /api/projects/[id]/memos - 새 메모 생성
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: projectId } = await params
    const body = await request.json()

    const validated = createMemoSchema.parse(body)

    const memo = await prisma.memo.create({
      data: {
        projectId,
        content: validated.content,
        chapterNumber: validated.chapterNumber ?? null,
      },
    })

    return NextResponse.json({ success: true, data: memo }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.errors[0].message },
        { status: 400 }
      )
    }
    console.error('메모 생성 오류:', error)
    return NextResponse.json(
      { success: false, error: '메모 생성에 실패했습니다.' },
      { status: 500 }
    )
  }
}

// PATCH /api/projects/[id]/memos - 메모 수정 (memoId는 body에서)
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: projectId } = await params
    const body = await request.json()
    const { memoId, ...updateData } = body

    if (!memoId) {
      return NextResponse.json(
        { success: false, error: '메모 ID가 필요합니다.' },
        { status: 400 }
      )
    }

    const validated = updateMemoSchema.parse(updateData)

    const existing = await prisma.memo.findFirst({
      where: { id: memoId, projectId },
    })

    if (!existing) {
      return NextResponse.json(
        { success: false, error: '메모를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    const memo = await prisma.memo.update({
      where: { id: memoId },
      data: validated,
    })

    return NextResponse.json({ success: true, data: memo })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.errors[0].message },
        { status: 400 }
      )
    }
    console.error('메모 수정 오류:', error)
    return NextResponse.json(
      { success: false, error: '메모 수정에 실패했습니다.' },
      { status: 500 }
    )
  }
}

// DELETE /api/projects/[id]/memos - 메모 삭제 (memoId는 query param에서)
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: projectId } = await params
    const { searchParams } = new URL(request.url)
    const memoId = searchParams.get('memoId')

    if (!memoId) {
      return NextResponse.json(
        { success: false, error: '메모 ID가 필요합니다.' },
        { status: 400 }
      )
    }

    const existing = await prisma.memo.findFirst({
      where: { id: memoId, projectId },
    })

    if (!existing) {
      return NextResponse.json(
        { success: false, error: '메모를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    await prisma.memo.delete({
      where: { id: memoId },
    })

    return NextResponse.json({ success: true, message: '메모가 삭제되었습니다.' })
  } catch (error) {
    console.error('메모 삭제 오류:', error)
    return NextResponse.json(
      { success: false, error: '메모 삭제에 실패했습니다.' },
      { status: 500 }
    )
  }
}
