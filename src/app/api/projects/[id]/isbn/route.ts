import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/auth-utils'
import { z } from 'zod'
import { prisma } from '@/lib/db/client'
import { validateAndParseISBN, formatISBN, convertISBN13to10 } from '@/lib/isbn'
import { ISBNData, ISBNStatus } from '@/types/book'

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET: ISBN 조회
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { error: authError } = await requireAuth()
    if (authError) return authError

    const { id: projectId } = await params

    const isbn = await prisma.iSBN.findUnique({
      where: { projectId },
    })

    if (!isbn) {
      return NextResponse.json({
        success: true,
        data: null,
      })
    }

    const data: ISBNData = {
      id: isbn.id,
      projectId: isbn.projectId,
      isbn13: isbn.isbn13,
      isbn10: isbn.isbn10 || undefined,
      checkDigit: isbn.checkDigit,
      prefix: isbn.prefix,
      groupCode: isbn.groupCode,
      registrant: isbn.registrant,
      publication: isbn.publication,
      barcodeUrl: isbn.barcodeUrl || undefined,
      isValid: isbn.isValid,
      assignedAt: isbn.assignedAt || undefined,
      status: (isbn.status as ISBNStatus) || 'draft',
      appliedAt: isbn.appliedAt || undefined,
      issuedAt: isbn.issuedAt || undefined,
      createdAt: isbn.createdAt,
      updatedAt: isbn.updatedAt,
    }

    return NextResponse.json({
      success: true,
      data,
    })
  } catch (error) {
    console.error('Failed to get ISBN:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to get ISBN' },
      { status: 500 }
    )
  }
}

// POST: ISBN 저장
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { error: authError } = await requireAuth()
    if (authError) return authError

    const { id: projectId } = await params
    const body = await request.json()
    const { isbn: inputISBN, barcodeUrl } = body

    // ISBN 검증 및 파싱
    const result = validateAndParseISBN(inputISBN)

    if (!result.isValid || !result.isbn13 || !result.components) {
      return NextResponse.json(
        { success: false, error: result.error || '유효하지 않은 ISBN입니다.' },
        { status: 400 }
      )
    }

    const { isbn13, isbn10, components } = result

    // DB에 저장
    const isbn = await prisma.iSBN.upsert({
      where: { projectId },
      update: {
        isbn13,
        isbn10: isbn10 || null,
        checkDigit: components.checkDigit,
        prefix: components.prefix,
        groupCode: components.groupCode,
        registrant: components.registrant,
        publication: components.publication,
        barcodeUrl: barcodeUrl || null,
        isValid: true,
        assignedAt: new Date(),
      },
      create: {
        projectId,
        isbn13,
        isbn10: isbn10 || null,
        checkDigit: components.checkDigit,
        prefix: components.prefix,
        groupCode: components.groupCode,
        registrant: components.registrant,
        publication: components.publication,
        barcodeUrl: barcodeUrl || null,
        isValid: true,
        assignedAt: new Date(),
      },
    })

    const data: ISBNData = {
      id: isbn.id,
      projectId: isbn.projectId,
      isbn13: isbn.isbn13,
      isbn10: isbn.isbn10 || undefined,
      checkDigit: isbn.checkDigit,
      prefix: isbn.prefix,
      groupCode: isbn.groupCode,
      registrant: isbn.registrant,
      publication: isbn.publication,
      barcodeUrl: isbn.barcodeUrl || undefined,
      isValid: isbn.isValid,
      assignedAt: isbn.assignedAt || undefined,
      status: (isbn.status as ISBNStatus) || 'draft',
      appliedAt: isbn.appliedAt || undefined,
      issuedAt: isbn.issuedAt || undefined,
      createdAt: isbn.createdAt,
      updatedAt: isbn.updatedAt,
    }

    return NextResponse.json({
      success: true,
      data,
      formatted: formatISBN(isbn13),
    })
  } catch (error) {
    console.error('Failed to save ISBN:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to save ISBN' },
      { status: 500 }
    )
  }
}

// PATCH: ISBN 상태 변경
const PatchISBNSchema = z.object({
  status: z.enum(['draft', 'applied', 'issued']),
})

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { error: authError } = await requireAuth()
    if (authError) return authError

    const { id: projectId } = await params
    const body = await request.json()
    const { status } = PatchISBNSchema.parse(body)

    const updateData: Record<string, unknown> = { status }
    if (status === 'applied') {
      updateData.appliedAt = new Date()
    } else if (status === 'issued') {
      updateData.issuedAt = new Date()
    }

    const isbn = await prisma.iSBN.update({
      where: { projectId },
      data: updateData,
    })

    return NextResponse.json({
      success: true,
      data: {
        status: isbn.status,
        appliedAt: isbn.appliedAt,
        issuedAt: isbn.issuedAt,
      },
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid status value' },
        { status: 400 }
      )
    }
    console.error('Failed to update ISBN status:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update ISBN status' },
      { status: 500 }
    )
  }
}

// DELETE: ISBN 삭제
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { error: authError } = await requireAuth()
    if (authError) return authError

    const { id: projectId } = await params

    await prisma.iSBN.delete({
      where: { projectId },
    })

    return NextResponse.json({
      success: true,
    })
  } catch (error) {
    console.error('Failed to delete ISBN:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete ISBN' },
      { status: 500 }
    )
  }
}
