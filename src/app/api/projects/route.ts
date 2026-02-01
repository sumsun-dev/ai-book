import { NextRequest, NextResponse } from 'next/server'
import { projectRepository } from '@/lib/db/project-repository'
import type { UploadFileType } from '@/types/book'

interface SourceFileData {
  fileName: string
  fileType: UploadFileType
  fileSize: number
  rawContent: string
}

interface ChapterData {
  number: number
  title: string
  content: string
  status: string
}

// GET /api/projects - 프로젝트 목록 조회
export async function GET() {
  try {
    const projects = await projectRepository.findAll()
    return NextResponse.json({ success: true, data: projects })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: '프로젝트 목록을 불러오는데 실패했습니다.' },
      { status: 500 }
    )
  }
}

// POST /api/projects - 새 프로젝트 생성
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { title, type, description, sourceFile, chapters } = body as {
      title: string
      type: string
      description: string
      sourceFile?: SourceFileData
      chapters?: ChapterData[]
    }

    if (!title || !type || !description) {
      return NextResponse.json(
        { success: false, error: '필수 필드가 누락되었습니다.' },
        { status: 400 }
      )
    }

    const project = await projectRepository.createWithFile({
      title,
      type,
      description,
      sourceFile,
      chapters
    })

    return NextResponse.json({ success: true, data: project }, { status: 201 })
  } catch (error) {
    console.error('Project creation error:', error)
    return NextResponse.json(
      { success: false, error: '프로젝트 생성에 실패했습니다.' },
      { status: 500 }
    )
  }
}
