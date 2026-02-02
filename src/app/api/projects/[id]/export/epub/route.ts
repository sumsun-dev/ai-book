import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/client'
import { generateEPUB } from '@/lib/epub'
import { BookProject, Chapter, BookMetadata, Author, BookCategory } from '@/types/book'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: projectId } = await params
    const body = await request.json()

    const {
      includeTableOfContents = true,
      includeTitlePage = true,
      includeColophon = true,
      styleOptions = {},
    } = body

    // 프로젝트 조회
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        chapters: {
          orderBy: { number: 'asc' },
        },
        bookMetadata: true,
      },
    })

    if (!project) {
      return NextResponse.json(
        { success: false, error: 'Project not found' },
        { status: 404 }
      )
    }

    // 챕터가 없으면 에러
    if (!project.chapters || project.chapters.length === 0) {
      return NextResponse.json(
        { success: false, error: '챕터가 없습니다.' },
        { status: 400 }
      )
    }

    // BookProject 형식으로 변환
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

    // 챕터 변환
    const chapters: Chapter[] = project.chapters.map((ch: typeof project.chapters[number]) => ({
      id: ch.id,
      number: ch.number,
      title: ch.title,
      content: ch.content,
      status: ch.status as Chapter['status'],
      revisions: [],
    }))

    // 메타데이터 변환
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
    const epubBuffer = await generateEPUB(bookProject, chapters, metadata, {
      includeTableOfContents,
      includeTitlePage,
      includeColophon,
      styleOptions,
    })

    // Blob으로 반환
    return new NextResponse(new Uint8Array(epubBuffer), {
      headers: {
        'Content-Type': 'application/epub+zip',
        'Content-Disposition': `attachment; filename="${encodeURIComponent(project.title)}.epub"`,
      },
    })
  } catch (error) {
    console.error('Failed to generate EPUB:', error)
    return NextResponse.json(
      { success: false, error: 'EPUB 생성에 실패했습니다.' },
      { status: 500 }
    )
  }
}

// GET: EPUB 정보 조회
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: projectId } = await params

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        chapters: true,
        bookMetadata: true,
      },
    })

    if (!project) {
      return NextResponse.json(
        { success: false, error: 'Project not found' },
        { status: 404 }
      )
    }

    const chapterCount = project.chapters?.length || 0
    const totalWords = project.chapters?.reduce((sum: number, ch: { content: string }) => {
      const words = ch.content.split(/\s+/).filter((w: string) => w.length > 0).length
      return sum + words
    }, 0) || 0

    return NextResponse.json({
      success: true,
      data: {
        title: project.title,
        chapterCount,
        totalWords,
        hasMetadata: !!project.bookMetadata,
        canExport: chapterCount > 0,
      },
    })
  } catch (error) {
    console.error('Failed to get EPUB info:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to get export info' },
      { status: 500 }
    )
  }
}
