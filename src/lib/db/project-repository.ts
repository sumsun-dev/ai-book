import { prisma } from './client'
import type { BookProject, BookOutline, Chapter, BookType, BookStatus, ProjectStage } from '@/types/book'

export interface CreateProjectDto {
  title: string
  type: BookType
  description: string
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
    outline: dbProject.outline ? JSON.parse(dbProject.outline) : null,
    targetAudience: dbProject.targetAudience,
    targetLength: dbProject.targetLength,
    tone: dbProject.tone,
    confirmedAt: dbProject.confirmedAt,
    userId: dbProject.userId,
    chapters: dbProject.chapters.map((ch) => ({
      number: ch.number,
      title: ch.title,
      content: ch.content,
      status: ch.status as Chapter['status'],
      revisions: [],
    })),
    createdAt: dbProject.createdAt,
    updatedAt: dbProject.updatedAt,
  }
}

export const projectRepository = {
  async findAll(): Promise<BookProject[]> {
    const projects = await prisma.project.findMany({
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

  async create(data: CreateProjectDto): Promise<BookProject> {
    const project = await prisma.project.create({
      data: {
        title: data.title,
        type: data.type,
        description: data.description,
        status: 'draft',
        stage: 'research',
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

  async saveChapter(projectId: string, data: CreateChapterDto): Promise<void> {
    await prisma.chapter.upsert({
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
}
