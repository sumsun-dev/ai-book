import { notFound } from 'next/navigation'
import { prisma } from '@/lib/db/client'
import ProjectLayout from '@/components/project/ProjectLayout'
import { BookProject, BookOutline, ProjectStage, BookType, ChapterStatus } from '@/types/book'

async function getProject(id: string): Promise<BookProject | null> {
  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      chapters: {
        orderBy: { number: 'asc' }
      }
    }
  })

  if (!project) return null

  return {
    id: project.id,
    title: project.title,
    type: project.type as BookType,
    description: project.description,
    status: project.status as BookProject['status'],
    stage: (project.stage || 'research') as ProjectStage,
    outline: project.outline ? JSON.parse(project.outline) as BookOutline : null,
    targetAudience: project.targetAudience,
    targetLength: project.targetLength,
    tone: project.tone,
    confirmedAt: project.confirmedAt,
    userId: project.userId,
    chapters: project.chapters.map(ch => ({
      number: ch.number,
      title: ch.title,
      content: ch.content,
      status: ch.status as ChapterStatus,
      revisions: []
    })),
    createdAt: project.createdAt,
    updatedAt: project.updatedAt
  }
}

export default async function ProjectPageLayout({
  children,
  params
}: {
  children: React.ReactNode
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const project = await getProject(id)

  if (!project) {
    notFound()
  }

  return <ProjectLayout project={project}>{children}</ProjectLayout>
}
