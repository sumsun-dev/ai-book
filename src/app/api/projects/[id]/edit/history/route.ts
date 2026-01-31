import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/client'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { chapterId, type, agent, beforeContent, afterContent, feedback } = await request.json()

    const history = await prisma.editHistory.create({
      data: {
        projectId: id,
        chapterId,
        type,
        agent,
        beforeContent,
        afterContent,
        feedback
      }
    })

    return NextResponse.json({ history })
  } catch (error) {
    console.error('Failed to save edit history:', error)
    return NextResponse.json(
      { error: 'Failed to save edit history' },
      { status: 500 }
    )
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const chapterId = searchParams.get('chapterId')

    const where: { projectId: string; chapterId?: string } = { projectId: id }
    if (chapterId) {
      where.chapterId = chapterId
    }

    const history = await prisma.editHistory.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ history })
  } catch (error) {
    console.error('Failed to fetch edit history:', error)
    return NextResponse.json(
      { error: 'Failed to fetch edit history' },
      { status: 500 }
    )
  }
}
