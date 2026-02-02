import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/client'
import { generateEPUB } from '@/lib/epub'
import { convertEPUBtoMOBI, checkKindleGen, KINDLEGEN_INSTALL_MESSAGE } from '@/lib/mobi'
import { BookProject, Chapter, BookMetadata, Author, BookCategory } from '@/types/book'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: projectId } = await params

    // KindleGen 설치 확인
    const kindlegenAvailable = await checkKindleGen()
    if (!kindlegenAvailable) {
      return NextResponse.json(
        {
          success: false,
          error: 'KindleGen이 설치되어 있지 않습니다.',
          message: KINDLEGEN_INSTALL_MESSAGE,
        },
        { status: 503 }
      )
    }

    // 프로젝트 조회
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        chapters: { orderBy: { number: 'asc' } },
        bookMetadata: true,
      },
    })

    if (!project) {
      return NextResponse.json(
        { success: false, error: 'Project not found' },
        { status: 404 }
      )
    }

    if (!project.chapters || project.chapters.length === 0) {
      return NextResponse.json(
        { success: false, error: '챕터가 없습니다.' },
        { status: 400 }
      )
    }

    // 데이터 변환
    const bookProject: BookProject = {
      id: project.id,
      title: project.title,
      type: project.type as any,
      description: project.description,
      outline: project.outline ? JSON.parse(project.outline) : null,
      chapters: [],
      status: project.status as any,
      stage: project.stage as any,
      targetAudience: project.targetAudience,
      targetLength: project.targetLength,
      tone: project.tone,
      confirmedAt: project.confirmedAt,
      userId: project.userId,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
    }

    const chapters: Chapter[] = project.chapters.map((ch: typeof project.chapters[number]) => ({
      id: ch.id,
      number: ch.number,
      title: ch.title,
      content: ch.content,
      status: ch.status as Chapter['status'],
      revisions: [],
    }))

    let metadata: BookMetadata | undefined
    if (project.bookMetadata) {
      const bm = project.bookMetadata
      metadata = {
        id: bm.id,
        projectId: bm.projectId,
        subtitle: bm.subtitle || undefined,
        authors: JSON.parse(bm.authors) as Author[],
        publisher: bm.publisher || undefined,
        publisherAddress: bm.publisherAddress || undefined,
        publishDate: bm.publishDate || undefined,
        edition: bm.edition || undefined,
        printRun: bm.printRun || undefined,
        categories: JSON.parse(bm.categories) as BookCategory[],
        keywords: JSON.parse(bm.keywords) as string[],
        language: bm.language,
        copyright: bm.copyright || undefined,
        license: bm.license || undefined,
      }
    }

    // EPUB 생성
    const epubBuffer = await generateEPUB(bookProject, chapters, metadata)

    // MOBI로 변환
    const mobiBuffer = await convertEPUBtoMOBI(epubBuffer)

    return new NextResponse(new Uint8Array(mobiBuffer), {
      headers: {
        'Content-Type': 'application/x-mobipocket-ebook',
        'Content-Disposition': `attachment; filename="${encodeURIComponent(project.title)}.mobi"`,
      },
    })
  } catch (error) {
    console.error('Failed to generate MOBI:', error)
    return NextResponse.json(
      { success: false, error: 'MOBI 생성에 실패했습니다.' },
      { status: 500 }
    )
  }
}

// GET: MOBI 생성 가능 여부 확인
export async function GET() {
  const available = await checkKindleGen()

  return NextResponse.json({
    success: true,
    available,
    message: available ? 'KindleGen 사용 가능' : KINDLEGEN_INSTALL_MESSAGE,
  })
}
