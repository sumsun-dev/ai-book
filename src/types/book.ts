export type BookType =
  | 'fiction'
  | 'nonfiction'
  | 'selfhelp'
  | 'technical'
  | 'essay'
  | 'children'
  | 'poetry'

export type ProjectStage = 'research' | 'outline' | 'write' | 'edit' | 'review'

export interface User {
  id: string
  email: string
  name: string | null
  image: string | null
  provider: string | null
}

export interface BookProject {
  id: string
  title: string
  type: BookType
  description: string
  outline: BookOutline | null
  chapters: Chapter[]
  status: BookStatus
  stage: ProjectStage
  targetAudience: string | null
  targetLength: number | null
  tone: string | null
  confirmedAt: Date | null
  userId: string | null
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
  | 'editor-critic'

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

export interface CoverImage {
  id: string
  projectId: string
  imageUrl: string
  prompt?: string
  template?: string
  createdAt: Date
  updatedAt: Date
}

// Research 단계 관련 타입
export interface AIQuestion {
  id: string
  question: string
  category: 'audience' | 'theme' | 'structure' | 'style' | 'content'
  priority: number
}

export interface UserAnswer {
  questionId: string
  answer: string
  timestamp: Date
}

export interface ResearchDataType {
  id: string
  projectId: string
  initialIdea: string
  aiQuestions: AIQuestion[]
  userAnswers: UserAnswer[]
  findings: ResearchFinding[]
  references: Reference[]
  createdAt: Date
  updatedAt: Date
}

export interface ResearchFinding {
  topic: string
  insight: string
  source: string | null
  relevance: 'high' | 'medium' | 'low'
}

export interface Reference {
  title: string
  author: string | null
  url: string | null
  type: 'book' | 'article' | 'website' | 'other'
  notes: string | null
}

// Edit 단계 관련 타입
export interface EditHistoryEntry {
  id: string
  projectId: string
  chapterId: string | null
  type: 'suggestion' | 'revision' | 'approval' | 'rejection'
  agent: AgentType
  beforeContent: string | null
  afterContent: string
  feedback: string | null
  createdAt: Date
}

export interface EditSuggestion {
  id: string
  chapterNumber: number
  originalText: string
  suggestedText: string
  reason: string
  type: 'grammar' | 'style' | 'clarity' | 'structure' | 'content'
  severity: 'minor' | 'moderate' | 'major'
  status: 'pending' | 'accepted' | 'rejected'
}

// 단계별 진행 상태
export interface StageProgress {
  research: {
    ideaSubmitted: boolean
    questionsAnswered: number
    totalQuestions: number
    researchComplete: boolean
  }
  outline: {
    settingsComplete: boolean
    outlineGenerated: boolean
    outlineConfirmed: boolean
  }
  write: {
    totalChapters: number
    completedChapters: number
    currentChapter: number | null
  }
  edit: {
    totalSuggestions: number
    reviewedSuggestions: number
    acceptedSuggestions: number
  }
  review: {
    allChaptersReviewed: boolean
    approved: boolean
  }
}
