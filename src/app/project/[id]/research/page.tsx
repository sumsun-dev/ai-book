'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import StageHeader from '@/components/project/StageHeader'
import { AIQuestion, UserAnswer } from '@/types/book'

interface ResearchState {
  step: 'idea' | 'questions' | 'planning' | 'complete'
  initialIdea: string
  aiQuestions: AIQuestion[]
  userAnswers: UserAnswer[]
  researchSummary: string | null
}

export default function ResearchPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.id as string

  const [state, setState] = useState<ResearchState>({
    step: 'idea',
    initialIdea: '',
    aiQuestions: [],
    userAnswers: [],
    researchSummary: null
  })
  const [isLoading, setIsLoading] = useState(false)
  const [currentAnswer, setCurrentAnswer] = useState('')
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadExistingData()
  }, [projectId])

  const loadExistingData = async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}/research`)
      if (res.ok) {
        const data = await res.json()
        if (data.researchData) {
          setState({
            step: data.researchData.findings ? 'complete' : 'questions',
            initialIdea: data.researchData.initialIdea || '',
            aiQuestions: data.researchData.aiQuestions || [],
            userAnswers: data.researchData.userAnswers || [],
            researchSummary: data.researchData.findings || null
          })
          setCurrentQuestionIndex(data.researchData.userAnswers?.length || 0)
        }
      }
    } catch {
      // Initial load failure ignored
    }
  }

  const handleIdeaSubmit = async () => {
    if (!state.initialIdea.trim()) return

    setIsLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/projects/${projectId}/research/questions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ initialIdea: state.initialIdea })
      })

      const data = await res.json()
      if (data.questions) {
        setState(prev => ({
          ...prev,
          step: 'questions',
          aiQuestions: data.questions
        }))
      } else {
        setError('Failed to generate questions. Please try again.')
      }
    } catch {
      setError('Failed to generate questions. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleAnswerSubmit = async () => {
    if (!currentAnswer.trim()) return

    const answer: UserAnswer = {
      questionId: state.aiQuestions[currentQuestionIndex].id,
      answer: currentAnswer,
      timestamp: new Date()
    }

    const newAnswers = [...state.userAnswers, answer]
    setState(prev => ({ ...prev, userAnswers: newAnswers }))
    setCurrentAnswer('')

    if (currentQuestionIndex === state.aiQuestions.length - 1) {
      await generatePlan(newAnswers)
    } else {
      setCurrentQuestionIndex(prev => prev + 1)
    }
  }

  const generatePlan = async (answers: UserAnswer[]) => {
    setIsLoading(true)
    setError(null)
    setState(prev => ({ ...prev, step: 'planning' }))

    try {
      const res = await fetch(`/api/projects/${projectId}/research/plan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          initialIdea: state.initialIdea,
          questions: state.aiQuestions,
          answers
        })
      })

      const data = await res.json()
      if (data.summary) {
        setState(prev => ({
          ...prev,
          step: 'complete',
          researchSummary: data.summary
        }))
      } else {
        setError('Failed to create plan.')
        setState(prev => ({ ...prev, step: 'questions' }))
      }
    } catch {
      setError('Failed to create plan. Please try again.')
      setState(prev => ({ ...prev, step: 'questions' }))
    } finally {
      setIsLoading(false)
    }
  }

  const handleNextStage = async () => {
    try {
      await fetch(`/api/projects/${projectId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stage: 'outline' })
      })
      router.push(`/project/${projectId}/outline`)
    } catch {
      setError('Failed to proceed to next stage.')
    }
  }

  const steps = [
    { id: 'idea', label: '아이디어', num: 1 },
    { id: 'questions', label: '탐색', num: 2 },
    { id: 'planning', label: '기획', num: 3 },
    { id: 'complete', label: '완료', num: 4 }
  ]
  const currentStepIndex = steps.findIndex(s => s.id === state.step)

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 transition-colors duration-700">
      <StageHeader
        title="리서치"
        description="책의 컨셉과 방향을 정의하세요"
        stage="research"
        onNext={state.step === 'complete' ? handleNextStage : undefined}
        nextLabel="목차로 이동"
        nextDisabled={state.step !== 'complete'}
      />

      <main className="max-w-3xl mx-auto px-8 py-12">
        {/* Progress Steps */}
        <div className="mb-16">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center flex-1">
                <div className="flex flex-col items-center">
                  <div
                    className={`
                      w-10 h-10 flex items-center justify-center text-sm font-medium transition-all duration-500
                      ${index <= currentStepIndex
                        ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900'
                        : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-400 dark:text-neutral-600'
                      }
                    `}
                  >
                    {index < currentStepIndex ? (
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      step.num
                    )}
                  </div>
                  <span className={`mt-2 text-xs tracking-wider transition-colors duration-500 ${
                    index <= currentStepIndex
                      ? 'text-neutral-900 dark:text-white'
                      : 'text-neutral-400 dark:text-neutral-600'
                  }`}>
                    {step.label}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div className="flex-1 mx-4">
                    <div
                      className={`h-px transition-colors duration-500 ${
                        index < currentStepIndex
                          ? 'bg-neutral-900 dark:bg-white'
                          : 'bg-neutral-200 dark:bg-neutral-800'
                      }`}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {error && (
          <div className="mb-8 p-5 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Step 1: Idea Input */}
        {state.step === 'idea' && (
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-light text-neutral-900 dark:text-white mb-2 tracking-tight">
                어떤 이야기를 전하고 싶으신가요?
              </h2>
              <p className="text-neutral-500 dark:text-neutral-400 text-sm">
                초기 아이디어를 공유해주세요. AI가 질문을 통해 아이디어를 다듬어 드립니다.
              </p>
            </div>

            <div>
              <textarea
                value={state.initialIdea}
                onChange={(e) => setState(prev => ({ ...prev, initialIdea: e.target.value }))}
                placeholder="책 아이디어, 주제 또는 컨셉을 설명해주세요..."
                className="w-full h-48 p-6 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-600 focus:outline-none focus:border-neutral-900 dark:focus:border-white transition-colors duration-300 resize-none text-lg font-light"
              />
            </div>

            <button
              onClick={handleIdeaSubmit}
              disabled={!state.initialIdea.trim() || isLoading}
              className={`
                w-full py-5 text-sm font-medium tracking-widest uppercase transition-all duration-500 flex items-center justify-center gap-3
                ${state.initialIdea.trim() && !isLoading
                  ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 hover:bg-neutral-700 dark:hover:bg-neutral-200'
                  : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-400 dark:text-neutral-600 cursor-not-allowed'
                }
              `}
            >
              {isLoading ? (
                <>
                  <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  질문 준비 중...
                </>
              ) : (
                '아이디어 발전시키기'
              )}
            </button>
          </div>
        )}

        {/* Step 2: AI Questions */}
        {state.step === 'questions' && state.aiQuestions.length > 0 && (
          <div className="space-y-8">
            {/* Previous Answers */}
            {state.userAnswers.length > 0 && (
              <div className="space-y-4 mb-12">
                {state.userAnswers.map((answer, index) => (
                  <div key={answer.questionId} className="p-6 bg-neutral-100 dark:bg-neutral-900 border-l-2 border-neutral-300 dark:border-neutral-700">
                    <p className="text-xs tracking-wider uppercase text-neutral-400 dark:text-neutral-500 mb-2">
                      질문 {index + 1}
                    </p>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-3">
                      {state.aiQuestions[index].question}
                    </p>
                    <p className="text-neutral-900 dark:text-white">
                      {answer.answer}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {/* Current Question */}
            {currentQuestionIndex < state.aiQuestions.length && (
              <div className="space-y-8">
                <div className="flex items-center justify-between">
                  <span className="text-xs tracking-widest uppercase text-neutral-500 dark:text-neutral-400">
                    질문 {currentQuestionIndex + 1} / {state.aiQuestions.length}
                  </span>
                  <span className="px-3 py-1 bg-neutral-100 dark:bg-neutral-800 text-xs text-neutral-500 dark:text-neutral-400">
                    {state.aiQuestions[currentQuestionIndex].category}
                  </span>
                </div>

                <h3 className="text-2xl font-light text-neutral-900 dark:text-white leading-relaxed">
                  {state.aiQuestions[currentQuestionIndex].question}
                </h3>

                <textarea
                  value={currentAnswer}
                  onChange={(e) => setCurrentAnswer(e.target.value)}
                  placeholder="답변을 입력하세요..."
                  className="w-full h-36 p-6 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-600 focus:outline-none focus:border-neutral-900 dark:focus:border-white transition-colors duration-300 resize-none"
                />

                <button
                  onClick={handleAnswerSubmit}
                  disabled={!currentAnswer.trim()}
                  className={`
                    w-full py-5 text-sm font-medium tracking-widest uppercase transition-all duration-500
                    ${currentAnswer.trim()
                      ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 hover:bg-neutral-700 dark:hover:bg-neutral-200'
                      : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-400 dark:text-neutral-600 cursor-not-allowed'
                    }
                  `}
                >
                  {currentQuestionIndex === state.aiQuestions.length - 1 ? '완료 및 계획 생성' : '다음 질문'}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Step 3: Planning */}
        {state.step === 'planning' && (
          <div className="py-24 text-center">
            <div className="w-16 h-16 mx-auto mb-8 relative">
              <div className="absolute inset-0 border-2 border-neutral-200 dark:border-neutral-800 animate-ping" />
              <div className="absolute inset-0 border-2 border-neutral-900 dark:border-white" />
            </div>
            <h3 className="text-2xl font-light text-neutral-900 dark:text-white mb-3">
              책 계획을 작성 중입니다
            </h3>
            <p className="text-neutral-500 dark:text-neutral-400">
              최적의 구조를 위해 응답을 분석 중입니다...
            </p>
          </div>
        )}

        {/* Step 4: Complete */}
        {state.step === 'complete' && state.researchSummary && (
          <div className="space-y-8">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 bg-neutral-900 dark:bg-white flex items-center justify-center">
                <svg className="w-6 h-6 text-white dark:text-neutral-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h2 className="text-2xl font-light text-neutral-900 dark:text-white">
                  리서치 완료
                </h2>
                <p className="text-neutral-500 dark:text-neutral-400 text-sm">
                  책 컨셉이 개발되었습니다
                </p>
              </div>
            </div>

            <div className="p-8 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
              <h3 className="text-xs tracking-widest uppercase text-neutral-500 dark:text-neutral-400 mb-6">
                책 계획 요약
              </h3>
              <div className="prose prose-neutral dark:prose-invert max-w-none">
                {state.researchSummary.split('\n').map((line, i) => (
                  <p key={i} className="text-neutral-700 dark:text-neutral-300 leading-relaxed mb-4 last:mb-0">
                    {line}
                  </p>
                ))}
              </div>
            </div>

            <p className="text-center text-neutral-500 dark:text-neutral-400 text-sm pt-8">
              목차를 디자인할 준비가 되었습니다. 다음 단계로 진행하세요.
            </p>
          </div>
        )}
      </main>
    </div>
  )
}
