'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { FileUploader, ChapterSplitter } from '@/components/upload'
import { useBookStore } from '@/lib/store'
import { SkeletonCard } from '@/components/Skeleton'
import { ProjectFilters } from '@/components/projects/ProjectFilters'
import { useProjectFilters } from '@/components/projects/useProjectFilters'
import type { BookProject, BookType, ParsedFile, SplitChapter } from '@/types/book'

const BOOK_TYPE_VALUES: BookType[] = [
  'fiction', 'nonfiction', 'selfhelp', 'technical', 'essay', 'children', 'poetry',
]

type CreateMode = 'new' | 'upload'
type UploadStep = 'upload' | 'split'

export default function ProjectsPage() {
  const router = useRouter()
  const t = useTranslations('projects')
  const tc = useTranslations('common')
  const [projects, setProjects] = useState<BookProject[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showNewForm, setShowNewForm] = useState(false)
  const [createMode, setCreateMode] = useState<CreateMode>('new')
  const [uploadStep, setUploadStep] = useState<UploadStep>('upload')
  const [parsedFile, setParsedFile] = useState<ParsedFile | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [hoveredProject, setHoveredProject] = useState<string | null>(null)
  const [newProject, setNewProject] = useState({
    title: '',
    type: 'fiction' as BookType,
    description: '',
  })

  const loadProject = useBookStore((state) => state.loadProject)
  const filterHook = useProjectFilters(projects)

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchProjects() }, [])

  const fetchProjects = async () => {
    try {
      setIsLoading(true)
      const res = await fetch('/api/projects')
      const data = await res.json()
      if (data.success) {
        setProjects(data.data)
      } else {
        setError(data.error)
      }
    } catch {
      setError(t('fetchError'))
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProject),
      })
      const data = await res.json()
      if (data.success) {
        setProjects([data.data, ...projects])
        resetForm()
      } else {
        alert(data.error)
      }
    } catch {
      alert(t('createError'))
    }
  }

  const handleFileLoaded = (file: ParsedFile) => {
    setParsedFile(file)
    setUploadStep('split')
    const titleFromFile = file.fileName.replace(/\.(txt|docx|pdf)$/i, '')
    setNewProject(prev => ({ ...prev, title: titleFromFile }))
  }

  const handleChaptersConfirm = async (chapters: SplitChapter[]) => {
    if (!parsedFile) return

    setIsCreating(true)
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newProject,
          title: newProject.title || parsedFile.fileName.replace(/\.(txt|docx|pdf)$/i, ''),
          description: newProject.description || `${parsedFile.fileName}에서 가져온 프로젝트`,
          sourceFile: {
            fileName: parsedFile.fileName,
            fileType: parsedFile.fileType,
            fileSize: parsedFile.fileSize,
            rawContent: parsedFile.content
          },
          chapters: chapters.map(ch => ({
            number: ch.number,
            title: ch.title,
            content: ch.content,
            status: 'writing'
          }))
        }),
      })

      const data = await res.json()
      if (data.success) {
        setProjects([data.data, ...projects])
        resetForm()
        router.push(`/project/${data.data.id}/write`)
      } else {
        alert(data.error)
      }
    } catch {
      alert(t('createError'))
    } finally {
      setIsCreating(false)
    }
  }

  const resetForm = () => {
    setShowNewForm(false)
    setCreateMode('new')
    setUploadStep('upload')
    setParsedFile(null)
    setNewProject({ title: '', type: 'fiction', description: '' })
  }

  const handleSelectProject = (project: BookProject) => {
    loadProject(project)
    router.push(`/project/${project.id}/${project.stage}`)
  }

  const handleDeleteProject = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm(t('deleteConfirm'))) return

    try {
      const res = await fetch(`/api/projects/${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.success) {
        setProjects(projects.filter((p) => p.id !== id))
      } else {
        alert(data.error)
      }
    } catch {
      alert(t('deleteError'))
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 transition-colors duration-700">
        <header className="sticky top-0 z-50 backdrop-blur-xl bg-neutral-50/80 dark:bg-neutral-950/80 border-b border-neutral-200/50 dark:border-neutral-800/50">
          <div className="max-w-7xl mx-auto px-8 py-6 flex items-center justify-between">
            <div className="w-8 h-8 bg-neutral-200 dark:bg-neutral-700 rounded-sm animate-pulse" />
            <div className="w-28 h-10 bg-neutral-200 dark:bg-neutral-700 animate-pulse" />
          </div>
        </header>
        <main className="max-w-7xl mx-auto px-8 py-16">
          <div className="mb-16">
            <div className="h-14 w-64 bg-neutral-200 dark:bg-neutral-700 animate-pulse rounded mb-4" />
            <div className="h-6 w-40 bg-neutral-200 dark:bg-neutral-700 animate-pulse rounded" />
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 transition-colors duration-700">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-neutral-50/80 dark:bg-neutral-950/80 border-b border-neutral-200/50 dark:border-neutral-800/50">
        <div className="max-w-7xl mx-auto px-8 py-6 flex items-center justify-between">
          <button
            onClick={() => router.push('/')}
            className="group flex items-center gap-3"
          >
            <div className="w-8 h-8 bg-neutral-900 dark:bg-white rounded-sm flex items-center justify-center transition-transform duration-500 group-hover:rotate-12">
              <span className="text-white dark:text-neutral-900 text-xs font-bold">B</span>
            </div>
            <span className="text-sm text-neutral-400 dark:text-neutral-500 group-hover:text-neutral-600 dark:group-hover:text-neutral-300 transition-colors duration-300">
              {tc('home')}
            </span>
          </button>

          <button
            onClick={() => setShowNewForm(true)}
            className="px-6 py-3 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-sm font-medium tracking-wide transition-all duration-500 hover:bg-neutral-700 dark:hover:bg-neutral-200"
          >
            {t('newProject')}
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-8 py-16">
        {/* Title Section */}
        <div className="mb-16">
          <h1 className="text-5xl md:text-6xl font-extralight tracking-tight text-neutral-900 dark:text-white mb-4">
            {t('title')}
          </h1>
          <p className="text-lg text-neutral-500 dark:text-neutral-400 font-light">
            {t('count', { count: projects.length })}
          </p>
        </div>

        {error && (
          <div className="mb-12 p-6 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* New Project Modal */}
        {showNewForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="bg-white dark:bg-neutral-900 w-full max-w-2xl max-h-[90vh] overflow-auto shadow-2xl">
              <div className="p-8 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
                <h2 className="text-2xl font-light text-neutral-900 dark:text-white tracking-tight">
                  {uploadStep === 'split' ? t('modal.title') : t('modal.title')}
                </h2>
                <button
                  onClick={resetForm}
                  className="w-10 h-10 flex items-center justify-center text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="p-8">
                {uploadStep === 'upload' && (
                  <>
                    {/* Mode Toggle */}
                    <div className="flex mb-8 border-b border-neutral-200 dark:border-neutral-800">
                      <button
                        onClick={() => setCreateMode('new')}
                        className={`flex-1 py-4 text-sm font-medium tracking-wide transition-all duration-300 border-b-2 -mb-[1px] ${
                          createMode === 'new'
                            ? 'border-neutral-900 dark:border-white text-neutral-900 dark:text-white'
                            : 'border-transparent text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300'
                        }`}
                      >
                        {t('modal.newWrite')}
                      </button>
                      <button
                        onClick={() => setCreateMode('upload')}
                        className={`flex-1 py-4 text-sm font-medium tracking-wide transition-all duration-300 border-b-2 -mb-[1px] ${
                          createMode === 'upload'
                            ? 'border-neutral-900 dark:border-white text-neutral-900 dark:text-white'
                            : 'border-transparent text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300'
                        }`}
                      >
                        {t('modal.importFile')}
                      </button>
                    </div>

                    {createMode === 'new' ? (
                      <form onSubmit={handleCreateProject} className="space-y-8">
                        <div>
                          <label className="block text-xs font-medium tracking-widest text-neutral-500 dark:text-neutral-400 uppercase mb-3">
                            {t('modal.bookTitle')}
                          </label>
                          <input
                            type="text"
                            value={newProject.title}
                            onChange={(e) => setNewProject({ ...newProject, title: e.target.value })}
                            className="w-full px-0 py-4 bg-transparent border-0 border-b border-neutral-300 dark:border-neutral-700 text-xl text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:border-neutral-900 dark:focus:border-white transition-colors"
                            placeholder={t('modal.bookTitlePlaceholder')}
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-medium tracking-widest text-neutral-500 dark:text-neutral-400 uppercase mb-3">
                            {t('modal.genre')}
                          </label>
                          <div className="grid grid-cols-4 gap-2">
                            {BOOK_TYPE_VALUES.map((type) => (
                              <button
                                key={type}
                                type="button"
                                onClick={() => setNewProject({ ...newProject, type })}
                                className={`py-3 px-4 text-sm transition-all duration-300 ${
                                  newProject.type === type
                                    ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900'
                                    : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700'
                                }`}
                              >
                                {tc(`bookTypes.${type}`)}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-medium tracking-widest text-neutral-500 dark:text-neutral-400 uppercase mb-3">
                            {t('modal.description')}
                          </label>
                          <textarea
                            value={newProject.description}
                            onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                            className="w-full px-0 py-4 bg-transparent border-0 border-b border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:border-neutral-900 dark:focus:border-white transition-colors resize-none"
                            placeholder={t('modal.descriptionPlaceholder')}
                            rows={3}
                            required
                          />
                        </div>

                        <div className="flex gap-4 pt-4">
                          <button
                            type="button"
                            onClick={resetForm}
                            className="flex-1 py-4 text-sm font-medium tracking-wide text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors"
                          >
                            {t('modal.cancel')}
                          </button>
                          <button
                            type="submit"
                            className="flex-1 py-4 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-sm font-medium tracking-wide transition-all duration-500 hover:bg-neutral-700 dark:hover:bg-neutral-200"
                          >
                            {t('modal.create')}
                          </button>
                        </div>
                      </form>
                    ) : (
                      <div className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-medium tracking-widest text-neutral-500 dark:text-neutral-400 uppercase mb-3">
                              {t('modal.bookTitle')}
                            </label>
                            <input
                              type="text"
                              value={newProject.title}
                              onChange={(e) => setNewProject({ ...newProject, title: e.target.value })}
                              className="w-full px-0 py-3 bg-transparent border-0 border-b border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:border-neutral-900 dark:focus:border-white transition-colors"
                              placeholder={t('modal.bookTitlePlaceholder')}
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium tracking-widest text-neutral-500 dark:text-neutral-400 uppercase mb-3">
                              {t('modal.genre')}
                            </label>
                            <select
                              value={newProject.type}
                              onChange={(e) => setNewProject({ ...newProject, type: e.target.value as BookType })}
                              className="w-full px-0 py-3 bg-transparent border-0 border-b border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-white focus:outline-none focus:border-neutral-900 dark:focus:border-white transition-colors"
                            >
                              {BOOK_TYPE_VALUES.map((type) => (
                                <option key={type} value={type} className="bg-white dark:bg-neutral-900">
                                  {tc(`bookTypes.${type}`)}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>

                        <FileUploader
                          onFileLoaded={handleFileLoaded}
                          onCancel={resetForm}
                        />
                      </div>
                    )}
                  </>
                )}

                {uploadStep === 'split' && parsedFile && (
                  <ChapterSplitter
                    parsedFile={parsedFile}
                    onConfirm={handleChaptersConfirm}
                    onCancel={resetForm}
                    isProcessing={isCreating}
                  />
                )}
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        {projects.length > 0 && (
          <ProjectFilters
            filterHook={filterHook}
            totalCount={projects.length}
            filteredCount={filterHook.filteredProjects.length}
          />
        )}

        {/* Projects Grid */}
        {projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32">
            <div className="w-24 h-32 mb-8 relative">
              <div className="absolute inset-0 border-2 border-neutral-300 dark:border-neutral-700 transform rotate-3" />
              <div className="absolute inset-0 border-2 border-neutral-400 dark:border-neutral-600 transform -rotate-2" />
              <div className="absolute inset-0 bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
                <span className="text-4xl text-neutral-300 dark:text-neutral-600">+</span>
              </div>
            </div>
            <p className="text-neutral-500 dark:text-neutral-400 text-lg mb-6">{t('empty')}</p>
            <button
              onClick={() => setShowNewForm(true)}
              className="px-8 py-4 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-sm font-medium tracking-wide transition-all duration-500 hover:bg-neutral-700 dark:hover:bg-neutral-200"
            >
              {t('createFirst')}
            </button>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filterHook.filteredProjects.length === 0 && projects.length > 0 ? (
              <div className="col-span-full flex flex-col items-center justify-center py-20">
                <p className="text-neutral-500 dark:text-neutral-400 text-lg mb-4">
                  {t('noResults')}
                </p>
                <button
                  onClick={() => filterHook.resetFilters()}
                  className="text-sm text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors"
                >
                  {t('resetFilter')}
                </button>
              </div>
            ) : null}
            {filterHook.filteredProjects.map((project) => (
              <article
                key={project.id}
                onClick={() => handleSelectProject(project)}
                onMouseEnter={() => setHoveredProject(project.id)}
                onMouseLeave={() => setHoveredProject(null)}
                className="group cursor-pointer"
              >
                {/* Book Cover Visual */}
                <div className="relative aspect-[3/4] mb-4 overflow-hidden bg-neutral-100 dark:bg-neutral-900">
                  <div
                    className={`absolute inset-0 transition-all duration-700 ${
                      hoveredProject === project.id ? 'scale-105' : 'scale-100'
                    }`}
                  >
                    {/* Dynamic cover based on type */}
                    {project.type === 'fiction' && (
                      <div className="w-full h-full bg-neutral-900 dark:bg-neutral-800 flex items-center justify-center">
                        <div className={`w-32 h-32 rounded-full bg-white/10 transition-transform duration-700 ${hoveredProject === project.id ? 'scale-110' : ''}`} />
                        <div className={`absolute w-4 h-4 rounded-full bg-red-500 top-1/3 right-1/3 transition-all duration-700 ${hoveredProject === project.id ? 'opacity-100' : 'opacity-70'}`} />
                      </div>
                    )}
                    {project.type === 'nonfiction' && (
                      <div className="w-full h-full bg-gradient-to-br from-neutral-200 to-neutral-300 dark:from-neutral-800 dark:to-neutral-900 flex items-end p-6">
                        <div className="grid grid-cols-4 gap-1 w-full">
                          {Array.from({ length: 16 }).map((_, i) => (
                            <div
                              key={i}
                              className={`aspect-square transition-all duration-500 ${
                                i === 6 ? 'bg-blue-500' : 'bg-neutral-400/30 dark:bg-neutral-600/30'
                              } ${hoveredProject === project.id && i >= 12 ? 'opacity-50' : ''}`}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                    {project.type === 'selfhelp' && (
                      <div className="w-full h-full bg-amber-50 dark:bg-amber-950/30 flex items-center justify-center">
                        <svg className={`w-full h-full transition-transform duration-700 ${hoveredProject === project.id ? 'translate-y-[-5%]' : ''}`} viewBox="0 0 100 100" fill="none">
                          <line x1="20" y1="80" x2="80" y2="20" stroke="currentColor" className="text-neutral-300 dark:text-neutral-700" strokeWidth="2" />
                          <circle cx="80" cy="20" r="6" className="fill-orange-500" />
                        </svg>
                      </div>
                    )}
                    {project.type === 'technical' && (
                      <div className="w-full h-full bg-slate-100 dark:bg-slate-900 p-8 flex items-center justify-center">
                        <div className="grid grid-cols-3 gap-2 w-full">
                          {Array.from({ length: 9 }).map((_, i) => (
                            <div
                              key={i}
                              className={`aspect-square transition-all duration-300 ${
                                [1, 4, 7].includes(i) ? 'bg-cyan-400/80' : 'border border-neutral-300 dark:border-neutral-700'
                              }`}
                              style={{ transitionDelay: `${i * 50}ms` }}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                    {project.type === 'essay' && (
                      <div className="w-full h-full bg-stone-100 dark:bg-stone-900 flex items-center justify-center p-12">
                        <svg className="w-full h-full" viewBox="0 0 100 40" fill="none">
                          <path
                            d="M10 30 Q30 5 50 20 T90 15"
                            stroke="currentColor"
                            className="text-stone-400 dark:text-stone-600"
                            strokeWidth="3"
                            strokeLinecap="round"
                            fill="none"
                          />
                        </svg>
                      </div>
                    )}
                    {project.type === 'children' && (
                      <div className="w-full h-full bg-white dark:bg-neutral-900 flex items-center justify-center">
                        <div className="relative">
                          <div className={`w-20 h-20 rounded-full bg-yellow-400 absolute -left-6 -top-6 transition-transform duration-500 ${hoveredProject === project.id ? 'scale-110' : ''}`} />
                          <div className={`w-16 h-16 rounded-full bg-pink-400 absolute left-4 top-0 transition-transform duration-500 ${hoveredProject === project.id ? 'scale-110' : ''}`} style={{ transitionDelay: '100ms' }} />
                          <div className={`w-14 h-14 rounded-full bg-blue-400 absolute left-0 top-8 transition-transform duration-500 ${hoveredProject === project.id ? 'scale-110' : ''}`} style={{ transitionDelay: '200ms' }} />
                        </div>
                      </div>
                    )}
                    {project.type === 'poetry' && (
                      <div className="w-full h-full bg-violet-50 dark:bg-violet-950/20 flex items-center justify-center p-8">
                        <svg className="w-full h-full" viewBox="0 0 60 100" fill="none">
                          <path
                            d="M30 10 Q25 30 30 50 Q35 70 25 90"
                            stroke="currentColor"
                            className="text-violet-300 dark:text-violet-800"
                            strokeWidth="1"
                            fill="none"
                          />
                          <circle cx="25" cy="90" r="3" className="fill-violet-500" />
                        </svg>
                      </div>
                    )}
                  </div>

                  {/* Status Badge */}
                  <div className="absolute top-4 left-4">
                    <span className="px-3 py-1.5 bg-white/90 dark:bg-black/80 text-xs font-medium tracking-wider text-neutral-700 dark:text-neutral-300 backdrop-blur-sm">
                      {tc(`stages.${project.stage}`)}
                    </span>
                  </div>

                  {/* Delete Button */}
                  <button
                    onClick={(e) => handleDeleteProject(project.id, e)}
                    className={`absolute top-4 right-4 w-8 h-8 flex items-center justify-center bg-white/90 dark:bg-black/80 text-neutral-500 hover:text-red-500 backdrop-blur-sm transition-all duration-300 ${
                      hoveredProject === project.id ? 'opacity-100' : 'opacity-0'
                    }`}
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>

                {/* Book Info */}
                <div className="space-y-2">
                  <h3 className="text-lg font-medium text-neutral-900 dark:text-white tracking-tight line-clamp-1 group-hover:text-neutral-600 dark:group-hover:text-neutral-300 transition-colors duration-300">
                    {project.title}
                  </h3>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400 line-clamp-2">
                    {project.description}
                  </p>
                  <div className="flex items-center gap-3 pt-2">
                    <span className="text-xs text-neutral-400 dark:text-neutral-500">
                      {tc(`bookTypes.${project.type}`)}
                    </span>
                    <span className="text-xs text-neutral-300 dark:text-neutral-700">|</span>
                    <span className="text-xs text-neutral-400 dark:text-neutral-500">
                      {tc(`status.${project.status}`)}
                    </span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
