'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { BookType } from '@/types/book'

const bookTypes: { type: BookType; name: string; description: string; icon: string }[] = [
  { type: 'fiction', name: '소설', description: '장편/단편 소설, 로맨스, 판타지, SF 등', icon: '📖' },
  { type: 'nonfiction', name: '논픽션', description: '역사, 과학, 사회, 인문학 등', icon: '📚' },
  { type: 'selfhelp', name: '자기계발', description: '성공, 습관, 동기부여, 자기관리', icon: '🎯' },
  { type: 'technical', name: '기술서적', description: '프로그래밍, IT, 공학, 전문기술', icon: '💻' },
  { type: 'essay', name: '에세이', description: '개인 경험, 일상, 여행, 음식', icon: '✍️' },
  { type: 'children', name: '동화', description: '그림책, 아동문학, 교육동화', icon: '🧸' },
  { type: 'poetry', name: '시집', description: '현대시, 서정시, 시 모음집', icon: '🌸' },
]

export default function NewProjectPage() {
  const router = useRouter()
  const [step, setStep] = useState<'type' | 'details'>('type')
  const [selectedType, setSelectedType] = useState<BookType | null>(null)
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
    <div className="min-h-screen bg-gradient-to-b from-cream to-white dark:from-gray-950 dark:to-gray-900">
      {/* 헤더 */}
      <header className="border-b border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-950/80 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-gray-900 dark:text-white">
            AI Book
          </Link>
          <Link
            href="/projects"
            className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            내 프로젝트
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-12">
        {/* 단계 표시 */}
        <div className="flex items-center justify-center mb-12">
          <div className="flex items-center gap-4">
            <div className={`
              w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium
              ${step === 'type' ? 'bg-blue-600 text-white' : 'bg-green-500 text-white'}
            `}>
              {step === 'type' ? '1' : '✓'}
            </div>
            <div className={`w-24 h-1 ${step === 'details' ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'}`} />
            <div className={`
              w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium
              ${step === 'details' ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-500'}
            `}>
              2
            </div>
          </div>
        </div>

        {/* Step 1: 책 유형 선택 */}
        {step === 'type' && (
          <div>
            <div className="text-center mb-10">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
                어떤 책을 쓰고 싶으신가요?
              </h1>
              <p className="text-gray-500 dark:text-gray-400">
                책의 장르를 선택해주세요. AI가 장르에 맞는 최적의 도움을 드립니다.
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {bookTypes.map((book) => (
                <button
                  key={book.type}
                  onClick={() => handleTypeSelect(book.type)}
                  className="p-6 bg-white dark:bg-gray-900 rounded-xl border-2 border-gray-200 dark:border-gray-800 hover:border-blue-500 dark:hover:border-blue-500 transition-all text-left group"
                >
                  <div className="text-3xl mb-3">{book.icon}</div>
                  <div className="font-semibold text-gray-900 dark:text-white mb-1 group-hover:text-blue-600">
                    {book.name}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {book.description}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: 상세 정보 입력 */}
        {step === 'details' && selectedType && (
          <div>
            <button
              onClick={() => setStep('type')}
              className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 mb-8"
            >
              ← 장르 다시 선택
            </button>

            <div className="text-center mb-10">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-sm mb-4">
                {bookTypes.find(b => b.type === selectedType)?.icon}
                {bookTypes.find(b => b.type === selectedType)?.name}
              </div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
                책에 대해 알려주세요
              </h1>
              <p className="text-gray-500 dark:text-gray-400">
                제목과 간단한 설명을 입력해주세요. 나중에 수정할 수 있습니다.
              </p>
            </div>

            <div className="max-w-xl mx-auto space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  책 제목 *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="예: 성공하는 습관의 비밀"
                  className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  간단한 설명 (선택)
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="이 책에서 다루고 싶은 내용이나 주제를 간단히 설명해주세요..."
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>

              {error && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-600 dark:text-red-400">
                  {error}
                </div>
              )}

              <button
                onClick={handleCreate}
                disabled={!title.trim() || isCreating}
                className={`
                  w-full py-4 rounded-lg font-medium text-lg transition-all flex items-center justify-center gap-2
                  ${title.trim() && !isCreating
                    ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg hover:shadow-xl'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed'
                  }
                `}
              >
                {isCreating ? (
                  <>
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    프로젝트 생성 중...
                  </>
                ) : (
                  '프로젝트 시작하기'
                )}
              </button>

              <p className="text-center text-sm text-gray-500 dark:text-gray-400">
                다음 단계에서 AI와 함께 아이디어를 구체화합니다
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
