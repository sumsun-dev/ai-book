import { prisma } from './client'
import type { BookProject, BookOutline, Chapter, BookType, BookStatus, ProjectStage, UploadFileType, Page } from '@/types/book'
import { countWords, getPageStatus } from '@/lib/page-utils'

export interface CreateProjectDto {
  title: string
  type: BookType
  description: string
}

export interface SourceFileDto {
  fileName: string
  fileType: UploadFileType
  fileSize: number
  rawContent: string
}

export interface CreateProjectWithFileDto {
  title: string
  type: string
  description: string
  sourceFile?: SourceFileDto
  chapters?: {
    number: number
    title: string
    content: string
    status: string
  }[]
}

export interface UpdateProjectDto {
  title?: string
  type?: BookType
  description?: string
  status?: BookStatus
  stage?: ProjectStage
  outline?: BookOutline | null
  targetAudience?: string
  targetLength?: number
  tone?: string
  confirmedAt?: Date
}

export interface CreateChapterDto {
  number: number
  title: string
  content: string
  status?: string
}

function safeParseJSON<T>(json: string | null, fallback: T): T {
  if (!json) return fallback
  try {
    return JSON.parse(json) as T
  } catch {
    return fallback
  }
}

// Transform DB Project to BookProject
function toBookProject(dbProject: {
  id: string
  title: string
  type: string
  description: string
  status: string
  stage: string
  outline: string | null
  targetAudience: string | null
  targetLength: number | null
  tone: string | null
  confirmedAt: Date | null
  userId: string | null
  createdAt: Date
  updatedAt: Date
  chapters: {
    id: string
    number: number
    title: string
    content: string
    summary: string | null
    status: string
  }[]
}): BookProject {
  return {
    id: dbProject.id,
    title: dbProject.title,
    type: dbProject.type as BookType,
    description: dbProject.description,
    status: dbProject.status as BookStatus,
    stage: (dbProject.stage || 'research') as ProjectStage,
    outline: safeParseJSON<BookOutline | null>(dbProject.outline, null),
    targetAudience: dbProject.targetAudience,
    targetLength: dbProject.targetLength,
    tone: dbProject.tone,
    confirmedAt: dbProject.confirmedAt,
    userId: dbProject.userId,
    chapters: dbProject.chapters.map((ch) => ({
      id: ch.id,
      number: ch.number,
      title: ch.title,
      content: ch.content,
      summary: ch.summary || undefined,
      status: ch.status as Chapter['status'],
      revisions: [],
    })),
    createdAt: dbProject.createdAt,
    updatedAt: dbProject.updatedAt,
  }
}

