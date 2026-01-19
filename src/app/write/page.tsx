'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useBookStore } from '@/lib/store'
import { BookType, AgentType } from '@/types/book'
import { ProgressStepper, AgentActivityPanel, LoadingSpinner } from '@/components'

const bookTypeNames: Record<BookType, string> = {
  fiction: '소설',
  nonfiction: '논픽션',
  selfhelp: '자기계발',
  technical: '기술서적',
  essay: '에세이',
  children: '동화',
  poetry: '시집',
}

function WritePageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const bookType = (searchParams.get('type') || 'fiction') as BookType

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [started, setStarted] = useState(false)
  const [currentAgent, setCurrentAgent] = useState<AgentType | null>(null)
  const [completedAgents, setCompletedAgents] = useState<AgentType[]>([])
  const [output, setOutput] = useState('')

  const {
    currentProject,
    chapters,
    agentMessages,
    isProcessing,
    createProject,
    updateStatus,
    setOutline,
    setChapter,
    addAgentMessage,
    setProcessing,
  } = useBookStore()

  const outputRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight
    }
  }, [output, agentMessages])

  const markAgentCompleted = (agent: AgentType) => {
    setCompletedAgents((prev) => [...prev.filter((a) => a !== agent), agent])
  }

  const handleStart = async () => {
    if (!title || !description) return

    createProject(title, bookType, description)
    setStarted(true)
    setProcessing(true)
    setCompletedAgents([])

    try {
      // Research phase
      setCurrentAgent('research')
      addAgentMessage({
        agent: 'research',
        type: 'thinking',
        content: '주제에 대한 리서치를 시작합니다...',
        timestamp: new Date(),
      })

      const researchRes = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phase: 'research',
          bookType,
          title,
          description,
        }),
      })
      const researchData = await researchRes.json()

      addAgentMessage({
        agent: 'research',
        type: 'output',
        content: `리서치 완료: ${researchData.research.findings.length}개의 주요 발견`,
        timestamp: new Date(),
      })
      markAgentCompleted('research')

      // Outline phase
      setCurrentAgent('outliner')
      addAgentMessage({
        agent: 'outliner',
        type: 'thinking',
        content: '책의 구조를 설계합니다...',
        timestamp: new Date(),
      })

      const outlineRes = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phase: 'outline',
          bookType,
          title,
          description,
          research: researchData.research,
        }),
      })
      const outlineData = await outlineRes.json()
      setOutline(outlineData.outline)

      addAgentMessage({
        agent: 'outliner',
        type: 'output',
        content: `아웃라인 완료: ${outlineData.outline.chapters.length}개 챕터`,
        timestamp: new Date(),
      })
      markAgentCompleted('outliner')

      // Writing phase
      setCurrentAgent('writer')
      updateStatus('writing')

      for (const chapter of outlineData.outline.chapters) {
        addAgentMessage({
          agent: 'writer',
          type: 'thinking',
          content: `챕터 ${chapter.number}: ${chapter.title} 작성 중...`,
          timestamp: new Date(),
        })

        const writeRes = await fetch('/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            phase: 'write',
            bookType,
            outline: outlineData.outline,
            chapter,
          }),
        })
        const writeData = await writeRes.json()
        setChapter(chapter.number, writeData.content)
        setOutput((prev) => prev + `\n\n## 챕터 ${chapter.number}: ${chapter.title}\n\n${writeData.content}`)

        // Edit phase
        setCurrentAgent('editor')
        addAgentMessage({
          agent: 'editor',
          type: 'thinking',
          content: `챕터 ${chapter.number} 교정 중...`,
          timestamp: new Date(),
        })

        const editRes = await fetch('/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            phase: 'edit',
            content: writeData.content,
            chapterTitle: chapter.title,
            tone: outlineData.outline.tone,
          }),
        })
        const editData = await editRes.json()
        setChapter(chapter.number, editData.editedContent)

        addAgentMessage({
          agent: 'editor',
          type: 'output',
          content: `교정 완료: ${editData.changes.length}개 수정`,
          timestamp: new Date(),
        })

        // Critic phase
        setCurrentAgent('critic')
        const criticRes = await fetch('/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            phase: 'critic',
            content: editData.editedContent,
            chapterTitle: chapter.title,
            targetAudience: outlineData.outline.targetAudience,
            tone: outlineData.outline.tone,
          }),
        })
        const criticData = await criticRes.json()

        addAgentMessage({
          agent: 'critic',
          type: 'feedback',
          content: `평가: ${criticData.decision === 'pass' ? '✅ 통과' : '🔄 수정 필요'} (${criticData.overallScore}/10)`,
          timestamp: new Date(),
        })

        setCurrentAgent('writer')
      }

      markAgentCompleted('writer')
      markAgentCompleted('editor')
      markAgentCompleted('critic')

      updateStatus('completed')
      setCurrentAgent(null)
      addAgentMessage({
        agent: 'writer',
        type: 'output',
        content: '책 작성이 완료되었습니다!',
        timestamp: new Date(),
      })
    } catch (error) {
      console.error('Error:', error)
      addAgentMessage({
        agent: currentAgent || 'writer',
        type: 'output',
        content: `오류 발생: ${error instanceof Error ? error.message : '알 수 없는 오류'}`,
        timestamp: new Date(),
      })
    } finally {
      setProcessing(false)
    }
  }

  const handleDownloadPDF = async () => {
    if (!currentProject || chapters.size === 0) return

    const { downloadBookPDF } = await import('@/lib/pdf')
    await downloadBookPDF(currentProject, chapters)
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-100 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="flex items-center gap-2 text-gray-600 hover:text-indigo-600 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span>Back</span>
            </Link>
            <div className="h-6 w-px bg-gray-200" />
            <h1 className="text-xl font-bold text-gray-800">
              AI Book Writer
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm font-medium">
              {bookTypeNames[bookType]}
            </span>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {!started ? (
          /* Input Form */
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-800 mb-2">
                Create Your Book
              </h2>
              <p className="text-gray-600">
                Tell us about the book you want to create
              </p>
            </div>

            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Book Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-gray-800 placeholder-gray-400"
                  placeholder="Enter your book title"
                />
              </div>

              <div className="mb-8">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Book Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={5}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-gray-800 placeholder-gray-400 resize-none"
                  placeholder="Describe your book in detail - the topic, style, target audience, and any specific requirements..."
                />
                <p className="mt-2 text-sm text-gray-500">
                  The more details you provide, the better the AI can understand your vision.
                </p>
              </div>

              <button
                onClick={handleStart}
                disabled={!title || !description}
                className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold hover:from-indigo-700 hover:to-purple-700 disabled:from-gray-300 disabled:to-gray-300 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl disabled:shadow-none flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Start AI Writing
              </button>
            </div>

            {/* How it works */}
            <div className="mt-8 p-6 bg-white/50 rounded-xl border border-gray-100">
              <h3 className="text-sm font-semibold text-gray-700 mb-4">How it works</h3>
              <div className="grid grid-cols-5 gap-2 text-center text-xs">
                {['Research', 'Outline', 'Write', 'Edit', 'Review'].map((step, i) => (
                  <div key={step} className="flex flex-col items-center">
                    <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold mb-1">
                      {i + 1}
                    </div>
                    <span className="text-gray-600">{step}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* Writing Interface */
          <div>
            {/* Progress Stepper */}
            <div className="bg-white rounded-xl shadow-md border border-gray-100 p-4 mb-8">
              <ProgressStepper
                currentAgent={currentAgent}
                completedAgents={completedAgents}
                isCompleted={currentProject?.status === 'completed'}
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Agent Activity Panel */}
              <div className="lg:col-span-1 order-2 lg:order-1">
                <AgentActivityPanel
                  currentAgent={currentAgent}
                  messages={agentMessages}
                  isProcessing={isProcessing}
                />
              </div>

              {/* Output Panel */}
              <div className="lg:col-span-2 order-1 lg:order-2">
                <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <h2 className="text-xl font-bold text-gray-800">
                        {currentProject?.title || 'Book Content'}
                      </h2>
                      {currentProject?.status && (
                        <span className={`
                          inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-medium
                          ${currentProject.status === 'completed'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-indigo-100 text-indigo-700'
                          }
                        `}>
                          {currentProject.status === 'completed' ? 'Completed' : 'In Progress'}
                        </span>
                      )}
                    </div>
                    {currentProject?.status === 'completed' && (
                      <button
                        onClick={handleDownloadPDF}
                        className="px-5 py-2.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all shadow-md hover:shadow-lg flex items-center gap-2 font-medium"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Download PDF
                      </button>
                    )}
                  </div>

                  <div
                    ref={outputRef}
                    className="prose prose-indigo max-w-none h-[600px] overflow-y-auto p-6 bg-gradient-to-b from-slate-50 to-white rounded-xl border border-gray-100"
                  >
                    {output ? (
                      <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">{output}</div>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full text-gray-400">
                        {isProcessing ? (
                          <>
                            <LoadingSpinner size="lg" />
                            <p className="mt-4 text-lg">AI is writing your book...</p>
                            <p className="text-sm mt-1">This may take a few moments</p>
                          </>
                        ) : (
                          <>
                            <svg className="w-16 h-16 mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                            </svg>
                            <p>Your book content will appear here</p>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}

export default function WritePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 flex items-center justify-center">
          <LoadingSpinner size="lg" text="Loading..." />
        </div>
      }
    >
      <WritePageContent />
    </Suspense>
  )
}
