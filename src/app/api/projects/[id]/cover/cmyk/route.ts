import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/client'
import {
  prepareForPrint,
  preparePrintReadyCover,
  validatePrintQuality,
  calculateSpineWidth,
} from '@/lib/cmyk'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: projectId } = await params
    const body = await request.json()

    const {
      dpi = 300,
      bleed = 3,
      cropMarks = false,
      paperSize = 'a5',
      pageCount = 100,
    } = body

    // 프로젝트 및 표지 이미지 조회
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { coverImage: true },
    })

    if (!project) {
      return NextResponse.json(
        { success: false, error: 'Project not found' },
        { status: 404 }
      )
    }

    if (!project.coverImage?.imageUrl) {
      return NextResponse.json(
        { success: false, error: '표지 이미지가 없습니다.' },
        { status: 400 }
      )
    }

    // 표지 이미지 다운로드
    const coverResponse = await fetch(project.coverImage.imageUrl)
    if (!coverResponse.ok) {
      return NextResponse.json(
        { success: false, error: '표지 이미지를 다운로드할 수 없습니다.' },
        { status: 400 }
      )
    }

    const coverBuffer = Buffer.from(await coverResponse.arrayBuffer())

    // 용지 크기별 치수 (mm)
    const paperDimensions: Record<string, { width: number; height: number }> = {
      a4: { width: 210, height: 297 },
      a5: { width: 148, height: 210 },
      b5: { width: 176, height: 250 },
      novel: { width: 128, height: 188 },
    }

    const dimensions = paperDimensions[paperSize] || paperDimensions.a5
    const spineWidth = calculateSpineWidth(pageCount)

    // 인쇄용 표지 생성
    const printCoverBuffer = await preparePrintReadyCover(
      coverBuffer,
      {
        width: dimensions.width,
        height: dimensions.height,
        spineWidth,
        bleed,
      },
      { dpi, bleed, cropMarks }
    )

    return new NextResponse(new Uint8Array(printCoverBuffer), {
      headers: {
        'Content-Type': 'image/tiff',
        'Content-Disposition': `attachment; filename="${encodeURIComponent(project.title)}-cover-print.tiff"`,
      },
    })
  } catch (error) {
    console.error('Failed to generate print cover:', error)
    return NextResponse.json(
      { success: false, error: '인쇄용 표지 생성에 실패했습니다.' },
      { status: 500 }
    )
  }
}

// GET: 표지 품질 검사
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: projectId } = await params

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { coverImage: true },
    })

    if (!project) {
      return NextResponse.json(
        { success: false, error: 'Project not found' },
        { status: 404 }
      )
    }

    if (!project.coverImage?.imageUrl) {
      return NextResponse.json({
        success: true,
        data: {
          hasCover: false,
          isValid: false,
          issues: ['표지 이미지가 없습니다.'],
        },
      })
    }

    // 표지 이미지 다운로드
    const coverResponse = await fetch(project.coverImage.imageUrl)
    if (!coverResponse.ok) {
      return NextResponse.json({
        success: true,
        data: {
          hasCover: true,
          isValid: false,
          issues: ['표지 이미지를 다운로드할 수 없습니다.'],
        },
      })
    }

    const coverBuffer = Buffer.from(await coverResponse.arrayBuffer())
    const validation = await validatePrintQuality(coverBuffer)

    return NextResponse.json({
      success: true,
      data: {
        hasCover: true,
        ...validation,
      },
    })
  } catch (error) {
    console.error('Failed to validate cover:', error)
    return NextResponse.json(
      { success: false, error: '표지 검사에 실패했습니다.' },
      { status: 500 }
    )
  }
}
