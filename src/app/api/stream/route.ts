import { NextRequest } from 'next/server'
import { requireAuth } from '@/lib/auth/auth-utils'
import { runWriterAgent } from '@/agents/writer'
import { BookOutline, ChapterOutline, BookType } from '@/types/book'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const { error: authError } = await requireAuth()
    if (authError) return authError

    const body = await request.json()
    const { phase, bookType, outline, chapter } = body as {
      phase: string
      bookType: BookType
      outline: BookOutline
      chapter: ChapterOutline
    }

    if (phase !== 'write') {
      return new Response(
        JSON.stringify({ error: 'Only write phase supports streaming' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const encoder = new TextEncoder()

    const stream = new ReadableStream({
      async start(controller) {
        try {
          const sendEvent = (event: string, data: unknown) => {
            controller.enqueue(
              encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
            )
          }

          sendEvent('start', { chapterNumber: chapter.number, title: chapter.title })

          const fullContent = await runWriterAgent(
            bookType,
            outline,
            chapter,
            undefined,
            (chunk: string) => {
              sendEvent('chunk', { text: chunk })
            }
          )

          sendEvent('complete', {
            chapterNumber: chapter.number,
            content: fullContent
          })

          controller.close()
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error'
          controller.enqueue(
            encoder.encode(`event: error\ndata: ${JSON.stringify({ error: errorMessage })}\n\n`)
          )
          controller.close()
        }
      },
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })
  } catch (_error) {
    return new Response(
      JSON.stringify({ error: 'Failed to start streaming' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}
