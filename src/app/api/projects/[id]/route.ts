import { NextRequest, NextResponse } from 'next/server'
import { projectRepository } from '@/lib/db/project-repository'
import { requireAuth, checkProjectOwnership } from '@/lib/auth/auth-utils'

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET /api/projects/[id] - 단일 프로젝트 조회
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { userId, error: authError } = await requireAuth()
    if (authError) return authError

    const { id } = await params
    const project = await projectRepository.findById(id)

    if (!project) {
      return NextResponse.json(
        { success: false, error: '프로젝트를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    const ownerError = checkProjectOwnership(project.userId, userId!)
    if (ownerError) return ownerError

    return NextResponse.json({ success: true, data: project })
  } catch (_error) {
    return NextResponse.json(
      { success: false, error: '프로젝트를 불러오는데 실패했습니다.' },
      { status: 500 }
    )
  }
}

// PUT /api/projects/[id] - 프로젝트 수정
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { userId, error: authError } = await requireAuth()
    if (authError) return authError

    const { id } = await params
    const body = await request.json()

    const existing = await projectRepository.findById(id)
    if (!existing) {
      return NextResponse.json(
        { success: false, error: '프로젝트를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    const ownerError = checkProjectOwnership(existing.userId, userId!)
    if (ownerError) return ownerError

    const project = await projectRepository.update(id, body)
    return NextResponse.json({ success: true, data: project })
  } catch (_error) {
    return NextResponse.json(
      { success: false, error: '프로젝트 수정에 실패했습니다.' },
      { status: 500 }
    )
  }
}

// DELETE /api/projects/[id] - 프로젝트 삭제
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { userId, error: authError } = await requireAuth()
    if (authError) return authError

    const { id } = await params

    const existing = await projectRepository.findById(id)
    if (!existing) {
      return NextResponse.json(
        { success: false, error: '프로젝트를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    const ownerError = checkProjectOwnership(existing.userId, userId!)
    if (ownerError) return ownerError

    await projectRepository.delete(id)
    return NextResponse.json({ success: true, message: '프로젝트가 삭제되었습니다.' })
  } catch (_error) {
    return NextResponse.json(
      { success: false, error: '프로젝트 삭제에 실패했습니다.' },
      { status: 500 }
    )
  }
}
