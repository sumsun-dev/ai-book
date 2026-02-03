import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/client'
import type { BookBible } from '@/types/book-bible'
import { createEmptyBible } from '@/types/book-bible'

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET /api/projects/[id]/bible - Bible 조회
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
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
    console.error('Bible GET error:', error)
    return NextResponse.json(
      { success: false, error: 'Bible을 불러오는데 실패했습니다.' },
      { status: 500 }
    )
  }
}

// PUT /api/projects/[id]/bible - Bible 저장
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const bible: BookBible = await request.json()

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
    console.error('Bible PUT error:', error)
    return NextResponse.json(
      { success: false, error: 'Bible 저장에 실패했습니다.' },
      { status: 500 }
    )
  }
}
