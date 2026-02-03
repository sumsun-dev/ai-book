'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import StageHeader from '@/components/project/StageHeader'
import RichTextEditor from '@/components/RichTextEditor'
import { AIQuestion, UserAnswer } from '@/types/book'

interface ResearchState {
  step: 'idea' | 'questions' | 'planning' | 'complete'
  initialIdea: string
  aiQuestions: AIQuestion[]
  userAnswers: UserAnswer[]
  researchSummary: string | null
}

// 기존 텍스트 데이터를 HTML로 변환 (호환성)
const textToHtml = (text: string): string => {
  if (!text) return ''
  // 이미 HTML 태그가 있으면 그대로 반환
  if (/<[^>]+>/.test(text)) return text
  // 줄바꿈을 <p> 태그로 변환
  return text
    .split('\n\n')
    .filter(p => p.trim())
    .map(p => `<p>${p.replace(/\n/g, '<br />')}</p>`)
    .join('')
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
  const [isEditing, setIsEditing] = useState(false)
  const [editedSummary, setEditedSummary] = useState('')
  const [editedAnswers, setEditedAnswers] = useState<UserAnswer[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const [viewingStep, setViewingStep] = useState<string | null>(null) // 미리보기 중인 단계

  useEffect(() => {
    loadExistingData()
  }, [projectId])

  const loadExistingData = async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}/research`)
      if (res.ok) {
        const data = await res.json()
        if (data.researchData) {
          const findings = data.researchData.findings
          setState({
            step: findings ? 'complete' : 'questions',
            initialIdea: data.researchData.initialIdea || '',
            aiQuestions: data.researchData.aiQuestions || [],
            userAnswers: data.researchData.userAnswers || [],
            researchSummary: findings ? textToHtml(findings) : null
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
          researchSummary: textToHtml(data.summary)
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

  const handleStartEditing = () => {
    setEditedSummary(state.researchSummary || '')
    setEditedAnswers([...state.userAnswers])
    setIsEditing(true)
  }

  const handleCancelEditing = () => {
    setIsEditing(false)
    setEditedSummary('')
    setEditedAnswers([])
  }

  const handleSaveEditing = async () => {
    setIsSaving(true)
    setError(null)
    try {
      const res = await fetch(`/api/projects/${projectId}/research`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userAnswers: editedAnswers,
          findings: editedSummary
        })
      })

      if (res.ok) {
        setState(prev => ({
          ...prev,
          userAnswers: editedAnswers,
          researchSummary: editedSummary
        }))
        setIsEditing(false)
      } else {
        setError('저장에 실패했습니다.')
      }
    } catch {
      setError('저장에 실패했습니다.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleAnswerEdit = (index: number, newAnswer: string) => {
    const updated = [...editedAnswers]
    updated[index] = { ...updated[index], answer: newAnswer }
    setEditedAnswers(updated)
  }

  const handleStepClick = (stepId: string, stepIndex: number) => {
    // planning 단계는 로딩 중이므로 클릭 불가
    if (stepId === 'planning') return
    // 현재 단계는 미리보기 종료
    if (stepIndex === currentStepIndex) {
      setViewingStep(null)
      return
    }
    // 이후 단계는 클릭 불가
    if (stepIndex > currentStepIndex) return
    // 로딩 중에는 단계 변경 불가
    if (isLoading) return

    // 이전 단계 미리보기 모드로 전환
    setViewingStep(stepId)
  }

  const handleClosePreview = () => {
    setViewingStep(null)
  }

  const handleRestartFromStep = (stepId: string) => {
    setViewingStep(null)
    if (stepId === 'idea') {
      setState(prev => ({ ...prev, step: 'idea' }))
    } else if (stepId === 'questions') {
      setState(prev => ({ ...prev, step: 'questions' }))
      setCurrentQuestionIndex(0)
      setCurrentAnswer('')
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
            {steps.map((step, index) => {
              const isClickable = index < currentStepIndex && step.id !== 'planning' && !isLoading
              return (
                <div key={step.id} className="flex items-center flex-1">
                  <button
                    onClick={() => handleStepClick(step.id, index)}
                    disabled={!isClickable}
                    className={`flex flex-col items-center ${isClickable ? 'cursor-pointer group' : 'cursor-default'}`}
                  >
                    <div
                      className={`
                        w-10 h-10 flex items-center justify-center text-sm font-medium transition-all duration-500
                        ${index <= currentStepIndex
                          ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900'
                          : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-400 dark:text-neutral-600'
                        }
                        ${isClickable ? 'group-hover:scale-110 group-hover:shadow-lg' : ''}
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
                    } ${isClickable ? 'group-hover:underline' : ''}`}>
                      {step.label}
                    </span>
                  </button>
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
              )
            })}
          </div>
        </div>

        {error && (
          <div className="mb-8 p-5 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* 미리보기 모드 */}
        {viewingStep && (
          <div className="mb-8">
            <div className="p-6 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  <span className="text-sm font-medium text-amber-800 dark:text-amber-200">
                    {viewingStep === 'idea' ? '아이디어' : '탐색'} 단계 미리보기
                  </span>
                </div>
                <button
                  onClick={handleClosePreview}
                  className="text-amber-600 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-200"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* 아이디어 미리보기 */}
              {viewingStep === 'idea' && (
                <div className="p-4 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700">
                  <p className="text-xs tracking-widest uppercase text-neutral-500 dark:text-neutral-400 mb-2">
                    초기 아이디어
                  </p>
                  <p className="text-neutral-900 dark:text-white whitespace-pre-wrap">
                    {state.initialIdea}
                  </p>
                </div>
              )}

              {/* 탐색(질문/답변) 미리보기 */}
              {viewingStep === 'questions' && state.userAnswers.length > 0 && (
                <div className="space-y-3">
                  {state.userAnswers.map((answer, index) => (
                    <div key={answer.questionId} className="p-4 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700">
                      <p className="text-xs tracking-wider uppercase text-neutral-400 dark:text-neutral-500 mb-1">
                        질문 {index + 1}
                      </p>
                      <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-2">
                        {state.aiQuestions[index]?.question}
                      </p>
                      <p className="text-neutral-900 dark:text-white">
                        {answer.answer}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-3 mt-4">
                <button
                  onClick={handleClosePreview}
                  className="flex-1 py-3 text-sm font-medium border border-neutral-300 dark:border-neutral-600 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                >
                  현재 단계로 돌아가기
                </button>
                <button
                  onClick={() => handleRestartFromStep(viewingStep)}
                  className="flex-1 py-3 text-sm font-medium bg-amber-600 text-white hover:bg-amber-700 transition-colors"
                >
                  이 단계부터 다시 시작
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 1: Idea Input */}
        {state.step === 'idea' && !viewingStep && (
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
        {state.step === 'questions' && state.aiQuestions.length > 0 && !viewingStep && (
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
        {state.step === 'planning' && !viewingStep && (
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
        {state.step === 'complete' && state.researchSummary && !viewingStep && (
          <div className="space-y-8">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
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
              {!isEditing && (
                <button
                  onClick={handleStartEditing}
                  className="px-4 py-2 text-sm border border-neutral-300 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                >
                  수정하기
                </button>
              )}
            </div>

            {isEditing ? (
              <>
                {/* 편집 모드: 답변 수정 */}
                {editedAnswers.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="text-xs tracking-widest uppercase text-neutral-500 dark:text-neutral-400">
                      질문 & 답변 수정
                    </h3>
                    {editedAnswers.map((answer, index) => (
                      <div key={answer.questionId} className="p-6 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
                        <p className="text-xs tracking-wider uppercase text-neutral-400 dark:text-neutral-500 mb-2">
                          질문 {index + 1}
                        </p>
                        <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-3">
                          {state.aiQuestions[index]?.question}
                        </p>
                        <textarea
                          value={answer.answer}
                          onChange={(e) => handleAnswerEdit(index, e.target.value)}
                          className="w-full h-24 p-4 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-white focus:outline-none focus:border-neutral-400 dark:focus:border-neutral-500 transition-colors resize-none"
                        />
                      </div>
                    ))}
                  </div>
                )}

                {/* 편집 모드: 요약 수정 */}
                <div className="p-8 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
                  <h3 className="text-xs tracking-widest uppercase text-neutral-500 dark:text-neutral-400 mb-6">
                    책 계획 요약 수정
                  </h3>
                  <RichTextEditor
                    value={editedSummary}
                    onChange={setEditedSummary}
                    placeholder="책 계획 요약을 입력하세요..."
                  />
                </div>

                {/* 편집 모드 버튼 */}
                <div className="flex gap-4">
                  <button
                    onClick={handleCancelEditing}
                    disabled={isSaving}
                    className="flex-1 py-4 text-sm font-medium tracking-widest uppercase border border-neutral-300 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                  >
                    취소
                  </button>
                  <button
                    onClick={handleSaveEditing}
                    disabled={isSaving}
                    className="flex-1 py-4 text-sm font-medium tracking-widest uppercase bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 hover:bg-neutral-700 dark:hover:bg-neutral-200 transition-colors flex items-center justify-center gap-2"
                  >
                    {isSaving ? (
                      <>
                        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        저장 중...
                      </>
                    ) : (
                      '저장하기'
                    )}
                  </button>
                </div>
              </>
            ) : (
              <>
                {/* 읽기 모드: 이전 답변 표시 */}
                {state.userAnswers.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="text-xs tracking-widest uppercase text-neutral-500 dark:text-neutral-400">
                      질문 & 답변
                    </h3>
                    {state.userAnswers.map((answer, index) => (
                      <div key={answer.questionId} className="p-6 bg-neutral-50 dark:bg-neutral-900 border-l-2 border-neutral-300 dark:border-neutral-700">
                        <p className="text-xs tracking-wider uppercase text-neutral-400 dark:text-neutral-500 mb-2">
                          질문 {index + 1}
                        </p>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-3">
                          {state.aiQuestions[index]?.question}
                        </p>
                        <p className="text-neutral-900 dark:text-white">
                          {answer.answer}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                {/* 읽기 모드: 요약 표시 */}
                <div className="p-8 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
                  <h3 className="text-xs tracking-widest uppercase text-neutral-500 dark:text-neutral-400 mb-6">
                    책 계획 요약
                  </h3>
                  <div
                    className="prose prose-neutral dark:prose-invert max-w-none text-neutral-900 dark:text-neutral-100 prose-headings:text-neutral-900 dark:prose-headings:text-white prose-p:text-neutral-700 dark:prose-p:text-neutral-300 prose-p:leading-relaxed prose-strong:text-neutral-900 dark:prose-strong:text-white prose-li:text-neutral-700 dark:prose-li:text-neutral-300"
                    dangerouslySetInnerHTML={{ __html: state.researchSummary }}
                  />
                </div>

                <p className="text-center text-neutral-500 dark:text-neutral-400 text-sm pt-8">
                  목차를 디자인할 준비가 되었습니다. 다음 단계로 진행하세요.
                </p>
              </>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
