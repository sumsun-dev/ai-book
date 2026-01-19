'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { useBookStore } from '@/lib/store'
import { BookType, AgentType } from '@/types/book'

const agentInfo: Record<AgentType, { name: string; emoji: string; color: string }> = {
  research: { name: 'Research Agent', emoji: '🔍', color: 'bg-blue-100 text-blue-800' },
  outliner: { name: 'Outliner Agent', emoji: '📋', color: 'bg-purple-100 text-purple-800' },
  writer: { name: 'Writer Agent', emoji: '✍️', color: 'bg-green-100 text-green-800' },
  editor: { name: 'Editor Agent', emoji: '📝', color: 'bg-yellow-100 text-yellow-800' },
  critic: { name: 'Critic Agent', emoji: '⭐', color: 'bg-red-100 text-red-800' },
  'editor-critic': { name: 'Editor-Critic Agent', emoji: '🔄', color: 'bg-orange-100 text-orange-800' },
}

function WritePageContent() {
  const searchParams = useSearchParams()
  const bookType = (searchParams.get('type') || 'fiction') as BookType

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [started, setStarted] = useState(false)
  const [currentAgent, setCurrentAgent] = useState<AgentType | null>(null)
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

  const handleStart = async () => {
    if (!title || !description) return

    createProject(title, bookType, description)
    setStarted(true)
    setProcessing(true)

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

      updateStatus('completed')
      addAgentMessage({
        agent: 'writer',
        type: 'output',
        content: '🎉 책 작성이 완료되었습니다!',
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
      setCurrentAgent(null)
    }
  }

  const handleDownloadPDF = async () => {
    if (!currentProject || chapters.size === 0) return

    const { downloadBookPDF } = await import('@/lib/pdf')
    await downloadBookPDF(currentProject, chapters)
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">책 쓰기</h1>

        {!started ? (
          <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-md p-8">
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                책 제목
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="책 제목을 입력하세요"
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                책 설명
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="어떤 책을 쓰고 싶은지 자세히 설명해주세요..."
              />
            </div>

            <button
              onClick={handleStart}
              disabled={!title || !description}
              className="w-full py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              AI 작가 시작하기
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Agent Activity Panel */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl shadow-md p-6 sticky top-8">
                <h2 className="text-lg font-semibold mb-4">AI 에이전트 활동</h2>

                {/* Current Agent */}
                {currentAgent && (
                  <div className={`p-4 rounded-lg mb-4 ${agentInfo[currentAgent].color}`}>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{agentInfo[currentAgent].emoji}</span>
                      <span className="font-medium">{agentInfo[currentAgent].name}</span>
                    </div>
                    <div className="text-sm mt-2">작업 중...</div>
                  </div>
                )}

                {/* Message History */}
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {agentMessages.map((msg, index) => (
                    <div
                      key={index}
                      className={`p-3 rounded-lg text-sm ${agentInfo[msg.agent].color}`}
                    >
                      <div className="flex items-center gap-1 font-medium">
                        <span>{agentInfo[msg.agent].emoji}</span>
                        <span>{agentInfo[msg.agent].name}</span>
                      </div>
                      <div className="mt-1">{msg.content}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Output Panel */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-xl shadow-md p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold">
                    {currentProject?.title || '책 내용'}
                  </h2>
                  {currentProject?.status === 'completed' && (
                    <button
                      onClick={handleDownloadPDF}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      PDF 다운로드
                    </button>
                  )}
                </div>

                <div
                  ref={outputRef}
                  className="prose max-w-none h-[600px] overflow-y-auto p-4 bg-gray-50 rounded-lg"
                >
                  {output ? (
                    <div className="whitespace-pre-wrap">{output}</div>
                  ) : (
                    <div className="text-gray-400 text-center py-20">
                      {isProcessing
                        ? 'AI가 책을 작성하고 있습니다...'
                        : '여기에 책 내용이 표시됩니다'}
                    </div>
                  )}
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
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center">Loading...</div>}>
      <WritePageContent />
    </Suspense>
  )
}
