import { create } from 'zustand'
import { BookProject, BookStatus, BookOutline, AgentMessage, BookType, TableOfContents, OutlineFeedback, ProjectStage } from '@/types/book'
import { generateTableOfContents, addChapter, removeChapter, reorderChapters, addSection, removeSection } from '@/lib/outline-utils'

interface BookStore {
  currentProject: BookProject | null
  chapters: Map<number, string>
  agentMessages: AgentMessage[]
  isProcessing: boolean
  tableOfContents: TableOfContents | null

  // Actions
  createProject: (title: string, type: BookType, description: string) => void
  updateStatus: (status: BookStatus) => void
  setOutline: (outline: BookOutline) => void
  setChapter: (number: number, content: string) => void
  addAgentMessage: (message: AgentMessage) => void
  clearAgentMessages: () => void
  setProcessing: (processing: boolean) => void
  reset: () => void

  // Persistence actions
  loadProject: (project: BookProject) => void
  saveProject: () => Promise<void>
  saveChapterToServer: (chapterNumber: number, title: string, content: string) => Promise<void>

  // Outline modification actions
  generateTOC: () => void
  refineOutlineWithFeedback: (feedback: OutlineFeedback) => Promise<void>
  addChapterToOutline: (title: string, summary: string, position?: number) => void
  removeChapterFromOutline: (chapterNumber: number) => void
  reorderOutlineChapters: (fromIndex: number, toIndex: number) => void
  addSectionToChapter: (chapterNumber: number, title: string, summary: string) => void
  removeSectionFromChapter: (chapterNumber: number, sectionId: string) => void
}

