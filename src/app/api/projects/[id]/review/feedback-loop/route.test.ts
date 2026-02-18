import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/auth/auth-utils', () => ({
  requireAuth: vi.fn().mockResolvedValue({ id: 'user-1', email: 'test@test.com' }),
}))

vi.mock('@/lib/db/client', () => ({
  prisma: {
    project: {
      findUnique: vi.fn(),
    },
    chapter: {
      update: vi.fn(),
    },
    editHistory: {
      create: vi.fn(),
    },
  },
}))

vi.mock('@/agents/editor-critic', () => ({
  runEditorCriticLoop: vi.fn(),
}))

import { POST } from './route'
import { prisma } from '@/lib/db/client'
import { runEditorCriticLoop } from '@/agents/editor-critic'
import { NextRequest } from 'next/server'

function createRequest(body: Record<string, unknown>): NextRequest {
  return new NextRequest('http://localhost/api/projects/proj-1/review/feedback-loop', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  })
}

const mockParams = Promise.resolve({ id: 'proj-1' })

describe('POST /api/projects/[id]/review/feedback-loop', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return 400 for invalid request body', async () => {
    const req = createRequest({ chapterNumber: -1 })
    const res = await POST(req, { params: mockParams })
    expect(res.status).toBe(400)
  })

  it('should return 404 when project not found', async () => {
    vi.mocked(prisma.project.findUnique).mockResolvedValue(null)

    const req = createRequest({ chapterNumber: 1 })
    const res = await POST(req, { params: mockParams })
    expect(res.status).toBe(404)
  })

  it('should return 404 when chapter not found', async () => {
    vi.mocked(prisma.project.findUnique).mockResolvedValue({
      id: 'proj-1',
      title: 'Test',
      type: 'fiction',
      description: '',
      status: 'reviewing',
      stage: 'review',
      outline: null,
      bible: null,
      targetAudience: null,
      targetLength: null,
      tone: null,
      customTone: null,
      confirmedAt: null,
      userId: 'user-1',
      createdAt: new Date(),
      updatedAt: new Date(),
      agentConfig: null,
      chapters: [],
    } as never)

    const req = createRequest({ chapterNumber: 1 })
    const res = await POST(req, { params: mockParams })
    expect(res.status).toBe(404)
  })

  it('should return SSE stream on success', async () => {
    vi.mocked(prisma.project.findUnique).mockResolvedValue({
      id: 'proj-1',
      title: 'Test Book',
      type: 'fiction',
      description: '',
      status: 'reviewing',
      stage: 'review',
      outline: JSON.stringify({ targetAudience: '성인', tone: '격식체' }),
      bible: null,
      targetAudience: '성인',
      targetLength: 200,
      tone: '격식체',
      customTone: null,
      confirmedAt: null,
      userId: 'user-1',
      createdAt: new Date(),
      updatedAt: new Date(),
      agentConfig: null,
      chapters: [{
        id: 'ch-1',
        number: 1,
        title: 'Chapter 1',
        content: 'Test content',
        status: 'pending',
        projectId: 'proj-1',
        createdAt: new Date(),
        updatedAt: new Date(),
      }],
    } as never)

    vi.mocked(runEditorCriticLoop).mockImplementation(async (_content, _title, _audience, _tone, options) => {
      options?.onIteration?.(1, {
        editedContent: 'Improved content',
        grammarCheck: {
          totalErrors: 2,
          errorsByCategory: { spelling: 1, grammar: 1, punctuation: 0, word_choice: 0, sentence_flow: 0, style: 0 },
          corrections: [],
        },
        qualityEvaluation: {
          decision: 'pass',
          overallScore: 8,
          scores: { grammar: 8, clarity: 8, coherence: 8, engagement: 8, targetFit: 8 },
          strengths: ['Good'],
          weaknesses: [],
          priorityRevisions: [],
        },
        iterationCount: 1,
        finalStatus: 'passed',
      })

      return {
        editedContent: 'Improved content',
        grammarCheck: {
          totalErrors: 2,
          errorsByCategory: { spelling: 1, grammar: 1, punctuation: 0, word_choice: 0, sentence_flow: 0, style: 0 },
          corrections: [],
        },
        qualityEvaluation: {
          decision: 'pass',
          overallScore: 8,
          scores: { grammar: 8, clarity: 8, coherence: 8, engagement: 8, targetFit: 8 },
          strengths: ['Good'],
          weaknesses: [],
          priorityRevisions: [],
        },
        iterationCount: 1,
        finalStatus: 'passed',
      }
    })

    vi.mocked(prisma.chapter.update).mockResolvedValue({} as never)
    vi.mocked(prisma.editHistory.create).mockResolvedValue({} as never)

    const req = createRequest({ chapterNumber: 1 })
    const res = await POST(req, { params: mockParams })

    expect(res.status).toBe(200)
    expect(res.headers.get('Content-Type')).toBe('text/event-stream')

    const text = await res.text()
    expect(text).toContain('event: iteration_result')
    expect(text).toContain('event: complete')
    expect(text).toContain('"finalStatus":"passed"')
  })
})
