export type BookType =
  | 'fiction'
  | 'nonfiction'
  | 'selfhelp'
  | 'technical'
  | 'essay'
  | 'children'
  | 'poetry'

export interface BookProject {
  id: string
  title: string
  type: BookType
  description: string
  outline: BookOutline | null
  chapters: Chapter[]
  status: BookStatus
  createdAt: Date
  updatedAt: Date
}

export type BookStatus =
  | 'draft'
  | 'researching'
  | 'outlining'
  | 'writing'
  | 'editing'
  | 'reviewing'
  | 'completed'

export interface BookOutline {
  synopsis: string
  chapters: ChapterOutline[]
  estimatedPages: number
  targetAudience: string
  tone: string
}

export interface Section {
  id: string
  title: string
  summary: string
  estimatedWords: number
}

export interface ChapterOutline {
  number: number
  title: string
  summary: string
  keyPoints: string[]
  sections: Section[]
}

export interface TOCEntry {
  type: 'chapter' | 'section'
  number: string
  title: string
  page?: number
}

export interface TableOfContents {
  title: string
  entries: TOCEntry[]
  generatedAt: Date
}

export interface OutlineFeedback {
  type: 'add_chapter' | 'remove_chapter' | 'modify_chapter' | 'reorder' | 'general'
  targetChapter?: number
  instruction: string
}

export interface Chapter {
  number: number
  title: string
  content: string
  status: ChapterStatus
  revisions: Revision[]
}

export type ChapterStatus =
  | 'pending'
  | 'writing'
  | 'editing'
  | 'reviewing'
  | 'approved'

export interface Revision {
  id: string
  content: string
  feedback: string
  agent: AgentType
  timestamp: Date
}

export type AgentType =
  | 'research'
  | 'outliner'
  | 'writer'
  | 'editor'
  | 'critic'

export interface AgentMessage {
  agent: AgentType
  type: 'thinking' | 'output' | 'feedback'
  content: string
  timestamp: Date
}

export interface ResearchResult {
  topic: string
  findings: string[]
  sources: string[]
  recommendations: string[]
}
