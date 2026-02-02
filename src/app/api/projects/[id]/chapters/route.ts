import { NextRequest, NextResponse } from 'next/server'
import { projectRepository } from '@/lib/db/project-repository'

interface RouteParams {
  params: Promise<{ id: string }>
}

// POST /api/projects/[id]/chapters - 챕터 저장
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const body = await request.json()
    const { number, title, content, status } = body

    if (number === undefined || !title || content === undefined) {
      return NextResponse.json(
        { success: false, error: '필수 필드가 누락되었습니다.' },
        { status: 400 }
      )
    }

    const project = await projectRepository.findById(id)
    if (!project) {
      return NextResponse.json(
        { success: false, error: '프로젝트를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    const chapter = await projectRepository.saveChapter(id, { number, title, content, status })
    return NextResponse.json({ success: true, message: '챕터가 저장되었습니다.', data: chapter })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: '챕터 저장에 실패했습니다.' },
      { status: 500 }
    )
  }
}

// DELETE /api/projects/[id]/chapters - 챕터 삭제
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const chapterNumber = searchParams.get('number')

    if (!chapterNumber) {
      return NextResponse.json(
        { success: false, error: '챕터 번호가 필요합니다.' },
        { status: 400 }
      )
    }

    await projectRepository.deleteChapter(id, parseInt(chapterNumber, 10))
    return NextResponse.json({ success: true, message: '챕터가 삭제되었습니다.' })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: '챕터 삭제에 실패했습니다.' },
      { status: 500 }
    )
  }
}
