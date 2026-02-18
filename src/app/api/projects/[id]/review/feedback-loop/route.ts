import { NextRequest } from 'next/server'
import { requireAuth } from '@/lib/auth/auth-utils'
import { z } from 'zod'
import { prisma } from '@/lib/db/client'
import { runEditorCriticLoop } from '@/agents/editor-critic'

const FeedbackLoopSchema = z.object({
  chapterNumber: z.number().int().positive(),
  maxIterations: z.number().int().min(1).max(3).optional().default(3),
  passThreshold: z.number().min(5).max(9).optional().default(7),
})

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth()
    const { id: projectId } = await params
    const body = await request.json()
    const { chapterNumber, maxIterations, passThreshold } = FeedbackLoopSchema.parse(body)

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        chapters: { where: { number: chapterNumber } },
      },
    })

    if (!project) {
      return new Response(
        JSON.stringify({ error: 'Project not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const chapter = project.chapters[0]
    if (!chapter) {
      return new Response(
        JSON.stringify({ error: 'Chapter not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const outline = project.outline ? JSON.parse(project.outline) : null
    const targetAudience = outline?.targetAudience || project.targetAudience || '일반 독자'
    const targetTone = outline?.tone || project.tone || '친근체'

    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const sendEvent = (event: string, data: Record<string, unknown>) => {
            controller.enqueue(
              encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
            )
          }

          const result = await runEditorCriticLoop(
            chapter.content,
            chapter.title,
            targetAudience,
            targetTone,
            {
              maxIterations,
              passThreshold,
              onIteration: (iteration, iterResult) => {
                sendEvent('iteration_start', { iteration, total: maxIterations })

                sendEvent('iteration_result', {
                  iteration,
                  scores: iterResult.qualityEvaluation.scores,
                  overallScore: iterResult.qualityEvaluation.overallScore,
                  decision: iterResult.qualityEvaluation.decision,
                  strengths: iterResult.qualityEvaluation.strengths,
                  weaknesses: iterResult.qualityEvaluation.weaknesses,
                })
              },
            }
          )

          // DB 저장: 수정된 챕터 content 업데이트
          await prisma.chapter.update({
            where: { id: chapter.id },
            data: { content: result.editedContent },
          })

          // EditHistory 기록
          await prisma.editHistory.create({
            data: {
              projectId,
              chapterId: chapter.id,
              type: 'revision',
              agent: 'editor-critic',
              beforeContent: chapter.content,
              afterContent: result.editedContent,
              feedback: JSON.stringify({
                iterationCount: result.iterationCount,
                finalStatus: result.finalStatus,
                overallScore: result.qualityEvaluation.overallScore,
              }),
            },
          })

          sendEvent('complete', {
            finalStatus: result.finalStatus,
            iterationCount: result.iterationCount,
            overallScore: result.qualityEvaluation.overallScore,
            scores: result.qualityEvaluation.scores,
            strengths: result.qualityEvaluation.strengths,
            weaknesses: result.qualityEvaluation.weaknesses,
            grammarErrors: result.grammarCheck.totalErrors,
          })

          controller.close()
        } catch (error) {
          console.error('Feedback loop error:', error instanceof Error ? error.message : error)
          controller.enqueue(
            encoder.encode(`event: error\ndata: ${JSON.stringify({ error: 'Feedback loop failed. Please try again.' })}\n\n`)
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
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new Response(
        JSON.stringify({ error: 'Invalid request', details: error.errors }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }
    return new Response(
      JSON.stringify({ error: 'Failed to start feedback loop' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}
