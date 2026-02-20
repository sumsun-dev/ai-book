import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useBookStore } from './store'
import type { BookProject, AgentMessage, Reference } from '@/types/book'
import { createMockOutline } from '@/test/fixtures/outline'

// Reset store before each test
beforeEach(() => {
  useBookStore.getState().reset()
  vi.restoreAllMocks()
})

describe('useBookStore - 초기 상태', () => {
  it('초기 상태가 올바르다', () => {
    const state = useBookStore.getState()
    expect(state.currentProject).toBeNull()
    expect(state.chapters.size).toBe(0)
    expect(state.agentMessages).toEqual([])
    expect(state.isProcessing).toBe(false)
    expect(state.tableOfContents).toBeNull()
    expect(state.sources).toEqual([])
  })
})

describe('useBookStore - createProject', () => {
  it('새 프로젝트를 생성한다', () => {
    useBookStore.getState().createProject('테스트 책', 'fiction', '설명')

    const state = useBookStore.getState()
    expect(state.currentProject).toBeDefined()
    expect(state.currentProject!.title).toBe('테스트 책')
    expect(state.currentProject!.type).toBe('fiction')
    expect(state.currentProject!.description).toBe('설명')
    expect(state.currentProject!.status).toBe('draft')
    expect(state.currentProject!.stage).toBe('research')
  })

  it('프로젝트 생성 시 chapters와 messages를 초기화한다', () => {
    useBookStore.getState().createProject('책', 'fiction', '설명')

    const state = useBookStore.getState()
    expect(state.chapters.size).toBe(0)
    expect(state.agentMessages).toEqual([])
  })
})

describe('useBookStore - updateStatus', () => {
  it('프로젝트 상태를 업데이트한다', () => {
    useBookStore.getState().createProject('책', 'fiction', '설명')
    useBookStore.getState().updateStatus('writing')

    expect(useBookStore.getState().currentProject!.status).toBe('writing')
  })

  it('프로젝트가 없으면 아무것도 하지 않는다', () => {
    useBookStore.getState().updateStatus('writing')
    expect(useBookStore.getState().currentProject).toBeNull()
  })
})

describe('useBookStore - setOutline', () => {
  it('아웃라인을 설정한다', () => {
    useBookStore.getState().createProject('책', 'fiction', '설명')
    const outline = createMockOutline(3)
    useBookStore.getState().setOutline(outline)

    expect(useBookStore.getState().currentProject!.outline).toBe(outline)
  })

  it('프로젝트가 없으면 아무것도 하지 않는다', () => {
    useBookStore.getState().setOutline(createMockOutline())
    expect(useBookStore.getState().currentProject).toBeNull()
  })
})

describe('useBookStore - setChapter', () => {
  it('챕터 내용을 설정한다', () => {
    useBookStore.getState().setChapter(1, '챕터 1 내용')

    expect(useBookStore.getState().chapters.get(1)).toBe('챕터 1 내용')
  })

  it('기존 챕터를 덮어쓴다', () => {
    useBookStore.getState().setChapter(1, '원래')
    useBookStore.getState().setChapter(1, '새로운')

    expect(useBookStore.getState().chapters.get(1)).toBe('새로운')
  })
})

describe('useBookStore - agentMessages', () => {
  it('메시지를 추가한다', () => {
    const msg: AgentMessage = {
      agent: 'writer',
      type: 'output',
      content: '테스트',
      timestamp: new Date(),
    }
    useBookStore.getState().addAgentMessage(msg)

    expect(useBookStore.getState().agentMessages).toHaveLength(1)
    expect(useBookStore.getState().agentMessages[0].content).toBe('테스트')
  })

  it('메시지를 초기화한다', () => {
    const msg: AgentMessage = {
      agent: 'writer',
      type: 'output',
      content: '테스트',
      timestamp: new Date(),
    }
    useBookStore.getState().addAgentMessage(msg)
    useBookStore.getState().clearAgentMessages()

    expect(useBookStore.getState().agentMessages).toHaveLength(0)
  })
})

describe('useBookStore - isProcessing', () => {
  it('처리 상태를 설정한다', () => {
    useBookStore.getState().setProcessing(true)
    expect(useBookStore.getState().isProcessing).toBe(true)

    useBookStore.getState().setProcessing(false)
    expect(useBookStore.getState().isProcessing).toBe(false)
  })
})

