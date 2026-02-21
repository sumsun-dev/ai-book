import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/auth-utils'
import { z } from 'zod'
import { prisma } from '@/lib/db/client'
import { splitChapterToPages, countWords, getPageStatus } from '@/lib/page-utils'

type RouteParams = { params: Promise<{ id: string; chapterId: string }> }

const CreatePageSchema = z.object({
  pageNumber: z.number().int().positive(),
  content: z.string(),
})

const UpdatePagesSchema = z.object({
  pages: z.array(
    z.object({
      pageNumber: z.number().int().positive(),
      content: z.string(),
    })
  ),
})

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { error: authError } = await requireAuth()
    if (authError) return authError

    const { id, chapterId } = await params

    const chapter = await prisma.chapter.findFirst({
      where: { id: chapterId, projectId: id },
      include: { pages: { orderBy: { pageNumber: 'asc' } } },
    })

    if (!chapter) {
      return NextResponse.json({ error: 'Chapter not found' }, { status: 404 })
    }

    if (chapter.pages.length === 0) {
      const generatedPages = splitChapterToPages(chapter.content)
      return NextResponse.json({
        pages: generatedPages.map((p, idx) => ({
          id: `temp-${idx}`,
          chapterId,
          ...p,
        })),
        fromContent: true,
      })
    }

    return NextResponse.json({ pages: chapter.pages, fromContent: false })
  } catch {
    return NextResponse.json({ error: 'Failed to get pages' }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { error: authError } = await requireAuth()
    if (authError) return authError

    const { id, chapterId } = await params
    const body = await request.json()

    const parseResult = CreatePageSchema.safeParse(body)
    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: z.flattenError(parseResult.error) },
        { status: 400 }
      )
    }

    const { pageNumber, content } = parseResult.data

    const chapter = await prisma.chapter.findFirst({
      where: { id: chapterId, projectId: id },
    })

    if (!chapter) {
      return NextResponse.json({ error: 'Chapter not found' }, { status: 404 })
    }

    const wordCount = countWords(content)
    const status = getPageStatus(content)

    const page = await prisma.page.create({
      data: {
        chapterId,
        pageNumber,
        content,
        status,
        wordCount,
      },
    })

    return NextResponse.json({ page })
  } catch {
    return NextResponse.json({ error: 'Failed to create page' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { error: authError } = await requireAuth()
    if (authError) return authError

    const { id, chapterId } = await params
    const body = await request.json()

    const parseResult = UpdatePagesSchema.safeParse(body)
    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: z.flattenError(parseResult.error) },
        { status: 400 }
      )
    }

    const { pages } = parseResult.data

    const chapter = await prisma.chapter.findFirst({
      where: { id: chapterId, projectId: id },
    })

    if (!chapter) {
      return NextResponse.json({ error: 'Chapter not found' }, { status: 404 })
    }

    await prisma.$transaction(async (tx) => {
      await tx.page.deleteMany({ where: { chapterId } })

      for (const pageData of pages) {
        const wordCount = countWords(pageData.content)
        const status = getPageStatus(pageData.content)

        await tx.page.create({
          data: {
            chapterId,
            pageNumber: pageData.pageNumber,
            content: pageData.content,
            status,
            wordCount,
          },
        })
      }

      const mergedContent = pages
        .sort((a, b) => a.pageNumber - b.pageNumber)
        .map((p) => p.content)
        .filter((c) => c.trim())
        .join('\n\n')

      await tx.chapter.update({
        where: { id: chapterId },
        data: { content: mergedContent },
      })
    })

    const updatedPages = await prisma.page.findMany({
      where: { chapterId },
      orderBy: { pageNumber: 'asc' },
    })

    return NextResponse.json({ pages: updatedPages })
  } catch {
    return NextResponse.json({ error: 'Failed to update pages' }, { status: 500 })
  }
}
