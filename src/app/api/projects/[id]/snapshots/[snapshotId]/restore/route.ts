import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, checkProjectOwnership } from '@/lib/auth/auth-utils'
import { prisma } from '@/lib/db/client'

interface RouteParams {
  params: Promise<{ id: string; snapshotId: string }>
}

// POST /api/projects/[id]/snapshots/[snapshotId]/restore
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { userId, error: authError } = await requireAuth()
    if (authError) return authError

    const { id, snapshotId } = await params

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

    const snapshot = await prisma.projectSnapshot.findUnique({
      where: { id: snapshotId },
    })

    if (!snapshot || snapshot.projectId !== id) {
      return NextResponse.json(
        { success: false, error: '스냅샷을 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    const chaptersData = JSON.parse(snapshot.chaptersData) as {
      number: number
      title: string
      content: string
      status: string
    }[]

    // $transaction: 현재 상태 백업 후 복원
    await prisma.$transaction(async (tx) => {
      // 현재 상태 자동 백업
      await tx.projectSnapshot.create({
        data: {
          projectId: id,
          label: `복원 전 백업 (${new Date().toLocaleString('ko-KR')})`,
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

      // 프로젝트 기본 정보 복원
      await tx.project.update({
        where: { id },
        data: {
          stage: snapshot.stage,
          outline: snapshot.outlineData,
          bible: snapshot.bibleData,
        },
      })

      // 기존 챕터 삭제
      await tx.chapter.deleteMany({ where: { projectId: id } })

      // 스냅샷 챕터 복원
      for (const ch of chaptersData) {
        await tx.chapter.create({
          data: {
            projectId: id,
            number: ch.number,
            title: ch.title,
            content: ch.content,
            status: ch.status,
          },
        })
      }
    })

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json(
      { success: false, error: '스냅샷 복원에 실패했습니다.' },
      { status: 500 }
    )
  }
}