export const projectRepository = {
  async findAll(userId?: string): Promise<BookProject[]> {
    const projects = await prisma.project.findMany({
      where: userId
        ? { OR: [{ userId }, { userId: null }] }
        : undefined,
      include: { chapters: true },
      orderBy: { updatedAt: 'desc' },
    })
    return projects.map(toBookProject)
  },

  async findById(id: string): Promise<BookProject | null> {
    const project = await prisma.project.findUnique({
      where: { id },
      include: { chapters: { orderBy: { number: 'asc' } } },
    })
    return project ? toBookProject(project) : null
  },

  async create(data: CreateProjectDto, userId?: string): Promise<BookProject> {
    const project = await prisma.project.create({
      data: {
        title: data.title,
        type: data.type,
        description: data.description,
        status: 'draft',
        stage: 'research',
        ...(userId && { userId }),
      },
      include: { chapters: true },
    })
    return toBookProject(project)
  },

  async update(id: string, data: UpdateProjectDto): Promise<BookProject> {
    const project = await prisma.project.update({
      where: { id },
      data: {
        ...(data.title && { title: data.title }),
        ...(data.type && { type: data.type }),
        ...(data.description && { description: data.description }),
        ...(data.status && { status: data.status }),
        ...(data.stage && { stage: data.stage }),
        ...(data.outline !== undefined && {
          outline: data.outline ? JSON.stringify(data.outline) : null,
        }),
        ...(data.targetAudience !== undefined && { targetAudience: data.targetAudience }),
        ...(data.targetLength !== undefined && { targetLength: data.targetLength }),
        ...(data.tone !== undefined && { tone: data.tone }),
        ...(data.confirmedAt !== undefined && { confirmedAt: data.confirmedAt }),
      },
      include: { chapters: { orderBy: { number: 'asc' } } },
    })
    return toBookProject(project)
  },

  async delete(id: string): Promise<void> {
    await prisma.project.delete({ where: { id } })
  },

  async saveChapter(projectId: string, data: CreateChapterDto): Promise<{ id: string; number: number; title: string }> {
    const chapter = await prisma.chapter.upsert({
      where: {
        projectId_number: {
          projectId,
          number: data.number,
        },
      },
      update: {
        title: data.title,
        content: data.content,
        status: data.status ?? 'writing',
      },
      create: {
        projectId,
        number: data.number,
        title: data.title,
        content: data.content,
        status: data.status ?? 'writing',
      },
    })
    return { id: chapter.id, number: chapter.number, title: chapter.title }
  },

  async deleteChapter(projectId: string, chapterNumber: number): Promise<void> {
    await prisma.chapter.delete({
      where: {
        projectId_number: {
          projectId,
          number: chapterNumber,
        },
      },
    })
  },

  async createWithFile(data: CreateProjectWithFileDto, userId?: string): Promise<BookProject> {
    const { sourceFile, chapters, ...projectData } = data

    const hasChapters = chapters && chapters.length > 0

    const outline: BookOutline | null = hasChapters
      ? {
          synopsis: '',
          chapters: chapters.map((ch) => ({
            number: ch.number,
            title: ch.title,
            summary: ch.content.substring(0, 200) + '...',
            keyPoints: [],
            sections: [],
          })),
          estimatedPages: Math.ceil(
            chapters.reduce((sum, ch) => sum + ch.content.length, 0) / 1500
          ),
          targetAudience: '',
          tone: '',
        }
      : null

    const project = await prisma.project.create({
      data: {
        title: projectData.title,
        type: projectData.type,
        description: projectData.description,
        status: 'draft',
        stage: hasChapters ? 'write' : 'research',
        outline: outline ? JSON.stringify(outline) : null,
        ...(userId && { userId }),
        ...(sourceFile && {
          sourceFile: {
            create: {
              fileName: sourceFile.fileName,
              fileType: sourceFile.fileType,
              fileSize: sourceFile.fileSize,
              rawContent: sourceFile.rawContent,
            },
          },
        }),
        ...(hasChapters && {
          chapters: {
            create: chapters.map((ch) => ({
              number: ch.number,
              title: ch.title,
              content: ch.content,
              status: ch.status || 'writing',
            })),
          },
        }),
      },
      include: { chapters: { orderBy: { number: 'asc' } } },
    })

    return toBookProject(project)
  },

  async saveSourceFile(
    projectId: string,
    data: SourceFileDto
  ): Promise<void> {
    await prisma.sourceFile.upsert({
      where: { projectId },
      update: {
        fileName: data.fileName,
        fileType: data.fileType,
        fileSize: data.fileSize,
        rawContent: data.rawContent,
      },
      create: {
        projectId,
        fileName: data.fileName,
        fileType: data.fileType,
        fileSize: data.fileSize,
        rawContent: data.rawContent,
      },
    })
  },

  async getPages(chapterId: string): Promise<Page[]> {
    const pages = await prisma.page.findMany({
      where: { chapterId },
      orderBy: { pageNumber: 'asc' },
    })
    return pages.map((p) => ({
      id: p.id,
      chapterId: p.chapterId,
      pageNumber: p.pageNumber,
      content: p.content,
      status: p.status as Page['status'],
      wordCount: p.wordCount,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    }))
  },

  async savePage(
    chapterId: string,
    data: { pageNumber: number; content: string }
  ): Promise<Page> {
    const wordCount = countWords(data.content)
    const status = getPageStatus(data.content)

    const page = await prisma.page.upsert({
      where: {
        chapterId_pageNumber: {
          chapterId,
          pageNumber: data.pageNumber,
        },
      },
      update: {
        content: data.content,
        status,
        wordCount,
      },
      create: {
        chapterId,
        pageNumber: data.pageNumber,
        content: data.content,
        status,
        wordCount,
      },
    })

    return {
      id: page.id,
      chapterId: page.chapterId,
      pageNumber: page.pageNumber,
      content: page.content,
      status: page.status as Page['status'],
      wordCount: page.wordCount,
      createdAt: page.createdAt,
      updatedAt: page.updatedAt,
    }
  },

  async deletePage(chapterId: string, pageNumber: number): Promise<void> {
    await prisma.page.delete({
      where: {
        chapterId_pageNumber: {
          chapterId,
          pageNumber,
        },
      },
    })
  },

  async syncPagesToChapter(chapterId: string): Promise<void> {
    await prisma.$transaction(async (tx) => {
      const pages = await tx.page.findMany({
        where: { chapterId },
        orderBy: { pageNumber: 'asc' },
      })

      const mergedContent = pages
        .map((p) => p.content)
        .filter((c) => c.trim())
        .join('\n\n')

      await tx.chapter.update({
        where: { id: chapterId },
        data: { content: mergedContent },
      })
    })
  },
}
