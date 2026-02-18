import { NextRequest } from 'next/server'
import { requireAuth } from '@/lib/auth/auth-utils'
import { z } from 'zod'
import { prisma } from '@/lib/db/client'
import { streamAgentWithHistory, type MessageParam } from '@/lib/claude'

const ChatRequestSchema = z.object({
  message: z.string().min(1).max(2000),
  context: z.object({
    chapterNumber: z.number().optional(),
    pageNumber: z.number().optional(),
    fullContent: z.string().max(10000).optional(),
  }).optional(),
  history: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string(),
  })).max(20).optional(),
})

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; chapterId: string }> }
) {
  try {
    const { error: authError } = await requireAuth()
    if (authError) return authError

    const { id: projectId, chapterId } = await params
    const body = await request.json()

    const parseResult = ChatRequestSchema.safeParse(body)
    if (!parseResult.success) {
      return new Response(
        JSON.stringify({ error: 'Invalid request body', details: parseResult.error.flatten() }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const { message, context, history } = parseResult.data

    // 프로젝트 및 챕터 확인
    const chapter = await prisma.chapter.findFirst({
      where: { id: chapterId, projectId },
      include: { project: true }
    })

    if (!chapter) {
      return new Response(
        JSON.stringify({ error: 'Chapter not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // 사용자 메시지 DB 저장
    await prisma.chatMessage.create({
      data: {
        projectId,
        chapterId,
        pageNumber: context?.pageNumber,
        role: 'user',
        content: message,
      }
    })

    // 시스템 프롬프트 구성
    const systemPrompt = `당신은 책 집필을 돕는 AI 어시스턴트입니다.

## 책 정보
- 제목: ${chapter.project.title}
- 유형: ${chapter.project.type}
- 타겟 독자: ${chapter.project.targetAudience || '일반 독자'}
- 문체: ${chapter.project.tone || '친근체'}

## 현재 위치
- 챕터 ${context?.chapterNumber || chapter.number}: ${chapter.title}
${context?.pageNumber ? `- 페이지: ${context.pageNumber}` : ''}

## 역할
- 사용자의 집필을 도와주세요
- 요청에 따라 내용을 제안하거나 수정해주세요
- 일관된 문체와 톤을 유지해주세요
- 마크다운 기호 없이 순수 텍스트로 응답하세요`

    // 현재 작업 중인 내용을 시스템 컨텍스트로 추가
    const contentContext = context?.fullContent
      ? `\n\n현재 작업 중인 내용:\n${context.fullContent.substring(0, 3000)}`
      : ''

    // Claude API 메시지 배열 구성 (대화 히스토리 포함)
    const messages: MessageParam[] = []

    // 이전 대화 히스토리 추가
    if (history && history.length > 0) {
      for (const h of history) {
        messages.push({
          role: h.role,
          content: h.content
        })
      }
    }

    // 현재 사용자 메시지 추가 (작업 중인 내용 컨텍스트 포함)
    const currentMessage = contentContext
      ? `${contentContext}\n\n${message}`
      : message
    messages.push({ role: 'user', content: currentMessage })

    // 스트리밍 응답 생성
    const encoder = new TextEncoder()
    let fullResponse = ''

    const stream = new ReadableStream({
      async start(controller) {
        try {
          await streamAgentWithHistory(
            {
              name: 'writing-assistant',
              systemPrompt,
              temperature: 0.7
            },
            messages,
            (chunk) => {
              fullResponse += chunk
              controller.enqueue(encoder.encode(chunk))
            }
          )

          // AI 응답 DB 저장
          await prisma.chatMessage.create({
            data: {
              projectId,
              chapterId,
              pageNumber: context?.pageNumber,
              role: 'assistant',
              content: fullResponse,
            }
          })

          controller.close()
        } catch (error) {
          controller.error(error)
        }
      }
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      }
    })
  } catch {
    return new Response(
      JSON.stringify({ error: 'Failed to process chat' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}

// 메시지 핀 토글
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; chapterId: string }> }
) {
  try {
    const { error: authError } = await requireAuth()
    if (authError) return authError

    await params
    const body = await request.json()
    const { messageId, isPinned } = body as {
      messageId: string
      isPinned: boolean
    }

    if (!messageId || typeof isPinned !== 'boolean') {
      return new Response(
        JSON.stringify({ error: 'Invalid request body' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    await prisma.chatMessage.update({
      where: { id: messageId },
      data: { isPinned },
    })

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )
  } catch {
    return new Response(
      JSON.stringify({ error: 'Failed to update message' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}

// 채팅 히스토리 조회
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; chapterId: string }> }
) {
  try {
    const { error: authError } = await requireAuth()
    if (authError) return authError

    const { id: projectId, chapterId } = await params
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')

    const messages = await prisma.chatMessage.findMany({
      where: { projectId, chapterId },
      orderBy: { createdAt: 'asc' },
      take: limit,
    })

    return new Response(
      JSON.stringify({ data: messages }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )
  } catch {
    return new Response(
      JSON.stringify({ error: 'Failed to fetch chat history' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}

// 채팅 히스토리 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; chapterId: string }> }
) {
  try {
    const { error: authError } = await requireAuth()
    if (authError) return authError

    const { id: projectId, chapterId } = await params

    await prisma.chatMessage.deleteMany({
      where: { projectId, chapterId }
    })

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )
  } catch {
    return new Response(
      JSON.stringify({ error: 'Failed to delete chat history' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}
