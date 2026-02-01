'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { BookType } from '@/types/book'

const bookTypes: { type: BookType; name: string; description: string }[] = [
  { type: 'fiction', name: '소설', description: '장편/단편, 로맨스, 판타지, SF' },
  { type: 'nonfiction', name: '논픽션', description: '역사, 과학, 사회, 인문' },
  { type: 'selfhelp', name: '자기계발', description: '성공, 습관, 동기부여' },
  { type: 'technical', name: '기술서적', description: '프로그래밍, IT, 전문기술' },
  { type: 'essay', name: '에세이', description: '개인 경험, 일상, 여행' },
  { type: 'children', name: '동화', description: '그림책, 아동문학' },
  { type: 'poetry', name: '시집', description: '현대시, 서정시, 시 모음' },
]

// Award-winning minimal book cover designs
const BookCover = ({ type, isHovered }: { type: BookType; isHovered: boolean }) => {
  const covers: Record<BookType, JSX.Element> = {
    // Fiction - Bold abstract with negative space
    fiction: (
      <svg viewBox="0 0 120 160" className="w-full h-full">
        <rect x="0" y="0" width="120" height="160" fill="#0a0a0a" />
        {/* Large abstract circle - moon/portal concept */}
        <circle
          cx="75"
          cy="65"
          r="50"
          fill="none"
          stroke="#e5e5e5"
          strokeWidth="0.5"
        />
        <circle
          cx="75"
          cy="65"
          r="35"
          fill="#e5e5e5"
        />
        {/* Small accent */}
        <circle cx="32" cy="120" r="4" fill="#dc2626" />
        {/* Minimal typography lines */}
        <rect x="20" y="140" width="40" height="1" fill="#e5e5e5" />
        <rect x="20" y="148" width="25" height="0.5" fill="#737373" />
      </svg>
    ),

    // Nonfiction - Geometric precision
    nonfiction: (
      <svg viewBox="0 0 120 160" className="w-full h-full">
        <rect x="0" y="0" width="120" height="160" fill="#f5f5f4" />
        {/* Grid of squares - knowledge structure */}
        <g fill="#1a1a1a">
          <rect x="20" y="25" width="25" height="25" />
          <rect x="48" y="25" width="25" height="25" />
          <rect x="76" y="25" width="25" height="25" />
          <rect x="20" y="53" width="25" height="25" />
          <rect x="48" y="53" width="25" height="25" opacity="0.6" />
          <rect x="76" y="53" width="25" height="25" opacity="0.3" />
          <rect x="20" y="81" width="25" height="25" opacity="0.4" />
        </g>
        {/* Single accent square */}
        <rect x="76" y="81" width="25" height="25" fill="#2563eb" />
        {/* Typography */}
        <rect x="20" y="125" width="55" height="1.5" fill="#1a1a1a" />
        <rect x="20" y="133" width="35" height="1" fill="#a3a3a3" />
      </svg>
    ),

    // Self-help - Powerful ascending line
    selfhelp: (
      <svg viewBox="0 0 120 160" className="w-full h-full">
        <rect x="0" y="0" width="120" height="160" fill="#fafaf9" />
        {/* Ascending diagonal - growth concept */}
        <line
          x1="15" y1="110"
          x2="105" y2="30"
          stroke="#1a1a1a"
          strokeWidth="2"
        />
        {/* Peak marker */}
        <circle cx="105" cy="30" r="8" fill="#f97316" />
        {/* Starting point */}
        <circle cx="15" cy="110" r="3" fill="#1a1a1a" />
        {/* Typography */}
        <rect x="15" y="135" width="50" height="1.5" fill="#1a1a1a" />
        <rect x="15" y="143" width="30" height="1" fill="#a3a3a3" />
      </svg>
    ),

    // Technical - Minimal grid system
    technical: (
      <svg viewBox="0 0 120 160" className="w-full h-full">
        <rect x="0" y="0" width="120" height="160" fill="#18181b" />
        {/* Grid lines */}
        <g stroke="#27272a" strokeWidth="0.5">
          {[0, 1, 2, 3, 4, 5].map(i => (
            <line key={`h${i}`} x1="0" y1={20 + i * 20} x2="120" y2={20 + i * 20} />
          ))}
          {[0, 1, 2, 3, 4, 5, 6].map(i => (
            <line key={`v${i}`} x1={i * 20} y1="0" x2={i * 20} y2="120" />
          ))}
        </g>
        {/* Accent blocks - code/data visualization */}
        <rect x="20" y="40" width="40" height="20" fill="#22d3ee" />
        <rect x="60" y="60" width="20" height="20" fill="#22d3ee" opacity="0.6" />
        <rect x="40" y="80" width="60" height="20" fill="#22d3ee" opacity="0.3" />
        {/* Cursor blink */}
        <rect x="20" y="100" width="2" height="12" fill="#22d3ee" />
        {/* Typography */}
        <rect x="20" y="135" width="45" height="1" fill="#fafafa" />
        <rect x="20" y="142" width="28" height="0.5" fill="#52525b" />
      </svg>
    ),

    // Essay - Single expressive stroke
    essay: (
      <svg viewBox="0 0 120 160" className="w-full h-full">
        <rect x="0" y="0" width="120" height="160" fill="#fef3c7" />
        {/* Single flowing brushstroke */}
        <path
          d="M25 120 Q45 100 50 70 Q55 40 75 35 Q95 30 100 45"
          stroke="#1a1a1a"
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
        />
        {/* Ink drop accent */}
        <circle cx="100" cy="45" r="6" fill="#1a1a1a" />
        {/* Small drops */}
        <circle cx="92" cy="55" r="2" fill="#1a1a1a" opacity="0.4" />
        <circle cx="30" cy="115" r="1.5" fill="#1a1a1a" opacity="0.3" />
        {/* Typography */}
        <rect x="20" y="140" width="45" height="1.5" fill="#1a1a1a" />
        <rect x="20" y="148" width="28" height="1" fill="#a3a3a3" />
      </svg>
    ),

    // Children - Bold playful shapes
    children: (
      <svg viewBox="0 0 120 160" className="w-full h-full">
        <rect x="0" y="0" width="120" height="160" fill="#fef2f2" />
        {/* Large overlapping shapes */}
        <circle cx="45" cy="55" r="35" fill="#fbbf24" />
        <circle cx="80" cy="70" r="30" fill="#f472b6" opacity="0.85" />
        <circle cx="55" cy="90" r="25" fill="#34d399" opacity="0.8" />
        {/* Small accent */}
        <circle cx="95" cy="35" r="8" fill="#1a1a1a" />
        {/* Typography */}
        <rect x="20" y="135" width="50" height="1.5" fill="#1a1a1a" />
        <rect x="20" y="143" width="30" height="1" fill="#a3a3a3" />
      </svg>
    ),

    // Poetry - Ethereal single element
    poetry: (
      <svg viewBox="0 0 120 160" className="w-full h-full">
        <rect x="0" y="0" width="120" height="160" fill="#1a1a1a" />
        {/* Single feather/leaf - delicate */}
        <path
          d="M60 25 Q70 45 65 70 Q60 95 55 110 Q53 115 60 110 Q67 105 65 95 Q63 80 68 60 Q73 40 60 25"
          fill="none"
          stroke="#e5e5e5"
          strokeWidth="0.75"
        />
        {/* Center vein */}
        <line x1="60" y1="30" x2="58" y2="105" stroke="#e5e5e5" strokeWidth="0.5" />
        {/* Small accent dot */}
        <circle cx="60" cy="25" r="2" fill="#a78bfa" />
        {/* Typography */}
        <rect x="35" y="135" width="50" height="1" fill="#e5e5e5" />
        <rect x="35" y="143" width="30" height="0.5" fill="#525252" />
      </svg>
    ),
  }

  return (
    <div className={`relative transition-all duration-700 ease-out ${isHovered ? 'scale-[1.03]' : 'scale-100'}`}>
      {/* Shadow */}
      <div className={`absolute inset-0 bg-black/20 rounded-sm transition-all duration-700 ${isHovered ? 'blur-xl translate-x-2 translate-y-3 opacity-60' : 'blur-md translate-x-1 translate-y-1 opacity-40'}`} />
      {/* Cover */}
      <div className="relative overflow-hidden rounded-sm">
        {covers[type]}
      </div>
      {/* Spine effect */}
      <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-gradient-to-r from-black/20 to-transparent" />
      {/* Page edges */}
      <div className="absolute right-0 top-1 bottom-1 w-[3px] bg-gradient-to-r from-neutral-200 to-neutral-100" />
    </div>
  )
}

