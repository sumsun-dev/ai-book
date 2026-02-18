import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, checkProjectOwnership } from '@/lib/auth/auth-utils'
import { prisma } from '@/lib/db/client'

const MAX_SNAPSHOTS = 20

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET /api/projects/[id]/snapshots
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { userId, error: authError } = await requireAuth()
    if (authError) return authError

    const { id } = await params
    const project = await prisma.project.findUnique({
      where: { id },
      select: { userId: true },
    })
    if (!project) {
      return NextResponse.json(
        { success: false, error: '프로젝트를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }
    const ownerError = checkProjectOwnership(project.userId, userId!)
    if (ownerError) return ownerError

    const snapshots = await prisma.projectSnapshot.findMany({
      where: { projectId: id },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ success: true, data: snapshots })
  } catch {
    return NextResponse.json(
      { success: false, error: '스냅샷 목록 조회에 실패했습니다.' },
      { status: 500 }
    )
  }
}

// POST /api/projects/[id]/snapshots
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { userId, error: authError } = await requireAuth()
    if (authError) return authError

    const { id } = await params
    const body = await request.json()
    const { label } = body as { label: string }

    if (!label || typeof label !== 'string') {
      return NextResponse.json(
        { success: false, error: '레이블은 필수입니다.' },
        { status: 400 }
      )
    }

    const project = await prisma.project.findUnique({
      where: { id },
      include: { chapters: true },
    })

    if (!project) {
      return NextResponse.json(
        { success: false, error: '프로젝트를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    const ownerError = checkProjectOwnership(project.userId, userId!)
    if (ownerError) return ownerError

    // 최대 개수 제한 확인
    const count = await prisma.projectSnapshot.count({
      where: { projectId: id },
    })
    if (count >= MAX_SNAPSHOTS) {
      // 가장 오래된 스냅샷 삭제
      const oldest = await prisma.projectSnapshot.findFirst({
        where: { projectId: id },
        orderBy: { createdAt: 'asc' },
      })
      if (oldest) {
        await prisma.projectSnapshot.delete({ where: { id: oldest.id } })
      }
    }

    const snapshot = await prisma.projectSnapshot.create({
      data: {
        projectId: id,
        label,
        stage: project.stage,
        outlineData: project.outline,
        chaptersData: JSON.stringify(
          project.chapters.map((ch) => ({
            number: ch.number,
            title: ch.title,
            content: ch.content,
            status: ch.status,
          }))
        ),
        bibleData: project.bible,
      },
    })

    return NextResponse.json({ success: true, data: snapshot })
  } catch {
    return NextResponse.json(
      { success: false, error: '스냅샷 생성에 실패했습니다.' },
      { status: 500 }
    )
  }
}

// DELETE /api/projects/[id]/snapshots
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { userId, error: authError } = await requireAuth()
    if (authError) return authError

    const { id } = await params
    const body = await request.json()
    const { snapshotId } = body as { snapshotId: string }

    const project = await prisma.project.findUnique({
      where: { id },
      select: { userId: true },
    })
    if (!project) {
      return NextResponse.json(
        { success: false, error: '프로젝트를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }
    const ownerError = checkProjectOwnership(project.userId, userId!)
    if (ownerError) return ownerError

    await prisma.projectSnapshot.delete({ where: { id: snapshotId } })

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json(
      { success: false, error: '스냅샷 삭제에 실패했습니다.' },
      { status: 500 }
    )
  }
}