describe('useBookStore - loadProject', () => {
  it('프로젝트를 로드하고 chapters Map을 구축한다', () => {
    const project: BookProject = {
      id: 'test-id',
      title: '테스트',
      type: 'fiction',
      description: '설명',
      outline: null,
      chapters: [
        { number: 1, title: '챕터1', content: '내용1', status: 'writing', revisions: [] },
        { number: 2, title: '챕터2', content: '내용2', status: 'writing', revisions: [] },
      ],
      status: 'writing',
      stage: 'write',
      targetAudience: null,
      targetLength: null,
      tone: null,
      confirmedAt: null,
      userId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    useBookStore.getState().loadProject(project)

    const state = useBookStore.getState()
    expect(state.currentProject!.title).toBe('테스트')
    expect(state.chapters.get(1)).toBe('내용1')
    expect(state.chapters.get(2)).toBe('내용2')
  })

  it('outline이 있으면 TOC를 생성한다', () => {
    const outline = createMockOutline(2)
    const project: BookProject = {
      id: 'test-id',
      title: '테스트',
      type: 'fiction',
      description: '',
      outline,
      chapters: [],
      status: 'outlining',
      stage: 'outline',
      targetAudience: null,
      targetLength: null,
      tone: null,
      confirmedAt: null,
      userId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    useBookStore.getState().loadProject(project)

    expect(useBookStore.getState().tableOfContents).toBeDefined()
    expect(useBookStore.getState().tableOfContents!.title).toBe('테스트')
  })
})

describe('useBookStore - saveProject', () => {
  it('프로젝트가 없으면 fetch를 호출하지 않는다', async () => {
    const mockFetch = vi.fn()
    global.fetch = mockFetch

    await useBookStore.getState().saveProject()
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('프로젝트를 서버에 저장한다', async () => {
    const mockFetch = vi.fn().mockResolvedValue({ ok: true })
    global.fetch = mockFetch

    useBookStore.getState().createProject('책', 'fiction', '설명')
    await useBookStore.getState().saveProject()

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/projects/'),
      expect.objectContaining({ method: 'PUT' })
    )
  })

  it('fetch 실패 시 에러를 던진다', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('network'))

    useBookStore.getState().createProject('책', 'fiction', '설명')
    await expect(useBookStore.getState().saveProject()).rejects.toThrow('저장에 실패')
  })
})

describe('useBookStore - saveChapterToServer', () => {
  it('프로젝트가 없으면 fetch를 호출하지 않는다', async () => {
    const mockFetch = vi.fn()
    global.fetch = mockFetch

    await useBookStore.getState().saveChapterToServer(1, '제목', '내용')
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('챕터를 서버에 저장한다', async () => {
    const mockFetch = vi.fn().mockResolvedValue({ ok: true })
    global.fetch = mockFetch

    useBookStore.getState().createProject('책', 'fiction', '설명')
    await useBookStore.getState().saveChapterToServer(1, '챕터 1', '내용')

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/chapters'),
      expect.objectContaining({ method: 'POST' })
    )
  })
})

describe('useBookStore - outline 조작', () => {
  beforeEach(() => {
    useBookStore.getState().createProject('책', 'fiction', '설명')
    useBookStore.getState().setOutline(createMockOutline(3))
  })

  it('generateTOC로 목차를 생성한다', () => {
    useBookStore.getState().generateTOC()
    expect(useBookStore.getState().tableOfContents).toBeDefined()
  })

  it('addChapterToOutline로 챕터를 추가한다', () => {
    useBookStore.getState().addChapterToOutline('새 챕터', '요약')
    expect(useBookStore.getState().currentProject!.outline!.chapters).toHaveLength(4)
  })

  it('removeChapterFromOutline로 챕터를 삭제한다', () => {
    useBookStore.getState().removeChapterFromOutline(2)
    expect(useBookStore.getState().currentProject!.outline!.chapters).toHaveLength(2)
  })

  it('reorderOutlineChapters로 챕터를 재정렬한다', () => {
    const originalTitle = useBookStore.getState().currentProject!.outline!.chapters[0].title
    useBookStore.getState().reorderOutlineChapters(0, 2)
    expect(useBookStore.getState().currentProject!.outline!.chapters[2].title).toBe(originalTitle)
  })

  it('addSectionToChapter로 섹션을 추가한다', () => {
    useBookStore.getState().addSectionToChapter(1, '새 섹션', '요약')
    expect(useBookStore.getState().currentProject!.outline!.chapters[0].sections).toHaveLength(3)
  })

  it('removeSectionFromChapter로 섹션을 삭제한다', () => {
    useBookStore.getState().removeSectionFromChapter(1, '1.1')
    expect(useBookStore.getState().currentProject!.outline!.chapters[0].sections).toHaveLength(1)
  })

  it('outline이 없으면 조작이 무시된다', () => {
    useBookStore.getState().setOutline(null as unknown as Parameters<ReturnType<typeof useBookStore.getState>['setOutline']>[0])
    // These should not throw
    useBookStore.getState().addChapterToOutline('test', 'test')
    useBookStore.getState().removeChapterFromOutline(1)
    useBookStore.getState().reorderOutlineChapters(0, 1)
    useBookStore.getState().addSectionToChapter(1, 'test', 'test')
    useBookStore.getState().removeSectionFromChapter(1, '1.1')
    useBookStore.getState().generateTOC()
  })
})

describe('useBookStore - sources', () => {
  it('setSources로 소스를 설정한다', () => {
    const sources: Reference[] = [
      { title: '참고1', author: null, url: null, type: 'book', notes: null },
    ]
    useBookStore.getState().setSources(sources)
    expect(useBookStore.getState().sources).toHaveLength(1)
  })

  it('addSource로 소스를 추가한다', () => {
    const source: Reference = {
      title: '참고1',
      author: null,
      url: null,
      type: 'book',
      notes: null,
    }
    useBookStore.getState().addSource(source)
    expect(useBookStore.getState().sources).toHaveLength(1)
  })

  it('removeSource로 소스를 삭제한다', () => {
    const source: Reference = {
      title: '참고1',
      author: null,
      url: null,
      type: 'book',
      notes: null,
    }
    useBookStore.getState().addSource(source)
    useBookStore.getState().removeSource(0)
    expect(useBookStore.getState().sources).toHaveLength(0)
  })
})

describe('useBookStore - reset', () => {
  it('전체 상태를 초기화한다', () => {
    useBookStore.getState().createProject('책', 'fiction', '설명')
    useBookStore.getState().setChapter(1, '내용')
    useBookStore.getState().setProcessing(true)

    useBookStore.getState().reset()

    const state = useBookStore.getState()
    expect(state.currentProject).toBeNull()
    expect(state.chapters.size).toBe(0)
    expect(state.agentMessages).toEqual([])
    expect(state.isProcessing).toBe(false)
    expect(state.tableOfContents).toBeNull()
    expect(state.sources).toEqual([])
  })
})
