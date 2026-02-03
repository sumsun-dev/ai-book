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
  id?: string
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

// 페이지 관련 타입
export type PageStatus = 'empty' | 'draft' | 'complete'

export interface Page {
  id: string
  chapterId: string
  pageNumber: number
  content: string
  status: PageStatus
  wordCount: number
  createdAt?: Date
  updatedAt?: Date
}

export type PageViewMode = 'single' | 'spread' | 'continuous'

export type PaperSize = 'a4' | 'a5' | 'b5' | 'letter' | 'novel'

export interface PaperDimensions {
  name: string
  width: number  // px (기준 너비)
  height: number // px (기준 높이)
  ratio: number  // 가로세로 비율
}

export const PAPER_SIZES: Record<PaperSize, PaperDimensions> = {
  a4: { name: 'A4', width: 595, height: 842, ratio: 1.414 },
  a5: { name: 'A5', width: 420, height: 595, ratio: 1.417 },
  b5: { name: 'B5', width: 499, height: 709, ratio: 1.42 },
  letter: { name: 'Letter', width: 612, height: 792, ratio: 1.29 },
  novel: { name: '신국판 (소설)', width: 430, height: 637, ratio: 1.48 },
}

export interface PageEditorState {
  pages: Page[]
  currentPage: number
  totalPages: number
  zoom: number // 50-200%
  viewMode: PageViewMode
  paperSize: PaperSize
  isDirty: boolean
  lastSaved: Date | null
}

export interface PageGenerateMode {
  mode: 'new' | 'continue' | 'rewrite'
  context?: string
}

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

// 파일 업로드 관련 타입
export type UploadFileType = 'txt' | 'docx' | 'pdf'

export interface ParsedFile {
  content: string
  fileName: string
  fileType: UploadFileType
  fileSize: number
}

export interface SourceFile {
  id: string
  projectId: string
  fileName: string
  fileType: UploadFileType
  fileSize: number
  rawContent: string
  createdAt: Date
}

export interface ChapterBoundary {
  startLine: number
  endLine: number
  title: string
}

export interface SplitChapter {
  number: number
  title: string
  content: string
}

// ===== 출판 메타데이터 타입 =====

export type AuthorRole = 'author' | 'co-author' | 'editor' | 'translator' | 'illustrator'

export interface Author {
  name: string
  role: AuthorRole
  bio?: string
  email?: string
  website?: string
}

export interface BookCategory {
  system: 'BISAC' | 'KDC' | 'DDC' | 'custom'
  code: string
  name: string
}

export interface BookMetadata {
  id: string
  projectId: string
  subtitle?: string
  authors: Author[]
  publisher?: string
  publisherAddress?: string
  publishDate?: Date
  edition?: string
  printRun?: number
  categories: BookCategory[]
  keywords: string[]
  language: string
  copyright?: string
  license?: string
  createdAt?: Date
  updatedAt?: Date
}

// ===== ISBN 타입 =====

export interface ISBNData {
  id: string
  projectId: string
  isbn13: string
  isbn10?: string
  checkDigit: string
  prefix: string        // 978 또는 979
  groupCode: string     // 국가/언어 그룹 (한국: 89)
  registrant: string    // 출판사 코드
  publication: string   // 도서 코드
  barcodeUrl?: string
  isValid: boolean
  assignedAt?: Date
  createdAt?: Date
  updatedAt?: Date
}

export interface ISBNComponents {
  prefix: string
  groupCode: string
  registrant: string
  publication: string
  checkDigit: string
}

// ===== 내보내기 관련 타입 =====

export type ExportFormat = 'pdf' | 'epub' | 'mobi' | 'print-pdf'

export interface ExportOptions {
  format: ExportFormat
  includeMetadata: boolean
  includeCover: boolean
  includeToc: boolean
}

export interface EPUBOptions {
  title: string
  author: string | string[]
  publisher?: string
  language?: string
  cover?: string | Buffer
  css?: string
  tocTitle?: string
  version?: 2 | 3
}

export interface PrintOptions {
  paperSize: PaperSize
  colorMode: 'CMYK' | 'RGB'
  dpi: 300 | 400 | 600
  bleed?: number  // mm
  cropMarks?: boolean
  iccProfile?: 'FOGRA39' | 'FOGRA51'
}

// 메모 타입
export interface Memo {
  id: string
  projectId: string
  content: string
  chapterNumber: number | null
  createdAt: Date
  updatedAt: Date
}

// AI Chat 타입
export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  chapterNumber?: number
  pageNumber?: number
}

export interface ChatContext {
  chapterNumber: number
  pageNumber?: number
  selectedText?: string
  fullContent?: string
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
