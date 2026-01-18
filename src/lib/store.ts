import { create } from 'zustand'
import { BookProject, BookStatus, BookOutline, AgentMessage, BookType } from '@/types/book'

interface BookStore {
  currentProject: BookProject | null
  chapters: Map<number, string>
  agentMessages: AgentMessage[]
  isProcessing: boolean

  // Actions
  createProject: (title: string, type: BookType, description: string) => void
  updateStatus: (status: BookStatus) => void
  setOutline: (outline: BookOutline) => void
  setChapter: (number: number, content: string) => void
  addAgentMessage: (message: AgentMessage) => void
  clearAgentMessages: () => void
  setProcessing: (processing: boolean) => void
  reset: () => void
}

export const useBookStore = create<BookStore>((set, get) => ({
  currentProject: null,
  chapters: new Map(),
  agentMessages: [],
  isProcessing: false,

  createProject: (title, type, description) => {
    const project: BookProject = {
      id: crypto.randomUUID(),
      title,
      type,
      description,
      outline: null,
      chapters: [],
      status: 'draft',
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
    })
  },
}))
