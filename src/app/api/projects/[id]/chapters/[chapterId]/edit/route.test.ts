import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

// Mock prisma
vi.mock('@/lib/db/client', () => ({
  prisma: {
    chapter: {
      findFirst: vi.fn(),
    },
  },
}))

// Mock auth
vi.mock('@/lib/auth/auth-utils', () => ({
  requireAuth: vi.fn().mockResolvedValue({ userId: 'user-1', error: null }),
  projectOwnerWhere: vi.fn((projectId: string, userId: string) => ({
    id: projectId,
    OR: [{ userId }, { userId: null }],
  })),
}))

// Mock claude
vi.mock('@/lib/claude', () => ({
  streamAgent: vi.fn(),
}))

// Mock token-quota
vi.mock('@/lib/token-quota', () => ({
  checkQuota: vi.fn(),
  recordUsage: vi.fn(),
}))

import { POST } from './route'
import { prisma } from '@/lib/db/client'
import { streamAgent } from '@/lib/claude'
import { recordUsage } from '@/lib/token-quota'

const mockChapter = {
  id: 'chapter-1',
  projectId: 'project-1',
  number: 1,
  title: '1장',
  content: '테스트 내용',
  project: {
    id: 'project-1',
    title: '테스트 책',
    type: 'fiction',
    tone: '친근체',
  },
}

