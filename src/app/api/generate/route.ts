import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/auth-utils'
import { handleApiError } from '@/lib/api-utils'
import { runResearchAgent } from '@/agents/research'
import { runOutlinerAgent, refineOutline, generateTableOfContents } from '@/agents/outliner'
import { runWriterAgentWithUsage } from '@/agents/writer'
import { runEditorAgent } from '@/agents/editor'
import { runCriticAgent } from '@/agents/critic'
import { runEditorCriticLoop, runSinglePassEditorCritic } from '@/agents/editor-critic'
import { BookType, OutlineFeedback, BookOutline } from '@/types/book'
import { checkQuota, recordUsage } from '@/lib/token-quota'

type Usage = { inputTokens: number; outputTokens: number }

function extractUsage(result: unknown): Usage | null {
  if (result && typeof result === 'object' && '_usage' in result) {
    return (result as { _usage: Usage })._usage
  }
  return null
}

export async function POST(request: NextRequest) {
  try {
    const { userId, error: authError } = await requireAuth()
    if (authError) return authError

    await checkQuota(userId!)

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
        const usage = extractUsage(research)
        if (usage) recordUsage(userId!, 'research', usage).catch(console.error)
        return NextResponse.json({ research })
      }

      case 'outline': {
        const { bookType, title, description, research } = body
        const outline = await runOutlinerAgent(bookType, title, description, research)
        const usage = extractUsage(outline)
        if (usage) recordUsage(userId!, 'outliner', usage).catch(console.error)
        const toc = generateTableOfContents(title, outline)
        return NextResponse.json({ outline, toc })
      }

      case 'refine': {
        const { outline, feedback, title } = body as { outline: BookOutline; feedback: OutlineFeedback; title: string }
        const refinedOutline = await refineOutline(outline, feedback)
        const usage = extractUsage(refinedOutline)
        if (usage) recordUsage(userId!, 'outliner-refine', usage).catch(console.error)
        const toc = generateTableOfContents(title || 'Untitled', refinedOutline)
        return NextResponse.json({ outline: refinedOutline, toc })
      }

      case 'toc': {
        const { title, outline } = body
        const toc = generateTableOfContents(title, outline)
        return NextResponse.json({ toc })
      }

      case 'write': {
        const { bookType, outline, chapter } = body
        const result = await runWriterAgentWithUsage(bookType, outline, chapter)
        recordUsage(userId!, 'writer', result.usage).catch(console.error)
        return NextResponse.json({ content: result.text })
      }

      case 'edit': {
        const { content, chapterTitle, tone } = body
        const result = await runEditorAgent(content, chapterTitle, tone)
        const usage = extractUsage(result)
        if (usage) recordUsage(userId!, 'editor', usage).catch(console.error)
        return NextResponse.json(result)
      }

      case 'critic': {
        const { content, chapterTitle, targetAudience, tone } = body
        const result = await runCriticAgent(content, chapterTitle, targetAudience, tone)
        const usage = extractUsage(result)
        if (usage) recordUsage(userId!, 'critic', usage).catch(console.error)
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
          const usage = extractUsage(result)
          if (usage) recordUsage(userId!, 'editor-critic-loop', usage).catch(console.error)
          return NextResponse.json(result)
        } else {
          const result = await runSinglePassEditorCritic(
            content,
            chapterTitle,
            targetAudience,
            tone
          )
          const usage = extractUsage(result)
          if (usage) recordUsage(userId!, 'editor-critic', usage).catch(console.error)
          return NextResponse.json(result)
        }
      }

      case 'inline-edit': {
        const { originalText, instruction, context } = body as {
          originalText: string
          instruction: string
          context?: string
        }

        const prompt = `당신은 전문 편집자입니다. 주어진 텍스트를 사용자의 요청에 맞게 수정해주세요.

${context ? `컨텍스트: ${context}\n` : ''}
원문:
"""
${originalText}
"""

수정 요청: ${instruction}

수정된 텍스트만 출력해주세요. 설명이나 추가 코멘트 없이 수정된 텍스트만 반환합니다.`

        const { runEditorAgent } = await import('@/agents/editor')
        const result = await runEditorAgent(prompt, 'inline-edit', '')
        const usage = extractUsage(result)
        if (usage) recordUsage(userId!, 'inline-editor', usage).catch(console.error)

        return NextResponse.json({
          original: originalText,
          edited: result.editedContent || originalText,
          instruction,
        })
      }

      default:
        return NextResponse.json({ error: 'Invalid phase' }, { status: 400 })
    }
  } catch (error) {
    return handleApiError(error, { route: 'generate', method: 'POST' })
  }
}
