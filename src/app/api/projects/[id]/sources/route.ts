import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/client'

const VALID_SOURCE_TYPES = ['book', 'article', 'website', 'other'] as const

type RouteParams = { params: Promise<{ id: string }> }

export async function GET(
  _request: NextRequest,
  { params }: RouteParams
) {
  const { id: projectId } = await params

  const project = await prisma.project.findUnique({
    where: { id: projectId },
  })

  if (!project) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 })
  }

  const sources = await prisma.source.findMany({
    where: { projectId },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json({ success: true, data: sources })
}

export async function POST(
  request: NextRequest,
  { params }: RouteParams
) {
  const { id: projectId } = await params

  const project = await prisma.project.findUnique({
    where: { id: projectId },
  })

  if (!project) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 })
  }

  const body = await request.json()
  const { title, author, url, type, notes } = body

  if (!title || typeof title !== 'string' || !title.trim()) {
    return NextResponse.json({ error: 'Title is required' }, { status: 400 })
  }

  if (type && !VALID_SOURCE_TYPES.includes(type)) {
    return NextResponse.json({ error: 'Invalid source type' }, { status: 400 })
  }

  const source = await prisma.source.create({
    data: {
      projectId,
      title: title.trim(),
      author: author?.trim() || null,
      url: url?.trim() || null,
      type: type || 'other',
      notes: notes?.trim() || null,
    },
  })

  return NextResponse.json({ success: true, data: source }, { status: 201 })
}

export async function PATCH(
  request: NextRequest,
  { params }: RouteParams
) {
  const { id: projectId } = await params
  const body = await request.json()
  const { sourceId, title, author, url, type, notes } = body

  if (!sourceId) {
    return NextResponse.json({ error: 'Source ID is required' }, { status: 400 })
  }

  const existingSource = await prisma.source.findFirst({
    where: { id: sourceId, projectId },
  })

  if (!existingSource) {
    return NextResponse.json({ error: 'Source not found' }, { status: 404 })
  }

  if (type && !VALID_SOURCE_TYPES.includes(type)) {
    return NextResponse.json({ error: 'Invalid source type' }, { status: 400 })
  }

  const updateData: Record<string, string | null> = {}
  if (title !== undefined) updateData.title = title?.trim() || existingSource.title
  if (author !== undefined) updateData.author = author?.trim() || null
  if (url !== undefined) updateData.url = url?.trim() || null
  if (type !== undefined) updateData.type = type
  if (notes !== undefined) updateData.notes = notes?.trim() || null

  const source = await prisma.source.update({
    where: { id: sourceId },
    data: updateData,
  })

  return NextResponse.json({ success: true, data: source })
}

export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  const { id: projectId } = await params
  const { searchParams } = new URL(request.url)
  const sourceId = searchParams.get('sourceId')

  if (!sourceId) {
    return NextResponse.json({ error: 'Source ID is required' }, { status: 400 })
  }

  const existingSource = await prisma.source.findFirst({
    where: { id: sourceId, projectId },
  })

  if (!existingSource) {
    return NextResponse.json({ error: 'Source not found' }, { status: 404 })
  }

  await prisma.source.delete({
    where: { id: sourceId },
  })

  return NextResponse.json({ success: true })
}
