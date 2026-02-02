import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

// Mock prisma
vi.mock('@/lib/db/client', () => ({
  prisma: {
    project: {
      findUnique: vi.fn(),
    },
    source: {
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      findFirst: vi.fn(),
    },
  },
}))

import { GET, POST, PATCH, DELETE } from './route'
import { prisma } from '@/lib/db/client'

const mockProject = {
  id: 'project-1',
  title: '테스트 책',
}

const mockSource = {
  id: 'source-1',
  projectId: 'project-1',
  title: '참고 도서',
  author: '홍길동',
  url: 'https://example.com',
  type: 'book',
  notes: '좋은 자료',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
}

const mockSources = [
  mockSource,
  {
    id: 'source-2',
    projectId: 'project-1',
    title: '웹사이트 자료',
    author: null,
    url: 'https://web.com',
    type: 'website',
    notes: null,
    createdAt: new Date('2024-01-02'),
    updatedAt: new Date('2024-01-02'),
  },
]

describe('Sources API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('GET /api/projects/[id]/sources', () => {
    it('프로젝트의 모든 출처를 반환한다', async () => {
      vi.mocked(prisma.project.findUnique).mockResolvedValue(mockProject as never)
      vi.mocked(prisma.source.findMany).mockResolvedValue(mockSources as never)

      const request = new NextRequest('http://localhost/api/projects/project-1/sources')
      const params = { params: Promise.resolve({ id: 'project-1' }) }
      const response = await GET(request, params)

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.data).toHaveLength(2)
      expect(data.data[0].title).toBe('참고 도서')
    })

    it('프로젝트가 없으면 404 에러를 반환한다', async () => {
      vi.mocked(prisma.project.findUnique).mockResolvedValue(null)

      const request = new NextRequest('http://localhost/api/projects/invalid/sources')
      const params = { params: Promise.resolve({ id: 'invalid' }) }
      const response = await GET(request, params)

      expect(response.status).toBe(404)
      const data = await response.json()
      expect(data.error).toBe('Project not found')
    })
  })

  describe('POST /api/projects/[id]/sources', () => {
    it('유효한 데이터로 출처를 생성한다', async () => {
      vi.mocked(prisma.project.findUnique).mockResolvedValue(mockProject as never)
      vi.mocked(prisma.source.create).mockResolvedValue(mockSource as never)

      const request = new NextRequest('http://localhost/api/projects/project-1/sources', {
        method: 'POST',
        body: JSON.stringify({
          title: '참고 도서',
          author: '홍길동',
          url: 'https://example.com',
          type: 'book',
          notes: '좋은 자료',
        }),
      })

      const params = { params: Promise.resolve({ id: 'project-1' }) }
      const response = await POST(request, params)

      expect(response.status).toBe(201)
      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.data.title).toBe('참고 도서')
    })

    it('title이 빈 문자열이면 400 에러를 반환한다', async () => {
      vi.mocked(prisma.project.findUnique).mockResolvedValue(mockProject as never)

      const request = new NextRequest('http://localhost/api/projects/project-1/sources', {
        method: 'POST',
        body: JSON.stringify({
          title: '',
          type: 'book',
        }),
      })

      const params = { params: Promise.resolve({ id: 'project-1' }) }
      const response = await POST(request, params)

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toBe('Title is required')
    })

    it('title이 없으면 400 에러를 반환한다', async () => {
      vi.mocked(prisma.project.findUnique).mockResolvedValue(mockProject as never)

      const request = new NextRequest('http://localhost/api/projects/project-1/sources', {
        method: 'POST',
        body: JSON.stringify({
          type: 'book',
        }),
      })

      const params = { params: Promise.resolve({ id: 'project-1' }) }
      const response = await POST(request, params)

      expect(response.status).toBe(400)
    })

    it('유효하지 않은 type이면 400 에러를 반환한다', async () => {
      vi.mocked(prisma.project.findUnique).mockResolvedValue(mockProject as never)

      const request = new NextRequest('http://localhost/api/projects/project-1/sources', {
        method: 'POST',
        body: JSON.stringify({
          title: '출처',
          type: 'invalid',
        }),
      })

      const params = { params: Promise.resolve({ id: 'project-1' }) }
      const response = await POST(request, params)

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toBe('Invalid source type')
    })

    it('프로젝트가 없으면 404 에러를 반환한다', async () => {
      vi.mocked(prisma.project.findUnique).mockResolvedValue(null)

      const request = new NextRequest('http://localhost/api/projects/invalid/sources', {
        method: 'POST',
        body: JSON.stringify({
          title: '출처',
          type: 'book',
        }),
      })

      const params = { params: Promise.resolve({ id: 'invalid' }) }
      const response = await POST(request, params)

      expect(response.status).toBe(404)
    })
  })

  describe('PATCH /api/projects/[id]/sources', () => {
    it('출처를 업데이트한다', async () => {
      vi.mocked(prisma.source.findFirst).mockResolvedValue(mockSource as never)
      vi.mocked(prisma.source.update).mockResolvedValue({
        ...mockSource,
        title: '수정된 제목',
      } as never)

      const request = new NextRequest('http://localhost/api/projects/project-1/sources', {
        method: 'PATCH',
        body: JSON.stringify({
          sourceId: 'source-1',
          title: '수정된 제목',
        }),
      })

      const params = { params: Promise.resolve({ id: 'project-1' }) }
      const response = await PATCH(request, params)

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.data.title).toBe('수정된 제목')
    })

    it('sourceId가 없으면 400 에러를 반환한다', async () => {
      const request = new NextRequest('http://localhost/api/projects/project-1/sources', {
        method: 'PATCH',
        body: JSON.stringify({
          title: '수정된 제목',
        }),
      })

      const params = { params: Promise.resolve({ id: 'project-1' }) }
      const response = await PATCH(request, params)

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toBe('Source ID is required')
    })

    it('출처가 없으면 404 에러를 반환한다', async () => {
      vi.mocked(prisma.source.findFirst).mockResolvedValue(null)

      const request = new NextRequest('http://localhost/api/projects/project-1/sources', {
        method: 'PATCH',
        body: JSON.stringify({
          sourceId: 'invalid',
          title: '수정된 제목',
        }),
      })

      const params = { params: Promise.resolve({ id: 'project-1' }) }
      const response = await PATCH(request, params)

      expect(response.status).toBe(404)
      const data = await response.json()
      expect(data.error).toBe('Source not found')
    })
  })

  describe('DELETE /api/projects/[id]/sources', () => {
    it('출처를 삭제한다', async () => {
      vi.mocked(prisma.source.findFirst).mockResolvedValue(mockSource as never)
      vi.mocked(prisma.source.delete).mockResolvedValue(mockSource as never)

      const request = new NextRequest('http://localhost/api/projects/project-1/sources?sourceId=source-1', {
        method: 'DELETE',
      })

      const params = { params: Promise.resolve({ id: 'project-1' }) }
      const response = await DELETE(request, params)

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.success).toBe(true)
    })

    it('sourceId가 없으면 400 에러를 반환한다', async () => {
      const request = new NextRequest('http://localhost/api/projects/project-1/sources', {
        method: 'DELETE',
      })

      const params = { params: Promise.resolve({ id: 'project-1' }) }
      const response = await DELETE(request, params)

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toBe('Source ID is required')
    })

    it('출처가 없으면 404 에러를 반환한다', async () => {
      vi.mocked(prisma.source.findFirst).mockResolvedValue(null)

      const request = new NextRequest('http://localhost/api/projects/project-1/sources?sourceId=invalid', {
        method: 'DELETE',
      })

      const params = { params: Promise.resolve({ id: 'project-1' }) }
      const response = await DELETE(request, params)

      expect(response.status).toBe(404)
    })
  })
})
