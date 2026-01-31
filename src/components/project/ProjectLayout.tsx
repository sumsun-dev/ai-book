'use client'

import { BookProject } from '@/types/book'
import ProjectSidebar from './ProjectSidebar'

interface ProjectLayoutProps {
  project: BookProject
  children: React.ReactNode
}

export default function ProjectLayout({ project, children }: ProjectLayoutProps) {
  return (
    <div className="flex h-screen bg-white dark:bg-gray-950">
      <ProjectSidebar project={project} />
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  )
}
