'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import StageHeader from '@/components/project/StageHeader'
import { AIQuestion, UserAnswer, BookType } from '@/types/book'
import {
  SparklesIcon,
  ChatBubbleLeftRightIcon,
  CheckIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline'

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

  // 프로젝트 정보 및 기존 리서치 데이터 로드
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
      // 초기 로드 실패는 무시 (새 프로젝트일 수 있음)
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
        setError('질문 생성에 실패했습니다. 다시 시도해주세요.')
      }
    } catch {
      setError('질문 생성에 실패했습니다. 다시 시도해주세요.')
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

    // 모든 질문에 답변 완료
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
        setError('계획 수립에 실패했습니다.')
        setState(prev => ({ ...prev, step: 'questions' }))
      }
    } catch {
      setError('계획 수립에 실패했습니다. 다시 시도해주세요.')
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
      setError('다음 단계로 이동하는데 실패했습니다.')
    }
  }

  const renderStepIndicator = () => {
    const steps = [
      { id: 'idea', label: '아이디어' },
      { id: 'questions', label: 'AI 질문' },
      { id: 'planning', label: '계획 수립' },
      { id: 'complete', label: '완료' }
    ]

    const currentStepIndex = steps.findIndex(s => s.id === state.step)

    return (
      <div className="flex items-center justify-center mb-8">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-center">
            <div className={`
              w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
              ${index <= currentStepIndex
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-500'
              }
            `}>
              {index < currentStepIndex ? (
                <CheckIcon className="w-5 h-5" />
              ) : (
                index + 1
              )}
            </div>
            {index < steps.length - 1 && (
              <div className={`
                w-12 h-0.5 mx-2
                ${index < currentStepIndex
                  ? 'bg-blue-600'
                  : 'bg-gray-200 dark:bg-gray-700'
                }
              `} />
            )}
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <StageHeader
        title="리서치"
        description="책의 아이디어를 구체화하고 방향을 설정합니다"
        stage="research"
        onNext={state.step === 'complete' ? handleNextStage : undefined}
        nextLabel="목차 설계로"
        nextDisabled={state.step !== 'complete'}
      />

      <div className="max-w-3xl mx-auto px-6 py-8">
        {renderStepIndicator()}

        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-600 dark:text-red-400">
            {error}
          </div>
        )}

        {/* Step 1: 아이디어 입력 */}
        {state.step === 'idea' && (
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
            <div className="flex items-center gap-3 mb-4">
              <SparklesIcon className="w-6 h-6 text-blue-600" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                어떤 책을 쓰고 싶으신가요?
              </h2>
            </div>

            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              간단한 아이디어나 주제부터 시작해보세요. AI가 더 구체적인 질문을 통해 아이디어를 발전시켜 드립니다.
            </p>

            <textarea
              value={state.initialIdea}
              onChange={(e) => setState(prev => ({ ...prev, initialIdea: e.target.value }))}
              placeholder="예: 30대 직장인을 위한 재테크 입문서를 쓰고 싶어요. 주식, 부동산, 가상화폐 등 다양한 투자 방법을 쉽게 설명하고 싶습니다."
              className="w-full h-40 p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />

            <button
              onClick={handleIdeaSubmit}
              disabled={!state.initialIdea.trim() || isLoading}
              className={`
                mt-4 w-full py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2
                ${state.initialIdea.trim() && !isLoading
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed'
                }
              `}
            >
              {isLoading ? (
                <>
                  <ArrowPathIcon className="w-5 h-5 animate-spin" />
                  AI가 질문을 준비하고 있어요...
                </>
              ) : (
                <>
                  <SparklesIcon className="w-5 h-5" />
                  아이디어 발전시키기
                </>
              )}
            </button>
          </div>
        )}

        {/* Step 2: AI 질문 답변 */}
        {state.step === 'questions' && state.aiQuestions.length > 0 && (
          <div className="space-y-6">
            {/* 이전 답변들 */}
            {state.userAnswers.map((answer, index) => (
              <div key={answer.questionId} className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4 border border-gray-200 dark:border-gray-800">
                <div className="flex items-start gap-3 mb-2">
                  <ChatBubbleLeftRightIcon className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {state.aiQuestions[index].question}
                    </p>
                    <p className="mt-2 text-gray-900 dark:text-white">
                      {answer.answer}
                    </p>
                  </div>
                </div>
              </div>
            ))}

            {/* 현재 질문 */}
            {currentQuestionIndex < state.aiQuestions.length && (
              <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm text-blue-600 dark:text-blue-400 font-medium">
                    질문 {currentQuestionIndex + 1} / {state.aiQuestions.length}
                  </span>
                  <span className="text-xs text-gray-400 px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded">
                    {state.aiQuestions[currentQuestionIndex].category}
                  </span>
                </div>

                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                  {state.aiQuestions[currentQuestionIndex].question}
                </h3>

                <textarea
                  value={currentAnswer}
                  onChange={(e) => setCurrentAnswer(e.target.value)}
                  placeholder="답변을 입력해주세요..."
                  className="w-full h-32 p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />

                <button
                  onClick={handleAnswerSubmit}
                  disabled={!currentAnswer.trim()}
                  className={`
                    mt-4 w-full py-3 rounded-lg font-medium transition-colors
                    ${currentAnswer.trim()
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed'
                    }
                  `}
                >
                  {currentQuestionIndex === state.aiQuestions.length - 1 ? '계획 수립하기' : '다음 질문'}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Step 3: 계획 수립 중 */}
        {state.step === 'planning' && (
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-8 text-center">
            <ArrowPathIcon className="w-12 h-12 text-blue-600 mx-auto mb-4 animate-spin" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              책 계획을 수립하고 있어요
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              답변을 분석하여 최적의 책 구조와 방향을 설계하고 있습니다...
            </p>
          </div>
        )}

        {/* Step 4: 완료 */}
        {state.step === 'complete' && state.researchSummary && (
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <CheckIcon className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  리서치 완료!
                </h2>
                <p className="text-sm text-gray-500">
                  아이디어가 구체화되었습니다
                </p>
              </div>
            </div>

            <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <h3 className="font-medium text-gray-900 dark:text-white mb-3">
                책 계획 요약
              </h3>
              <div className="prose prose-sm dark:prose-invert max-w-none">
                {state.researchSummary.split('\n').map((line, i) => (
                  <p key={i} className="text-gray-600 dark:text-gray-300">{line}</p>
                ))}
              </div>
            </div>

            <p className="mt-6 text-sm text-gray-500 dark:text-gray-400 text-center">
              이제 목차를 설계할 준비가 되었습니다. 다음 단계로 진행해주세요.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
