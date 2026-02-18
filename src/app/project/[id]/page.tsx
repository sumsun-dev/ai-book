import { notFound } from 'next/navigation'
import { prisma } from '@/lib/db/client'
import { ProjectDashboard } from '@/components/project/ProjectDashboard'
import type { BookProject, Chapter } from '@/types/book'

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      chapters: {
        orderBy: { number: 'asc' },
      },
    },
  })

  if (!project) {
    notFound()
  }

  const bookProject: BookProject = {
    id: project.id,
    title: project.title,
    type: project.type as BookProject['type'],
    description: project.description,
    outline: project.outline ? JSON.parse(project.outline) : null,
    chapters: project.chapters.map(
      (ch): Chapter => ({
        id: ch.id,
        number: ch.number,
        title: ch.title,
        content: ch.content,
        status: ch.status as Chapter['status'],
        revisions: [],
      })
    ),
    status: project.status as BookProject['status'],
    stage: project.stage as BookProject['stage'],
    targetAudience: project.targetAudience,
    targetLength: project.targetLength,
    tone: project.tone,
    confirmedAt: project.confirmedAt,
    userId: project.userId,
    createdAt: project.createdAt,
    updatedAt: project.updatedAt,
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 transition-colors duration-700">
      <ProjectDashboard project={bookProject} />
    </div>
  )
}
