import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/client'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const researchData = await prisma.researchData.findUnique({
      where: { projectId: id }
    })

    if (!researchData) {
      return NextResponse.json({ researchData: null })
    }

    return NextResponse.json({
      researchData: {
        id: researchData.id,
        projectId: researchData.projectId,
        initialIdea: researchData.initialIdea,
        aiQuestions: JSON.parse(researchData.aiQuestions || '[]'),
        userAnswers: JSON.parse(researchData.userAnswers || '[]'),
        findings: researchData.findings ? JSON.parse(researchData.findings) : null,
        references: JSON.parse(researchData.references || '[]')
      }
    })
  } catch (error) {
    console.error('Failed to fetch research data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch research data' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { initialIdea, userAnswers, findings } = body

    const existingData = await prisma.researchData.findUnique({
      where: { projectId: id }
    })

    if (!existingData) {
      return NextResponse.json(
        { error: 'Research data not found' },
        { status: 404 }
      )
    }

    const updateData: Record<string, string> = {}

    if (initialIdea !== undefined) {
      updateData.initialIdea = initialIdea
    }
    if (userAnswers !== undefined) {
      updateData.userAnswers = JSON.stringify(userAnswers)
    }
    if (findings !== undefined) {
      updateData.findings = JSON.stringify(findings)
    }

    const updated = await prisma.researchData.update({
      where: { projectId: id },
      data: updateData
    })

    return NextResponse.json({
      success: true,
      researchData: {
        id: updated.id,
        projectId: updated.projectId,
        initialIdea: updated.initialIdea,
        aiQuestions: JSON.parse(updated.aiQuestions || '[]'),
        userAnswers: JSON.parse(updated.userAnswers || '[]'),
        findings: updated.findings ? JSON.parse(updated.findings) : null,
        references: JSON.parse(updated.references || '[]')
      }
    })
  } catch (error) {
    console.error('Failed to update research data:', error)
    return NextResponse.json(
      { error: 'Failed to update research data' },
      { status: 500 }
    )
  }
}
