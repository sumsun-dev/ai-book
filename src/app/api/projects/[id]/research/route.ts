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
