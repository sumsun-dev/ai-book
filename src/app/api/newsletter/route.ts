import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db/client'

const SubscribeSchema = z.object({
  email: z.string().email(),
  locale: z.enum(['ko', 'en']).optional().default('ko'),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, locale } = SubscribeSchema.parse(body)

    await prisma.newsletterSubscriber.upsert({
      where: { email },
      update: { isActive: true, locale },
      create: { email, locale },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: 'Failed to subscribe' },
      { status: 500 }
    )
  }
}