describe('POST /api/projects/[id]/chapters/[chapterId]/edit', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('입력 검증', () => {
    it('selectedText가 빈 문자열이면 400 에러를 반환한다', async () => {
      const request = new NextRequest('http://localhost/api/projects/1/chapters/1/edit', {
        method: 'POST',
        body: JSON.stringify({
          selectedText: '',
          instruction: '더 간결하게',
        }),
      })

      const params = { params: Promise.resolve({ id: '1', chapterId: '1' }) }
      const response = await POST(request, params)

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toBe('Invalid request body')
    })

    it('instruction이 빈 문자열이면 400 에러를 반환한다', async () => {
      const request = new NextRequest('http://localhost/api/projects/1/chapters/1/edit', {
        method: 'POST',
        body: JSON.stringify({
          selectedText: '수정할 텍스트',
          instruction: '',
        }),
      })

      const params = { params: Promise.resolve({ id: '1', chapterId: '1' }) }
      const response = await POST(request, params)

      expect(response.status).toBe(400)
    })

    it('selectedText가 10000자를 초과하면 400 에러를 반환한다', async () => {
      const longText = 'a'.repeat(10001)
      const request = new NextRequest('http://localhost/api/projects/1/chapters/1/edit', {
        method: 'POST',
        body: JSON.stringify({
          selectedText: longText,
          instruction: '수정해주세요',
        }),
      })

      const params = { params: Promise.resolve({ id: '1', chapterId: '1' }) }
      const response = await POST(request, params)

      expect(response.status).toBe(400)
    })

    it('instruction이 1000자를 초과하면 400 에러를 반환한다', async () => {
      const longInstruction = 'a'.repeat(1001)
      const request = new NextRequest('http://localhost/api/projects/1/chapters/1/edit', {
        method: 'POST',
        body: JSON.stringify({
          selectedText: '수정할 텍스트',
          instruction: longInstruction,
        }),
      })

      const params = { params: Promise.resolve({ id: '1', chapterId: '1' }) }
      const response = await POST(request, params)

      expect(response.status).toBe(400)
    })
  })

  describe('챕터 조회', () => {
    it('챕터가 존재하지 않으면 404 에러를 반환한다', async () => {
      vi.mocked(prisma.chapter.findFirst).mockResolvedValue(null)

      const request = new NextRequest('http://localhost/api/projects/1/chapters/1/edit', {
        method: 'POST',
        body: JSON.stringify({
          selectedText: '수정할 텍스트',
          instruction: '더 간결하게',
        }),
      })

      const params = { params: Promise.resolve({ id: '1', chapterId: '1' }) }
      const response = await POST(request, params)

      expect(response.status).toBe(404)
      const data = await response.json()
      expect(data.error).toBe('Chapter not found')
    })
  })

  describe('성공 케이스', () => {
    it('유효한 요청에 대해 스트리밍 응답을 반환한다', async () => {
      vi.mocked(prisma.chapter.findFirst).mockResolvedValue(mockChapter as never)
      vi.mocked(streamAgent).mockImplementation(async (_config, _prompt, _history, onChunk) => {
        onChunk?.('수정된 ')
        onChunk?.('텍스트입니다.')
        return { text: '수정된 텍스트입니다.', usage: { inputTokens: 100, outputTokens: 50 } } as never
      })

      const request = new NextRequest('http://localhost/api/projects/1/chapters/1/edit', {
        method: 'POST',
        body: JSON.stringify({
          selectedText: '원본 텍스트',
          instruction: '더 간결하게',
        }),
      })

      const params = { params: Promise.resolve({ id: 'project-1', chapterId: 'chapter-1' }) }
      const response = await POST(request, params)

      expect(response.status).toBe(200)
      expect(response.headers.get('Content-Type')).toBe('text/plain; charset=utf-8')
      expect(response.headers.get('Cache-Control')).toBe('no-cache')
    })

    it('context가 제공되면 프롬프트에 포함된다', async () => {
      vi.mocked(prisma.chapter.findFirst).mockResolvedValue(mockChapter as never)

      let capturedPrompt = ''
      vi.mocked(streamAgent).mockImplementation(async (_config, prompt, _history, onChunk) => {
        capturedPrompt = prompt as string
        onChunk?.('수정됨')
        return { text: '수정됨', usage: { inputTokens: 100, outputTokens: 50 } } as never
      })

      const request = new NextRequest('http://localhost/api/projects/1/chapters/1/edit', {
        method: 'POST',
        body: JSON.stringify({
          selectedText: '원본 텍스트',
          instruction: '더 간결하게',
          context: '주변 맥락 내용',
        }),
      })

      const params = { params: Promise.resolve({ id: 'project-1', chapterId: 'chapter-1' }) }
      await POST(request, params)

      expect(capturedPrompt).toContain('주변 맥락')
      expect(capturedPrompt).toContain('주변 맥락 내용')
    })
  })

  describe('토큰 사용량 기록', () => {
    it('streamAgent 완료 후 recordUsage를 호출한다', async () => {
      vi.mocked(prisma.chapter.findFirst).mockResolvedValue(mockChapter as never)
      vi.mocked(streamAgent).mockImplementation(async (_config, _prompt, _history, onChunk) => {
        onChunk?.('수정됨')
        return { text: '수정됨', usage: { inputTokens: 500, outputTokens: 200 } } as never
      })
      vi.mocked(recordUsage).mockResolvedValue(undefined)

      const request = new NextRequest('http://localhost/api/projects/1/chapters/1/edit', {
        method: 'POST',
        body: JSON.stringify({
          selectedText: '원본 텍스트',
          instruction: '더 간결하게',
        }),
      })

      const params = { params: Promise.resolve({ id: 'project-1', chapterId: 'chapter-1' }) }
      const response = await POST(request, params)
      expect(response.status).toBe(200)

      // ReadableStream을 소비해야 streamAgent 콜백이 실행됨
      const reader = response.body!.getReader()
      while (true) {
        const { done } = await reader.read()
        if (done) break
      }

      // recordUsage가 비동기이므로 약간의 대기
      await new Promise(resolve => setTimeout(resolve, 50))

      expect(recordUsage).toHaveBeenCalledWith(
        'user-1',
        'text-editor',
        { inputTokens: 500, outputTokens: 200 },
        'project-1'
      )
    })
  })

  describe('보안', () => {
    it('입력에서 위험한 문자를 제거한다', async () => {
      vi.mocked(prisma.chapter.findFirst).mockResolvedValue(mockChapter as never)

      let capturedPrompt = ''
      vi.mocked(streamAgent).mockImplementation(async (_config, prompt, _history, onChunk) => {
        capturedPrompt = prompt as string
        onChunk?.('정제됨')
        return { text: '정제됨', usage: { inputTokens: 100, outputTokens: 50 } } as never
      })

      const request = new NextRequest('http://localhost/api/projects/1/chapters/1/edit', {
        method: 'POST',
        body: JSON.stringify({
          selectedText: '```코드블록``` ${변수}',
          instruction: '수정해주세요',
        }),
      })

      const params = { params: Promise.resolve({ id: 'project-1', chapterId: 'chapter-1' }) }
      await POST(request, params)

      expect(capturedPrompt).not.toContain('```')
      expect(capturedPrompt).not.toContain('${')
    })
  })
})
