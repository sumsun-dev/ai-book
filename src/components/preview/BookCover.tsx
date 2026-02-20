'use client'

import type { BookProject } from '@/types/book'

interface BookCoverProps {
  project: BookProject
  coverImageUrl?: string
  onClick?: () => void
}

const typeColors: Record<string, string> = {
  fiction: 'from-purple-600 to-indigo-600',
  nonfiction: 'from-blue-600 to-cyan-600',
  selfhelp: 'from-green-600 to-emerald-600',
  technical: 'from-gray-700 to-slate-600',
  essay: 'from-amber-600 to-orange-600',
  children: 'from-pink-500 to-rose-500',
  poetry: 'from-violet-600 to-purple-600',
}

export function BookCover({ project, coverImageUrl, onClick }: BookCoverProps) {
  const gradientClass = typeColors[project.type] || 'from-gray-600 to-gray-700'

  return (
    <div
      onClick={onClick}
      className="group perspective-1000 cursor-pointer"
      style={{ perspective: '1000px' }}
    >
      <div
        className="relative w-64 h-96 transition-transform duration-500 transform-style-preserve-3d group-hover:rotate-y-15"
        style={{
          transformStyle: 'preserve-3d',
          transform: 'rotateY(-5deg)',
        }}
      >
        {/* Book spine */}
        <div
          className={`absolute left-0 w-4 h-full bg-gradient-to-b ${gradientClass} opacity-80 rounded-l-sm`}
          style={{
            transform: 'rotateY(-90deg) translateX(-8px)',
            transformOrigin: 'left',
          }}
        />

        {/* Front cover */}
        <div
          className={`absolute inset-0 rounded-r-lg shadow-2xl overflow-hidden ${
            coverImageUrl ? '' : `bg-gradient-to-br ${gradientClass}`
          }`}
          style={{
            backfaceVisibility: 'hidden',
          }}
        >
          {coverImageUrl ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={coverImageUrl}
              alt={project.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full p-6 text-white">
              <div className="text-sm uppercase tracking-widest opacity-70 mb-4">
                {project.type}
              </div>
              <h2 className="text-2xl font-bold text-center leading-tight mb-4">
                {project.title}
              </h2>
              <div className="mt-auto text-sm opacity-70">AI Book</div>
            </div>
          )}

          {/* Shine effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        </div>

        {/* Page edges */}
        <div
          className="absolute right-0 w-2 h-full bg-gradient-to-r from-gray-100 to-gray-200"
          style={{
            transform: 'rotateY(90deg) translateX(4px)',
            transformOrigin: 'right',
          }}
        />
      </div>

      <p className="text-center text-gray-400 text-sm mt-4 group-hover:text-white transition-colors">
        클릭하여 열기
      </p>
    </div>
  )
}
