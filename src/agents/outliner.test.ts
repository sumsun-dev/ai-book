import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/claude', () => ({
  runAgent: vi.fn(),
}))

import {
  runOutlinerAgent,
  generateTableOfContents,
  refineOutline,
  addChapter,
  removeChapter,
  reorderChapters,
  addSection,
  removeSection,
} from './outliner'
import { runAgent } from '@/lib/claude'
import { createMockOutline } from '@/test/fixtures/outline'
import type { ResearchResult } from '@/types/book'

const mockRunAgent = vi.mocked(runAgent)

const mockUsage = { inputTokens: 0, outputTokens: 0 }

const mockResearch: ResearchResult = {
  topic: '테스트 주제',
  findings: ['발견 1'],
  sources: ['출처 1'],
  recommendations: ['추천 1'],
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('runOutlinerAgent', () => {
  it('JSON 응답을 파싱하여 BookOutline을 반환한다', async () => {
    const outline = createMockOutline(2)
    mockRunAgent.mockResolvedValue({ text: JSON.stringify(outline), usage: mockUsage })

    const result = await runOutlinerAgent('fiction', '테스트 책', '설명', mockResearch)

    expect(result.synopsis).toBe('테스트 시놉시스')
    expect(result.chapters).toHaveLength(2)
  })

  it('코드 블록 안의 JSON을 파싱한다', async () => {
    const outline = createMockOutline(1)
    mockRunAgent.mockResolvedValue({ text: `\`\`\`json\n${JSON.stringify(outline)}\n\`\`\``, usage: mockUsage })

    const result = await runOutlinerAgent('fiction', '책', '설명', mockResearch)
    expect(result.chapters).toHaveLength(1)
  })

  it('섹션이 없는 챕터에 기본 섹션을 추가한다', async () => {
    const outline = {
      synopsis: '시놉시스',
      chapters: [{ number: 1, title: '챕터1', summary: '요약', keyPoints: [] }],
      estimatedPages: 10,
      targetAudience: '독자',
      tone: '톤',
    }
    mockRunAgent.mockResolvedValue({ text: JSON.stringify(outline), usage: mockUsage })

    const result = await runOutlinerAgent('fiction', '책', '설명', mockResearch)
    expect(result.chapters[0].sections).toBeDefined()
    expect(result.chapters[0].sections.length).toBeGreaterThan(0)
  })

  it('파싱 실패 시 기본 구조를 반환한다', async () => {
    mockRunAgent.mockResolvedValue({ text: '파싱 불가한 텍스트', usage: mockUsage })

    const result = await runOutlinerAgent('fiction', '책', '설명', mockResearch)

    expect(result.synopsis).toBe('설명')
    expect(result.chapters).toHaveLength(1)
    expect(result.chapters[0].title).toBe('서론')
  })

  it('bookType을 프롬프트에 포함한다', async () => {
    mockRunAgent.mockResolvedValue({ text: JSON.stringify(createMockOutline(1)), usage: mockUsage })

    await runOutlinerAgent('technical', '책', '설명', mockResearch)

    expect(mockRunAgent).toHaveBeenCalledWith(
      expect.any(Object),
      expect.stringContaining('technical')
    )
  })
})

describe('generateTableOfContents (outliner)', () => {
  it('목차를 생성한다', () => {
    const outline = createMockOutline(2)
    const toc = generateTableOfContents('책 제목', outline)

    expect(toc.title).toBe('책 제목')
    expect(toc.entries.length).toBeGreaterThan(0)
    expect(toc.generatedAt).toBeInstanceOf(Date)
  })

  it('빈 아웃라인에서도 동작한다', () => {
    const outline = createMockOutline(0)
    const toc = generateTableOfContents('빈 책', outline)
    expect(toc.entries).toHaveLength(0)
  })
})

describe('refineOutline', () => {
  it('피드백을 반영한 수정된 아웃라인을 반환한다', async () => {
    const refined = createMockOutline(4)
    mockRunAgent.mockResolvedValue({ text: JSON.stringify(refined), usage: mockUsage })

    const original = createMockOutline(3)
    const result = await refineOutline(original, {
      type: 'add_chapter',
      instruction: '새 챕터 추가',
    })

    expect(result.chapters).toHaveLength(4)
  })

  it('파싱 실패 시 원본을 반환한다', async () => {
    mockRunAgent.mockResolvedValue({ text: '파싱 불가', usage: mockUsage })

    const original = createMockOutline(3)
    const result = await refineOutline(original, {
      type: 'general',
      instruction: '개선해주세요',
    })

    expect(result).toEqual({
      ...original,
      _usage: mockUsage,
    })
  })

  it('targetChapter를 프롬프트에 포함한다', async () => {
    mockRunAgent.mockResolvedValue({ text: JSON.stringify(createMockOutline(3)), usage: mockUsage })

    await refineOutline(createMockOutline(3), {
      type: 'modify_chapter',
      targetChapter: 2,
      instruction: '수정',
    })

    expect(mockRunAgent).toHaveBeenCalledWith(
      expect.any(Object),
      expect.stringContaining('2')
    )
  })
})

describe('addChapter (outliner)', () => {
  it('끝에 챕터를 추가한다', () => {
    const outline = createMockOutline(2)
    const result = addChapter(outline, '새 챕터', '요약')
    expect(result.chapters).toHaveLength(3)
  })

  it('특정 위치에 삽입한다', () => {
    const outline = createMockOutline(3)
    const result = addChapter(outline, '삽입', '요약', 2)
    expect(result.chapters).toHaveLength(4)
    expect(result.chapters[1].title).toBe('삽입')
  })
})

describe('removeChapter (outliner)', () => {
  it('챕터를 삭제하고 번호를 재조정한다', () => {
    const outline = createMockOutline(3)
    const result = removeChapter(outline, 2)
    expect(result.chapters).toHaveLength(2)
    expect(result.chapters[1].number).toBe(2)
  })
})

describe('reorderChapters (outliner)', () => {
  it('챕터 순서를 변경한다', () => {
    const outline = createMockOutline(3)
    const firstTitle = outline.chapters[0].title
    const result = reorderChapters(outline, 0, 2)
    expect(result.chapters[2].title).toBe(firstTitle)
  })
})

describe('addSection (outliner)', () => {
  it('섹션을 추가한다', () => {
    const outline = createMockOutline(1)
    const result = addSection(outline, 1, '새 섹션', '요약')
    expect(result.chapters[0].sections.length).toBe(3)
  })
})

describe('removeSection (outliner)', () => {
  it('섹션을 삭제한다', () => {
    const outline = createMockOutline(1)
    const result = removeSection(outline, 1, '1.1')
    expect(result.chapters[0].sections.length).toBe(1)
  })
})
