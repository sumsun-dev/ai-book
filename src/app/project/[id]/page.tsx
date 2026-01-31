import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db/client'

export default async function ProjectPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const project = await prisma.project.findUnique({
    where: { id },
    select: { stage: true }
  })

  if (!project) {
    redirect('/projects')
  }

  // 현재 단계로 리다이렉트
  const stage = project.stage || 'research'
  redirect(`/project/${id}/${stage}`)
}