export const useBookStore = create<BookStore>((set, get) => ({
  currentProject: null,
  chapters: new Map(),
  agentMessages: [],
  isProcessing: false,
  tableOfContents: null,

  createProject: (title, type, description) => {
    const project: BookProject = {
      id: crypto.randomUUID(),
      title,
      type,
      description,
      outline: null,
      chapters: [],
      status: 'draft',
      stage: 'research',
      targetAudience: null,
      targetLength: null,
      tone: null,
      confirmedAt: null,
      userId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    set({ currentProject: project, chapters: new Map(), agentMessages: [] })
  },

  updateStatus: (status) => {
    const { currentProject } = get()
    if (currentProject) {
      set({
        currentProject: {
          ...currentProject,
          status,
          updatedAt: new Date(),
        },
      })
    }
  },

  setOutline: (outline) => {
    const { currentProject } = get()
    if (currentProject) {
      set({
        currentProject: {
          ...currentProject,
          outline,
          updatedAt: new Date(),
        },
      })
    }
  },

  setChapter: (number, content) => {
    const { chapters } = get()
    const newChapters = new Map(chapters)
    newChapters.set(number, content)
    set({ chapters: newChapters })
  },

  addAgentMessage: (message) => {
    set((state) => ({
      agentMessages: [...state.agentMessages, message],
    }))
  },

  clearAgentMessages: () => {
    set({ agentMessages: [] })
  },

  setProcessing: (processing) => {
    set({ isProcessing: processing })
  },

  reset: () => {
    set({
      currentProject: null,
      chapters: new Map(),
      agentMessages: [],
      isProcessing: false,
      tableOfContents: null,
    })
  },

  loadProject: (project) => {
    const chaptersMap = new Map<number, string>()
    project.chapters.forEach((ch) => {
      chaptersMap.set(ch.number, ch.content)
    })
    set({
      currentProject: project,
      chapters: chaptersMap,
      agentMessages: [],
      tableOfContents: null,
    })
    // Generate TOC if outline exists
    if (project.outline) {
      const toc = generateTableOfContents(project.title, project.outline)
      set({ tableOfContents: toc })
    }
  },

  saveProject: async () => {
    const { currentProject } = get()
    if (!currentProject) return

    try {
      await fetch(`/api/projects/${currentProject.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: currentProject.title,
          type: currentProject.type,
          description: currentProject.description,
          status: currentProject.status,
          outline: currentProject.outline,
        }),
      })
    } catch (error) {
      throw new Error('프로젝트 저장에 실패했습니다.')
    }
  },

  saveChapterToServer: async (chapterNumber, title, content) => {
    const { currentProject } = get()
    if (!currentProject) return

    try {
      await fetch(`/api/projects/${currentProject.id}/chapters`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          number: chapterNumber,
          title,
          content,
          status: 'writing',
        }),
      })
    } catch (error) {
      throw new Error('챕터 저장에 실패했습니다.')
    }
  },

  generateTOC: () => {
    const { currentProject } = get()
    if (currentProject?.outline) {
      const toc = generateTableOfContents(currentProject.title, currentProject.outline)
      set({ tableOfContents: toc })
    }
  },

  refineOutlineWithFeedback: async (feedback) => {
    const { currentProject } = get()
    if (!currentProject?.outline) return

    set({ isProcessing: true })
    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phase: 'refine',
          outline: currentProject.outline,
          feedback,
          title: currentProject.title,
        }),
      })
      const { outline: refinedOutline } = await response.json()
      set({
        currentProject: {
          ...currentProject,
          outline: refinedOutline,
          updatedAt: new Date(),
        },
      })
      // Regenerate TOC after outline change
      const toc = generateTableOfContents(currentProject.title, refinedOutline)
      set({ tableOfContents: toc })
    } finally {
      set({ isProcessing: false })
    }
  },

  addChapterToOutline: (title, summary, position) => {
    const { currentProject } = get()
    if (!currentProject?.outline) return

    const newOutline = addChapter(currentProject.outline, title, summary, position)
    set({
      currentProject: {
        ...currentProject,
        outline: newOutline,
        updatedAt: new Date(),
      },
    })
    // Regenerate TOC
    const toc = generateTableOfContents(currentProject.title, newOutline)
    set({ tableOfContents: toc })
  },

  removeChapterFromOutline: (chapterNumber) => {
    const { currentProject } = get()
    if (!currentProject?.outline) return

    const newOutline = removeChapter(currentProject.outline, chapterNumber)
    set({
      currentProject: {
        ...currentProject,
        outline: newOutline,
        updatedAt: new Date(),
      },
    })
    // Regenerate TOC
    const toc = generateTableOfContents(currentProject.title, newOutline)
    set({ tableOfContents: toc })
  },

  reorderOutlineChapters: (fromIndex, toIndex) => {
    const { currentProject } = get()
    if (!currentProject?.outline) return

    const newOutline = reorderChapters(currentProject.outline, fromIndex, toIndex)
    set({
      currentProject: {
        ...currentProject,
        outline: newOutline,
        updatedAt: new Date(),
      },
    })
    // Regenerate TOC
    const toc = generateTableOfContents(currentProject.title, newOutline)
    set({ tableOfContents: toc })
  },

  addSectionToChapter: (chapterNumber, title, summary) => {
    const { currentProject } = get()
    if (!currentProject?.outline) return

    const newOutline = addSection(currentProject.outline, chapterNumber, title, summary)
    set({
      currentProject: {
        ...currentProject,
        outline: newOutline,
        updatedAt: new Date(),
      },
    })
    // Regenerate TOC
    const toc = generateTableOfContents(currentProject.title, newOutline)
    set({ tableOfContents: toc })
  },

  removeSectionFromChapter: (chapterNumber, sectionId) => {
    const { currentProject } = get()
    if (!currentProject?.outline) return

    const newOutline = removeSection(currentProject.outline, chapterNumber, sectionId)
    set({
      currentProject: {
        ...currentProject,
        outline: newOutline,
        updatedAt: new Date(),
      },
    })
    // Regenerate TOC
    const toc = generateTableOfContents(currentProject.title, newOutline)
    set({ tableOfContents: toc })
  },
}))
