import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/auth-utils'
import { prisma } from '@/lib/db/client'
import { runConsistencyCheck } from '@/agents/consistency-checker'

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth()
    const { id: projectId } = await params

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        chapters: {
          orderBy: { number: 'asc' },
        },
      },
    })

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      )
    }

    if (project.chapters.length < 2) {
      return NextResponse.json({
        report: {
          issues: [],
          checkedAt: new Date(),
          chapterCount: project.chapters.length,
          summary: '검사할 챕터가 2개 미만입니다.',
        },
      })
    }

    const chaptersData = project.chapters.map((ch) => ({
      number: ch.number,
      title: ch.title,
      content: ch.content,
    }))

    const report = await runConsistencyCheck(chaptersData)

    return NextResponse.json({ report })
  } catch {
    return NextResponse.json(
      { error: 'Failed to run consistency check' },
      { status: 500 }
    )
  }
}