export default function NewProjectPage() {
  const router = useRouter()
  const [step, setStep] = useState<'type' | 'details'>('type')
  const [selectedType, setSelectedType] = useState<BookType | null>(null)
  const [hoveredType, setHoveredType] = useState<BookType | null>(null)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleTypeSelect = (type: BookType) => {
    setSelectedType(type)
    setStep('details')
  }

  const handleCreate = async () => {
    if (!selectedType || !title.trim()) return

    setIsCreating(true)
    setError(null)
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          type: selectedType,
          description: description.trim() || `${title} - ${bookTypes.find(b => b.type === selectedType)?.name}`
        })
      })

      const data = await res.json()
      if (data.success && data.data?.id) {
        router.push(`/project/${data.data.id}/research`)
      } else {
        setError(data.error || '프로젝트 생성에 실패했습니다.')
        setIsCreating(false)
      }
    } catch {
      setError('프로젝트 생성에 실패했습니다. 다시 시도해주세요.')
      setIsCreating(false)
    }
  }

  return (
    <div className="min-h-screen bg-white dark:bg-neutral-950">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-neutral-950/80 backdrop-blur-md border-b border-neutral-100 dark:border-neutral-900">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link
            href="/"
            className="text-sm font-medium tracking-wide text-neutral-900 dark:text-white hover:opacity-60 transition-opacity"
          >
            AI Book
          </Link>
          <Link
            href="/projects"
            className="text-xs text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors tracking-wide"
          >
            프로젝트
          </Link>
        </div>
      </header>

      <main className="pt-14">
        {/* Step 1: Book type selection */}
        {step === 'type' && (
          <div className="min-h-[calc(100vh-56px)] flex flex-col">
            {/* Hero text */}
            <div className="pt-20 pb-16 px-6">
              <div className="max-w-7xl mx-auto">
                <h1 className="text-[clamp(2rem,5vw,4rem)] font-light tracking-tight text-neutral-900 dark:text-white leading-[1.1]">
                  어떤 이야기를
                  <br />
                  <span className="font-normal">시작할까요?</span>
                </h1>
              </div>
            </div>

            {/* Book grid */}
            <div className="flex-1 px-6 pb-20">
              <div className="max-w-7xl mx-auto">
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-6 lg:gap-8">
                  {bookTypes.map((book) => (
                    <button
                      key={book.type}
                      onClick={() => handleTypeSelect(book.type)}
                      onMouseEnter={() => setHoveredType(book.type)}
                      onMouseLeave={() => setHoveredType(null)}
                      className="group text-left focus:outline-none"
                    >
                      {/* Book cover */}
                      <div className="aspect-[3/4] mb-4">
                        <BookCover type={book.type} isHovered={hoveredType === book.type} />
                      </div>

                      {/* Label */}
                      <div className="space-y-1">
                        <h3 className="text-sm font-medium text-neutral-900 dark:text-white tracking-wide">
                          {book.name}
                        </h3>
                        <p className="text-[11px] text-neutral-400 leading-relaxed tracking-wide">
                          {book.description}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Details input */}
        {step === 'details' && selectedType && (
          <div className="min-h-[calc(100vh-56px)]">
            <div className="max-w-7xl mx-auto px-6 py-20">
              {/* Back button */}
              <button
                onClick={() => setStep('type')}
                className="group inline-flex items-center gap-2 text-xs text-neutral-400 hover:text-neutral-900 dark:hover:text-white mb-16 transition-colors tracking-wide"
              >
                <svg className="w-3 h-3 transition-transform group-hover:-translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
                다른 장르
              </button>

              <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-start">
                {/* Book preview */}
                <div className="lg:sticky lg:top-32">
                  <div className="w-48 lg:w-64 mx-auto lg:mx-0">
                    <BookCover type={selectedType} isHovered={true} />
                    <p className="mt-6 text-sm font-medium text-neutral-900 dark:text-white text-center lg:text-left tracking-wide">
                      {bookTypes.find(b => b.type === selectedType)?.name}
                    </p>
                  </div>
                </div>

                {/* Form */}
                <div className="max-w-md">
                  <h1 className="text-3xl lg:text-4xl font-light text-neutral-900 dark:text-white mb-3 tracking-tight">
                    제목을 알려주세요
                  </h1>
                  <p className="text-sm text-neutral-400 mb-12 tracking-wide">
                    나중에 언제든 변경할 수 있습니다
                  </p>

                  <div className="space-y-8">
                    {/* Title */}
                    <div>
                      <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="책 제목"
                        className="w-full px-0 py-4 text-2xl lg:text-3xl font-light
                          bg-transparent border-0 border-b border-neutral-200 dark:border-neutral-800
                          text-neutral-900 dark:text-white
                          placeholder-neutral-300 dark:placeholder-neutral-700
                          focus:outline-none focus:border-neutral-900 dark:focus:border-white
                          transition-colors tracking-tight"
                        autoFocus
                      />
                    </div>

                    {/* Description */}
                    <div>
                      <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="간단한 설명 (선택)"
                        rows={3}
                        className="w-full px-0 py-4 text-base
                          bg-transparent border-0 border-b border-neutral-200 dark:border-neutral-800
                          text-neutral-900 dark:text-white
                          placeholder-neutral-300 dark:placeholder-neutral-700
                          focus:outline-none focus:border-neutral-900 dark:focus:border-white
                          transition-colors resize-none tracking-wide"
                      />
                    </div>

                    {/* Error */}
                    {error && (
                      <p className="text-sm text-red-500 tracking-wide">{error}</p>
                    )}

                    {/* Submit */}
                    <button
                      onClick={handleCreate}
                      disabled={!title.trim() || isCreating}
                      className={`
                        inline-flex items-center gap-3 px-8 py-4 text-sm tracking-wide
                        transition-all duration-300
                        ${title.trim() && !isCreating
                          ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 hover:opacity-80'
                          : 'bg-neutral-100 dark:bg-neutral-900 text-neutral-300 dark:text-neutral-700 cursor-not-allowed'
                        }
                      `}
                    >
                      {isCreating ? (
                        <>
                          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                          <span>생성 중</span>
                        </>
                      ) : (
                        <span>시작하기</span>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
