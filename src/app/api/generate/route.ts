import { NextRequest, NextResponse } from 'next/server'
import { runResearchAgent } from '@/agents/research'
import { runOutlinerAgent } from '@/agents/outliner'
import { runWriterAgent } from '@/agents/writer'
import { runEditorAgent } from '@/agents/editor'
import { runCriticAgent } from '@/agents/critic'
import { runEditorCriticLoop, runSinglePassEditorCritic } from '@/agents/editor-critic'
import { BookType } from '@/types/book'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { phase } = body

    switch (phase) {
      case 'research': {
        const { bookType, title, description } = body as {
          bookType: BookType
          title: string
          description: string
        }
        const research = await runResearchAgent(bookType, `${title}: ${description}`)
        return NextResponse.json({ research })
      }

      case 'outline': {
        const { bookType, title, description, research } = body
        const outline = await runOutlinerAgent(bookType, title, description, research)
        return NextResponse.json({ outline })
      }

      case 'write': {
        const { bookType, outline, chapter } = body
        const content = await runWriterAgent(bookType, outline, chapter)
        return NextResponse.json({ content })
      }

      case 'edit': {
        const { content, chapterTitle, tone } = body
        const result = await runEditorAgent(content, chapterTitle, tone)
        return NextResponse.json(result)
      }

      case 'critic': {
        const { content, chapterTitle, targetAudience, tone } = body
        const result = await runCriticAgent(content, chapterTitle, targetAudience, tone)
        return NextResponse.json(result)
      }

      case 'editor-critic': {
        const {
          content,
          chapterTitle,
          targetAudience,
          tone,
          useFeedbackLoop = false,
          maxIterations = 3,
          passThreshold = 7
        } = body as {
          content: string
          chapterTitle: string
          targetAudience: string
          tone: string
          useFeedbackLoop?: boolean
          maxIterations?: number
          passThreshold?: number
        }

        if (useFeedbackLoop) {
          const result = await runEditorCriticLoop(
            content,
            chapterTitle,
            targetAudience,
            tone,
            { maxIterations, passThreshold }
          )
          return NextResponse.json(result)
        } else {
          const result = await runSinglePassEditorCritic(
            content,
            chapterTitle,
            targetAudience,
            tone
          )
          return NextResponse.json(result)
        }
      }

      default:
        return NextResponse.json({ error: 'Invalid phase' }, { status: 400 })
    }
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
