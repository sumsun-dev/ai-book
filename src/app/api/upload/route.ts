import { NextRequest, NextResponse } from 'next/server'
import { parseBuffer, FileParseError } from '@/lib/file-parser'

const ALLOWED_EXTENSIONS = ['txt', 'docx', 'pdf'] as const
const ALLOWED_MIME_TYPES: Record<string, string> = {
  'text/plain': 'txt',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  'application/pdf': 'pdf',
}
const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB

function sanitizeFileName(fileName: string): string {
  const baseName = fileName.split(/[/\\]/).pop() || 'file'
  return baseName
    .replace(/^\.+/, '')
    .replace(/[^\w.\-가-힣]/g, '_')
    .slice(0, 200)
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json(
        { success: false, error: '파일이 없습니다.' },
        { status: 400 }
      )
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, error: '파일 크기가 50MB를 초과합니다.' },
        { status: 400 }
      )
    }

    const extension = file.name.split('.').pop()?.toLowerCase()
    if (!extension || !ALLOWED_EXTENSIONS.includes(extension as typeof ALLOWED_EXTENSIONS[number])) {
      return NextResponse.json(
        { success: false, error: '지원하지 않는 파일 형식입니다. (txt, docx, pdf만 지원)' },
        { status: 400 }
      )
    }

    if (file.type && !ALLOWED_MIME_TYPES[file.type]) {
      return NextResponse.json(
        { success: false, error: '잘못된 파일 형식입니다.' },
        { status: 400 }
      )
    }

    const sanitizedFileName = sanitizeFileName(file.name)
    const buffer = await file.arrayBuffer()
    const parsed = await parseBuffer(buffer, sanitizedFileName, file.size)

    return NextResponse.json({
      success: true,
      data: {
        content: parsed.content,
        fileName: parsed.fileName,
        fileType: parsed.fileType,
        fileSize: parsed.fileSize
      }
    })
  } catch (error) {
    if (error instanceof FileParseError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      )
    }

    console.error('File upload error:', error)
    return NextResponse.json(
      { success: false, error: '파일 처리 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
