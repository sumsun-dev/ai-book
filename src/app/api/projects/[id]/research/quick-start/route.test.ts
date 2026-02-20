import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest, NextResponse } from 'next/server'

vi.mock('@/lib/auth/auth-utils', () => ({
  requireAuth: vi.fn().mockResolvedValue({ userId: 'user-1', error: null }),
  projectOwnerWhere: (projectId: string, userId: string) => ({
    id: projectId,
    OR: [{ userId }, { userId: null }],
  }),
}))

vi.mock('@/lib/db/client', () => ({
  prisma: {
    project: { findFirst: vi.fn(), update: vi.fn() },
    researchData: { upsert: vi.fn() },
  },
}))

vi.mock('@/lib/claude', () => ({
  runAgent: vi.fn(),
}))

vi.mock('@/lib/token-quota', () => ({
  checkQuota: vi.fn(),
  recordUsage: vi.fn().mockResolvedValue(undefined),
}))

import { POST } from './route'
import { requireAuth } from '@/lib/auth/auth-utils'
import { prisma } from '@/lib/db/client'
import { runAgent } from '@/lib/claude'

const mockRequireAuth = vi.mocked(requireAuth)
const mockFindFirst = prisma.project.findFirst as unknown as ReturnType<typeof vi.fn>
const mockUpdate = prisma.project.update as unknown as ReturnType<typeof vi.fn>
const mockUpsert = prisma.researchData.upsert as unknown as ReturnType<typeof vi.fn>
const mockRunAgent = vi.mocked(runAgent)

function createRequest(body: Record<string, unknown>): NextRequest {
  return new NextRequest('http://localhost:3000/api/projects/project-1/research/quick-start', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  })
}

const mockParams = { params: Promise.resolve({ id: 'project-1' }) }

const mockProject = {
  id: 'project-1',
  title: '테스트 프로젝트',
  type: 'fiction',
  status: 'draft',
}

describe('POST /api/projects/[id]/research/quick-start', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockRequireAuth.mockResolvedValue({ userId: 'user-1', error: null })
    mockFindFirst.mockResolvedValue(mockProject)
    mockUpdate.mockResolvedValue(mockProject)
    mockUpsert.mockResolvedValue({})
  })

  it('initialIdea 누락 시 400을 반환한다', async () => {
    const response = await POST(createRequest({}), mockParams)
    expect(response.status).toBe(400)
    const body = await response.json()
    expect(body.error).toBe('Initial idea is required')
  })

  it('프로젝트가 없으면 404를 반환한다', async () => {
    mockFindFirst.mockResolvedValue(null)

    const response = await POST(
      createRequest({ initialIdea: '테스트 아이디어' }),
      mockParams,
    )
    expect(response.status).toBe(404)
    const body = await response.json()
    expect(body.error).toBe('Project not found')
  })

  it('인증 실패 시 401을 반환한다', async () => {
    mockRequireAuth.mockResolvedValue({
      userId: null,
      error: NextResponse.json(
        { success: false, error: '로그인이 필요합니다.' },
        { status: 401 },
      ),
    })

    const response = await POST(
      createRequest({ initialIdea: '테스트 아이디어' }),
      mockParams,
    )
    expect(response.status).toBe(401)
  })

  it('전체 성공 시 200과 questions/answers/summary를 반환한다', async () => {
    const questionsJson = JSON.stringify({
      questions: [
        { id: 'q1', question: '독자층은?', category: 'audience', priority: 1 },
      ],
    })
    const answersJson = JSON.stringify({
      answers: [{ questionId: 'q1', answer: '일반 성인' }],
    })
    const planText = '종합 계획 요약'

    const mockUsage = { inputTokens: 0, outputTokens: 0 }
    mockRunAgent
      .mockResolvedValueOnce({ text: questionsJson, usage: mockUsage })
      .mockResolvedValueOnce({ text: answersJson, usage: mockUsage })
      .mockResolvedValueOnce({ text: planText, usage: mockUsage })

    const response = await POST(
      createRequest({ initialIdea: '테스트 아이디어' }),
      mockParams,
    )
    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.questions).toHaveLength(1)
    expect(body.questions[0].id).toBe('q1')
    expect(body.answers).toHaveLength(1)
    expect(body.answers[0].source).toBe('ai')
    expect(body.summary).toBe(planText)
    expect(mockUpsert).toHaveBeenCalled()
    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: 'project-1' },
      data: { status: 'researching' },
    })
  })

  it('Step 1 실패 시 FALLBACK_QUESTIONS를 사용한다', async () => {
    const answersJson = JSON.stringify({
      answers: [
        { questionId: 'q1', answer: '답변1' },
        { questionId: 'q2', answer: '답변2' },
        { questionId: 'q3', answer: '답변3' },
        { questionId: 'q4', answer: '답변4' },
        { questionId: 'q5', answer: '답변5' },
      ],
    })

    const mockUsage = { inputTokens: 0, outputTokens: 0 }
    mockRunAgent
      .mockRejectedValueOnce(new Error('AI 실패'))
      .mockResolvedValueOnce({ text: answersJson, usage: mockUsage })
      .mockResolvedValueOnce({ text: '계획 요약', usage: mockUsage })

    const response = await POST(
      createRequest({ initialIdea: '테스트 아이디어' }),
      mockParams,
    )
    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.questions).toHaveLength(5)
    expect(body.questions[0].id).toBe('q1')
    expect(body.questions[0].category).toBe('audience')
  })

  it('Step 2 실패 시 기본 답변(source: ai)을 생성한다', async () => {
    const questionsJson = JSON.stringify({
      questions: [
        { id: 'q1', question: '독자층은?', category: 'audience', priority: 1 },
      ],
    })

    const mockUsage = { inputTokens: 0, outputTokens: 0 }
    mockRunAgent
      .mockResolvedValueOnce({ text: questionsJson, usage: mockUsage })
      .mockRejectedValueOnce(new Error('AI 실패'))
      .mockResolvedValueOnce({ text: '계획 요약', usage: mockUsage })

    const response = await POST(
      createRequest({ initialIdea: '테스트 아이디어' }),
      mockParams,
    )
    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.answers).toHaveLength(1)
    expect(body.answers[0].source).toBe('ai')
    expect(body.answers[0].questionId).toBe('q1')
  })

  it('Step 3 실패 시 500을 반환한다', async () => {
    const questionsJson = JSON.stringify({
      questions: [
        { id: 'q1', question: '독자층은?', category: 'audience', priority: 1 },
      ],
    })
    const answersJson = JSON.stringify({
      answers: [{ questionId: 'q1', answer: '일반 성인' }],
    })

    const mockUsage = { inputTokens: 0, outputTokens: 0 }
    mockRunAgent
      .mockResolvedValueOnce({ text: questionsJson, usage: mockUsage })
      .mockResolvedValueOnce({ text: answersJson, usage: mockUsage })
      .mockRejectedValueOnce(new Error('Plan 실패'))

    const response = await POST(
      createRequest({ initialIdea: '테스트 아이디어' }),
      mockParams,
    )
    expect(response.status).toBe(500)
    const body = await response.json()
    expect(body.error).toBe('Plan 실패')
  })
})
