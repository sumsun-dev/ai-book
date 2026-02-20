'use client'

import { useState } from 'react'
import type {
  SelfHelpBible,
  CoreMessage,
  Framework,
  FrameworkStep,
  CaseStudy,
  Evidence,
  ActionTool,
} from '@/types/book-bible'
import { generateBibleItemId } from '@/types/book-bible'

interface SelfHelpBibleEditorProps {
  bible: SelfHelpBible
  onChange: (bible: SelfHelpBible) => void
}

type TabType = 'messages' | 'frameworks' | 'cases' | 'evidence' | 'tools' | 'voice'

export default function SelfHelpBibleEditor({ bible, onChange }: SelfHelpBibleEditorProps) {
  const [activeTab, setActiveTab] = useState<TabType>('messages')

  const tabs: { id: TabType; label: string; count?: number }[] = [
    { id: 'messages', label: '핵심 메시지', count: bible.coreMessages.length },
    { id: 'frameworks', label: '프레임워크', count: bible.frameworks.length },
    { id: 'cases', label: '사례', count: bible.caseStudies.length },
    { id: 'evidence', label: '증거', count: bible.evidences.length },
    { id: 'tools', label: '실천 도구', count: bible.actionTools.length },
    { id: 'voice', label: '음성 가이드' },
  ]

  return (
    <div>
      {/* 탭 네비게이션 */}
      <div className="flex border-b border-neutral-200 dark:border-neutral-700 mb-6 overflow-x-auto">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-3 text-sm font-medium transition-colors relative whitespace-nowrap ${
              activeTab === tab.id
                ? 'text-neutral-900 dark:text-white'
                : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200'
            }`}
          >
            {tab.label}
            {tab.count !== undefined && tab.count > 0 && (
              <span className="ml-2 px-1.5 py-0.5 text-xs bg-neutral-200 dark:bg-neutral-700 rounded">
                {tab.count}
              </span>
            )}
            {activeTab === tab.id && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-neutral-900 dark:bg-white" />
            )}
          </button>
        ))}
      </div>

      {/* 탭 콘텐츠 */}
      {activeTab === 'messages' && (
        <CoreMessageEditor
          messages={bible.coreMessages}
          onChange={(coreMessages) => onChange({ ...bible, coreMessages })}
        />
      )}

      {activeTab === 'frameworks' && (
        <FrameworkEditor
          frameworks={bible.frameworks}
          onChange={(frameworks) => onChange({ ...bible, frameworks })}
        />
      )}

      {activeTab === 'cases' && (
        <CaseStudyEditor
          cases={bible.caseStudies}
          frameworks={bible.frameworks}
          onChange={(caseStudies) => onChange({ ...bible, caseStudies })}
        />
      )}

      {activeTab === 'evidence' && (
        <EvidenceEditor
          evidences={bible.evidences}
          onChange={(evidences) => onChange({ ...bible, evidences })}
        />
      )}

      {activeTab === 'tools' && (
        <ActionToolEditor
          tools={bible.actionTools}
          frameworks={bible.frameworks}
          onChange={(actionTools) => onChange({ ...bible, actionTools })}
        />
      )}

      {activeTab === 'voice' && (
        <VoiceGuideEditor
          voice={bible.voiceGuide}
          onChange={(voiceGuide) => onChange({ ...bible, voiceGuide })}
        />
      )}
    </div>
  )
}

// ===== Core Message Editor =====
function CoreMessageEditor({
  messages,
  onChange,
}: {
  messages: CoreMessage[]
  onChange: (messages: CoreMessage[]) => void
}) {
  const [editingId, setEditingId] = useState<string | null>(null)

  const addMessage = () => {
    const newMsg: CoreMessage = {
      id: generateBibleItemId(),
      title: '',
      statement: '',
      supporting: [],
      keyPhrases: [],
    }
    onChange([...messages, newMsg])
    setEditingId(newMsg.id)
  }

  const updateMessage = (id: string, updates: Partial<CoreMessage>) => {
    onChange(messages.map(m => m.id === id ? { ...m, ...updates } : m))
  }

  const deleteMessage = (id: string) => {
    if (confirm('이 메시지를 삭제하시겠습니까?')) {
      onChange(messages.filter(m => m.id !== id))
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          책 전체에서 일관되게 전달할 핵심 메시지를 정의합니다.
        </p>
        <button
          onClick={addMessage}
          className="px-3 py-1.5 text-sm bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-colors"
        >
          + 메시지 추가
        </button>
      </div>

      {messages.length === 0 ? (
        <div className="text-center py-12 text-neutral-400 dark:text-neutral-500 border border-dashed border-neutral-300 dark:border-neutral-700">
          등록된 핵심 메시지가 없습니다
        </div>
      ) : (
        <div className="space-y-3">
          {messages.map(msg => (
            <div key={msg.id} className="border border-neutral-200 dark:border-neutral-700 p-4">
              {editingId === msg.id ? (
                <CoreMessageForm
                  message={msg}
                  onChange={(updates) => updateMessage(msg.id, updates)}
                  onClose={() => setEditingId(null)}
                />
              ) : (
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h4 className="font-medium text-neutral-900 dark:text-white">
                      {msg.title || '(제목 없음)'}
                    </h4>
                    <p className="text-sm text-neutral-600 dark:text-neutral-300 mt-1">
                      {msg.statement || '(주장 없음)'}
                    </p>
                    {msg.keyPhrases && msg.keyPhrases.length > 0 && (
                      <div className="flex gap-1 mt-2 flex-wrap">
                        {msg.keyPhrases.map((phrase, i) => (
                          <span key={i} className="text-xs px-1.5 py-0.5 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-300">
                            &ldquo;{phrase}&rdquo;
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => setEditingId(msg.id)}
                      className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => deleteMessage(msg.id)}
                      className="text-neutral-400 hover:text-red-500"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function CoreMessageForm({
  message,
  onChange,
  onClose,
}: {
  message: CoreMessage
  onChange: (updates: Partial<CoreMessage>) => void
  onClose: () => void
}) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs text-neutral-500 dark:text-neutral-400 mb-1">제목</label>
        <input
          type="text"
          value={message.title}
          onChange={(e) => onChange({ title: e.target.value })}
          className="w-full px-3 py-2 text-sm border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"
          placeholder="핵심 메시지 제목"
        />
      </div>

      <div>
        <label className="block text-xs text-neutral-500 dark:text-neutral-400 mb-1">핵심 주장</label>
        <textarea
          value={message.statement}
          onChange={(e) => onChange({ statement: e.target.value })}
          rows={2}
          className="w-full px-3 py-2 text-sm border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"
          placeholder="독자에게 전달하고자 하는 핵심 주장"
        />
      </div>

      <div>
        <label className="block text-xs text-neutral-500 dark:text-neutral-400 mb-1">핵심 문구 (쉼표로 구분)</label>
        <input
          type="text"
          value={message.keyPhrases?.join(', ') || ''}
          onChange={(e) => onChange({ keyPhrases: e.target.value.split(',').map(p => p.trim()).filter(Boolean) })}
          className="w-full px-3 py-2 text-sm border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"
          placeholder="반복 강조할 문구들"
        />
      </div>

      <div>
        <label className="block text-xs text-neutral-500 dark:text-neutral-400 mb-1">뒷받침 논거 (한 줄에 하나씩)</label>
        <textarea
          value={message.supporting?.join('\n') || ''}
          onChange={(e) => onChange({ supporting: e.target.value.split('\n').filter(Boolean) })}
          rows={3}
          className="w-full px-3 py-2 text-sm border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"
          placeholder="이 주장을 뒷받침하는 논거들"
        />
      </div>

      <div>
        <label className="block text-xs text-neutral-500 dark:text-neutral-400 mb-1">관련 챕터 (쉼표로 구분)</label>
        <input
          type="text"
          value={message.chapters?.join(', ') || ''}
          onChange={(e) => {
            const chapters = e.target.value.split(',').map(c => parseInt(c.trim())).filter(n => !isNaN(n))
            onChange({ chapters: chapters.length > 0 ? chapters : undefined })
          }}
          className="w-full px-3 py-2 text-sm border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"
          placeholder="1, 3, 5 (비우면 전체 적용)"
        />
      </div>

      <div className="flex justify-end">
        <button
          onClick={onClose}
          className="px-3 py-1.5 text-sm border border-neutral-300 dark:border-neutral-600 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
        >
          완료
        </button>
      </div>
    </div>
  )
}

// ===== Framework Editor =====
function FrameworkEditor({
  frameworks,
  onChange,
}: {
  frameworks: Framework[]
  onChange: (frameworks: Framework[]) => void
}) {
  const [editingId, setEditingId] = useState<string | null>(null)

  const addFramework = () => {
    const newFw: Framework = {
      id: generateBibleItemId(),
      name: '',
      description: '',
      steps: [],
    }
    onChange([...frameworks, newFw])
    setEditingId(newFw.id)
  }

  const updateFramework = (id: string, updates: Partial<Framework>) => {
    onChange(frameworks.map(f => f.id === id ? { ...f, ...updates } : f))
  }

  const deleteFramework = (id: string) => {
    if (confirm('이 프레임워크를 삭제하시겠습니까?')) {
      onChange(frameworks.filter(f => f.id !== id))
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          책에서 소개할 프레임워크, 모델, 방법론을 정의합니다.
        </p>
        <button
          onClick={addFramework}
          className="px-3 py-1.5 text-sm bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-colors"
        >
          + 프레임워크 추가
        </button>
      </div>

      {frameworks.length === 0 ? (
        <div className="text-center py-12 text-neutral-400 dark:text-neutral-500 border border-dashed border-neutral-300 dark:border-neutral-700">
          등록된 프레임워크가 없습니다
        </div>
      ) : (
        <div className="space-y-3">
          {frameworks.map(fw => (
            <div key={fw.id} className="border border-neutral-200 dark:border-neutral-700 p-4">
              {editingId === fw.id ? (
                <FrameworkForm
                  framework={fw}
                  onChange={(updates) => updateFramework(fw.id, updates)}
                  onClose={() => setEditingId(null)}
                />
              ) : (
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-neutral-900 dark:text-white">
                        {fw.name || '(이름 없음)'}
                      </span>
                      {fw.acronym && (
                        <span className="text-xs px-1.5 py-0.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300">
                          {fw.acronym}
                        </span>
                      )}
                      {fw.introducedChapter && (
                        <span className="text-xs text-neutral-400">
                          {fw.introducedChapter}장에서 소개
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-neutral-600 dark:text-neutral-300 mt-1">
                      {fw.description || '(설명 없음)'}
                    </p>
                    {fw.steps && fw.steps.length > 0 && (
                      <div className="mt-2 text-xs text-neutral-500 dark:text-neutral-400">
                        단계: {fw.steps.map(s => s.name).join(' → ')}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => setEditingId(fw.id)}
                      className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => deleteFramework(fw.id)}
                      className="text-neutral-400 hover:text-red-500"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function FrameworkForm({
  framework,
  onChange,
  onClose,
}: {
  framework: Framework
  onChange: (updates: Partial<Framework>) => void
  onClose: () => void
}) {
  const addStep = () => {
    const steps = [...(framework.steps || [])]
    steps.push({
      order: steps.length + 1,
      name: '',
      description: '',
    })
    onChange({ steps })
  }

  const updateStep = (index: number, updates: Partial<FrameworkStep>) => {
    const steps = [...(framework.steps || [])]
    steps[index] = { ...steps[index], ...updates }
    onChange({ steps })
  }

  const deleteStep = (index: number) => {
    const steps = [...(framework.steps || [])]
    steps.splice(index, 1)
    // 순서 재정렬
    steps.forEach((s, i) => s.order = i + 1)
    onChange({ steps })
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2">
          <label className="block text-xs text-neutral-500 dark:text-neutral-400 mb-1">이름</label>
          <input
            type="text"
            value={framework.name}
            onChange={(e) => onChange({ name: e.target.value })}
            className="w-full px-3 py-2 text-sm border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"
            placeholder="프레임워크 이름"
          />
        </div>
        <div>
          <label className="block text-xs text-neutral-500 dark:text-neutral-400 mb-1">약어</label>
          <input
            type="text"
            value={framework.acronym || ''}
            onChange={(e) => onChange({ acronym: e.target.value || undefined })}
            className="w-full px-3 py-2 text-sm border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"
            placeholder="SMART"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs text-neutral-500 dark:text-neutral-400 mb-1">설명</label>
        <textarea
          value={framework.description}
          onChange={(e) => onChange({ description: e.target.value })}
          rows={2}
          className="w-full px-3 py-2 text-sm border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"
          placeholder="프레임워크 설명"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs text-neutral-500 dark:text-neutral-400 mb-1">소개 챕터</label>
          <input
            type="number"
            min={1}
            value={framework.introducedChapter || ''}
            onChange={(e) => onChange({ introducedChapter: e.target.value ? parseInt(e.target.value) : undefined })}
            className="w-full px-3 py-2 text-sm border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"
            placeholder="1"
          />
        </div>
        <div>
          <label className="block text-xs text-neutral-500 dark:text-neutral-400 mb-1">시각화 유형</label>
          <select
            value={framework.visualType || ''}
            onChange={(e) => onChange({ visualType: e.target.value as Framework['visualType'] || undefined })}
            className="w-full px-3 py-2 text-sm border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"
          >
            <option value="">선택 안함</option>
            <option value="pyramid">피라미드</option>
            <option value="cycle">사이클</option>
            <option value="matrix">매트릭스</option>
            <option value="list">리스트</option>
            <option value="flow">플로우</option>
          </select>
        </div>
      </div>

      <div>
        <div className="flex justify-between items-center mb-2">
          <label className="text-xs text-neutral-500 dark:text-neutral-400">단계</label>
          <button
            type="button"
            onClick={addStep}
            className="text-xs text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200"
          >
            + 단계 추가
          </button>
        </div>
        <div className="space-y-2">
          {(framework.steps || []).map((step, index) => (
            <div key={index} className="flex gap-2 items-start">
              <span className="w-6 h-6 flex items-center justify-center bg-neutral-100 dark:bg-neutral-800 text-xs text-neutral-500">
                {step.order}
              </span>
              <input
                type="text"
                value={step.name}
                onChange={(e) => updateStep(index, { name: e.target.value })}
                className="flex-1 px-2 py-1 text-sm border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"
                placeholder="단계명"
              />
              <input
                type="text"
                value={step.description}
                onChange={(e) => updateStep(index, { description: e.target.value })}
                className="flex-1 px-2 py-1 text-sm border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"
                placeholder="설명"
              />
              <button
                type="button"
                onClick={() => deleteStep(index)}
                className="text-neutral-400 hover:text-red-500"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={onClose}
          className="px-3 py-1.5 text-sm border border-neutral-300 dark:border-neutral-600 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
        >
          완료
        </button>
      </div>
    </div>
  )
}

// ===== Case Study Editor =====
function CaseStudyEditor({
  cases,
  frameworks: _frameworks,
  onChange,
}: {
  cases: CaseStudy[]
  frameworks: Framework[]
  onChange: (cases: CaseStudy[]) => void
}) {
  const addCase = () => {
    const newCase: CaseStudy = {
      id: generateBibleItemId(),
      title: '',
      type: 'success',
      subject: '',
      isAnonymous: true,
      situation: '',
      action: '',
      result: '',
      lesson: '',
    }
    onChange([...cases, newCase])
  }

  const updateCase = (id: string, updates: Partial<CaseStudy>) => {
    onChange(cases.map(c => c.id === id ? { ...c, ...updates } : c))
  }

  const deleteCase = (id: string) => {
    if (confirm('이 사례를 삭제하시겠습니까?')) {
      onChange(cases.filter(c => c.id !== id))
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          책에서 활용할 사례, 스토리를 관리합니다.
        </p>
        <button
          onClick={addCase}
          className="px-3 py-1.5 text-sm bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-colors"
        >
          + 사례 추가
        </button>
      </div>

      {cases.length === 0 ? (
        <div className="text-center py-12 text-neutral-400 dark:text-neutral-500 border border-dashed border-neutral-300 dark:border-neutral-700">
          등록된 사례가 없습니다
        </div>
      ) : (
        <div className="space-y-3">
          {cases.map(c => (
            <div key={c.id} className="border border-neutral-200 dark:border-neutral-700 p-4 space-y-3">
              <div className="grid grid-cols-12 gap-3">
                <div className="col-span-4">
                  <input
                    type="text"
                    value={c.title}
                    onChange={(e) => updateCase(c.id, { title: e.target.value })}
                    className="w-full px-2 py-1.5 text-sm border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"
                    placeholder="사례 제목"
                  />
                </div>
                <div className="col-span-2">
                  <select
                    value={c.type}
                    onChange={(e) => updateCase(c.id, { type: e.target.value as CaseStudy['type'] })}
                    className="w-full px-2 py-1.5 text-sm border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"
                  >
                    <option value="success">성공</option>
                    <option value="failure">실패</option>
                    <option value="transformation">변화</option>
                    <option value="comparison">비교</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <input
                    type="text"
                    value={c.subject}
                    onChange={(e) => updateCase(c.id, { subject: e.target.value })}
                    className="w-full px-2 py-1.5 text-sm border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"
                    placeholder="주인공"
                  />
                </div>
                <div className="col-span-2">
                  <input
                    type="number"
                    min={1}
                    value={c.chapter || ''}
                    onChange={(e) => updateCase(c.id, { chapter: e.target.value ? parseInt(e.target.value) : undefined })}
                    className="w-full px-2 py-1.5 text-sm border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"
                    placeholder="챕터"
                  />
                </div>
                <div className="col-span-1 flex items-center gap-2">
                  <label className="flex items-center gap-1 text-xs text-neutral-500 dark:text-neutral-400">
                    <input
                      type="checkbox"
                      checked={c.isAnonymous}
                      onChange={(e) => updateCase(c.id, { isAnonymous: e.target.checked })}
                      className="w-3 h-3"
                    />
                    익명
                  </label>
                </div>
                <div className="col-span-1 flex justify-end">
                  <button
                    onClick={() => deleteCase(c.id)}
                    className="text-neutral-400 hover:text-red-500"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <textarea
                  value={c.situation}
                  onChange={(e) => updateCase(c.id, { situation: e.target.value })}
                  rows={2}
                  className="px-2 py-1.5 text-sm border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"
                  placeholder="상황 (Situation)"
                />
                <textarea
                  value={c.action}
                  onChange={(e) => updateCase(c.id, { action: e.target.value })}
                  rows={2}
                  className="px-2 py-1.5 text-sm border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"
                  placeholder="행동 (Action)"
                />
                <textarea
                  value={c.result}
                  onChange={(e) => updateCase(c.id, { result: e.target.value })}
                  rows={2}
                  className="px-2 py-1.5 text-sm border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"
                  placeholder="결과 (Result)"
                />
                <textarea
                  value={c.lesson}
                  onChange={(e) => updateCase(c.id, { lesson: e.target.value })}
                  rows={2}
                  className="px-2 py-1.5 text-sm border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"
                  placeholder="교훈 (Lesson)"
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ===== Evidence Editor =====
function EvidenceEditor({
  evidences,
  onChange,
}: {
  evidences: Evidence[]
  onChange: (evidences: Evidence[]) => void
}) {
  const addEvidence = () => {
    const newEv: Evidence = {
      id: generateBibleItemId(),
      type: 'research',
      title: '',
      source: '',
      description: '',
    }
    onChange([...evidences, newEv])
  }

  const updateEvidence = (id: string, updates: Partial<Evidence>) => {
    onChange(evidences.map(e => e.id === id ? { ...e, ...updates } : e))
  }

  const deleteEvidence = (id: string) => {
    if (confirm('이 증거를 삭제하시겠습니까?')) {
      onChange(evidences.filter(e => e.id !== id))
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          연구, 통계, 전문가 의견 등 증거 자료를 관리합니다.
        </p>
        <button
          onClick={addEvidence}
          className="px-3 py-1.5 text-sm bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-colors"
        >
          + 증거 추가
        </button>
      </div>

      {evidences.length === 0 ? (
        <div className="text-center py-12 text-neutral-400 dark:text-neutral-500 border border-dashed border-neutral-300 dark:border-neutral-700">
          등록된 증거가 없습니다
        </div>
      ) : (
        <div className="space-y-3">
          {evidences.map(ev => (
            <div key={ev.id} className="border border-neutral-200 dark:border-neutral-700 p-4 space-y-3">
              <div className="grid grid-cols-12 gap-3">
                <div className="col-span-2">
                  <select
                    value={ev.type}
                    onChange={(e) => updateEvidence(ev.id, { type: e.target.value as Evidence['type'] })}
                    className="w-full px-2 py-1.5 text-sm border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"
                  >
                    <option value="research">연구</option>
                    <option value="statistics">통계</option>
                    <option value="quote">인용</option>
                    <option value="expert">전문가</option>
                    <option value="historical">역사</option>
                  </select>
                </div>
                <div className="col-span-4">
                  <input
                    type="text"
                    value={ev.title}
                    onChange={(e) => updateEvidence(ev.id, { title: e.target.value })}
                    className="w-full px-2 py-1.5 text-sm border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"
                    placeholder="제목"
                  />
                </div>
                <div className="col-span-3">
                  <input
                    type="text"
                    value={ev.source}
                    onChange={(e) => updateEvidence(ev.id, { source: e.target.value })}
                    className="w-full px-2 py-1.5 text-sm border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"
                    placeholder="출처"
                  />
                </div>
                <div className="col-span-2">
                  <input
                    type="text"
                    value={ev.usedInChapters?.join(', ') || ''}
                    onChange={(e) => {
                      const chapters = e.target.value.split(',').map(c => parseInt(c.trim())).filter(n => !isNaN(n))
                      updateEvidence(ev.id, { usedInChapters: chapters.length > 0 ? chapters : undefined })
                    }}
                    className="w-full px-2 py-1.5 text-sm border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"
                    placeholder="챕터"
                  />
                </div>
                <div className="col-span-1 flex justify-end">
                  <button
                    onClick={() => deleteEvidence(ev.id)}
                    className="text-neutral-400 hover:text-red-500"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
              <textarea
                value={ev.description}
                onChange={(e) => updateEvidence(ev.id, { description: e.target.value })}
                rows={2}
                className="w-full px-2 py-1.5 text-sm border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"
                placeholder="내용/설명"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ===== Action Tool Editor =====
function ActionToolEditor({
  tools,
  frameworks,
  onChange,
}: {
  tools: ActionTool[]
  frameworks: Framework[]
  onChange: (tools: ActionTool[]) => void
}) {
  const addTool = () => {
    const newTool: ActionTool = {
      id: generateBibleItemId(),
      name: '',
      type: 'exercise',
      description: '',
      instructions: [],
    }
    onChange([...tools, newTool])
  }

  const updateTool = (id: string, updates: Partial<ActionTool>) => {
    onChange(tools.map(t => t.id === id ? { ...t, ...updates } : t))
  }

  const deleteTool = (id: string) => {
    if (confirm('이 도구를 삭제하시겠습니까?')) {
      onChange(tools.filter(t => t.id !== id))
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          독자가 실천할 수 있는 운동, 체크리스트, 템플릿 등을 정의합니다.
        </p>
        <button
          onClick={addTool}
          className="px-3 py-1.5 text-sm bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-colors"
        >
          + 도구 추가
        </button>
      </div>

      {tools.length === 0 ? (
        <div className="text-center py-12 text-neutral-400 dark:text-neutral-500 border border-dashed border-neutral-300 dark:border-neutral-700">
          등록된 실천 도구가 없습니다
        </div>
      ) : (
        <div className="space-y-3">
          {tools.map(tool => (
            <div key={tool.id} className="border border-neutral-200 dark:border-neutral-700 p-4 space-y-3">
              <div className="grid grid-cols-12 gap-3">
                <div className="col-span-4">
                  <input
                    type="text"
                    value={tool.name}
                    onChange={(e) => updateTool(tool.id, { name: e.target.value })}
                    className="w-full px-2 py-1.5 text-sm border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"
                    placeholder="도구 이름"
                  />
                </div>
                <div className="col-span-2">
                  <select
                    value={tool.type}
                    onChange={(e) => updateTool(tool.id, { type: e.target.value as ActionTool['type'] })}
                    className="w-full px-2 py-1.5 text-sm border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"
                  >
                    <option value="exercise">운동</option>
                    <option value="checklist">체크리스트</option>
                    <option value="template">템플릿</option>
                    <option value="worksheet">워크시트</option>
                    <option value="habit">습관</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <input
                    type="number"
                    min={1}
                    value={tool.chapter || ''}
                    onChange={(e) => updateTool(tool.id, { chapter: e.target.value ? parseInt(e.target.value) : undefined })}
                    className="w-full px-2 py-1.5 text-sm border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"
                    placeholder="챕터"
                  />
                </div>
                <div className="col-span-3">
                  <select
                    value={tool.relatedFramework || ''}
                    onChange={(e) => updateTool(tool.id, { relatedFramework: e.target.value || undefined })}
                    className="w-full px-2 py-1.5 text-sm border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"
                  >
                    <option value="">연관 프레임워크</option>
                    {frameworks.map(fw => (
                      <option key={fw.id} value={fw.id}>{fw.name}</option>
                    ))}
                  </select>
                </div>
                <div className="col-span-1 flex justify-end">
                  <button
                    onClick={() => deleteTool(tool.id)}
                    className="text-neutral-400 hover:text-red-500"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
              <textarea
                value={tool.description}
                onChange={(e) => updateTool(tool.id, { description: e.target.value })}
                rows={2}
                className="w-full px-2 py-1.5 text-sm border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"
                placeholder="설명"
              />
              <div>
                <label className="block text-xs text-neutral-500 dark:text-neutral-400 mb-1">실행 지침 (한 줄에 하나씩)</label>
                <textarea
                  value={tool.instructions?.join('\n') || ''}
                  onChange={(e) => updateTool(tool.id, { instructions: e.target.value.split('\n').filter(Boolean) })}
                  rows={3}
                  className="w-full px-2 py-1.5 text-sm border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"
                  placeholder="1. 첫 번째 단계&#10;2. 두 번째 단계&#10;3. 세 번째 단계"
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ===== Voice Guide Editor =====
function VoiceGuideEditor({
  voice,
  onChange,
}: {
  voice: SelfHelpBible['voiceGuide']
  onChange: (voice: SelfHelpBible['voiceGuide']) => void
}) {
  return (
    <div className="space-y-6">
      <p className="text-sm text-neutral-500 dark:text-neutral-400">
        책 전체에서 유지할 어조와 스타일을 설정합니다.
      </p>

      <div className="grid grid-cols-2 gap-6">
        <div>
          <label className="block text-xs text-neutral-500 dark:text-neutral-400 mb-2">톤</label>
          <select
            value={voice.tone}
            onChange={(e) => onChange({ ...voice, tone: e.target.value as SelfHelpBible['voiceGuide']['tone'] })}
            className="w-full px-3 py-2 text-sm border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"
          >
            <option value="authoritative">권위 있는</option>
            <option value="friendly">친근한</option>
            <option value="inspirational">영감을 주는</option>
            <option value="conversational">대화체</option>
            <option value="academic">학술적</option>
          </select>
        </div>
        <div>
          <label className="block text-xs text-neutral-500 dark:text-neutral-400 mb-2">타겟 독자 페르소나</label>
          <input
            type="text"
            value={voice.targetReader || ''}
            onChange={(e) => onChange({ ...voice, targetReader: e.target.value || undefined })}
            className="w-full px-3 py-2 text-sm border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"
            placeholder="30대 직장인, 자기계발에 관심 있는"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs text-neutral-500 dark:text-neutral-400 mb-2">권장 스타일 (한 줄에 하나씩)</label>
        <textarea
          value={voice.doList?.join('\n') || ''}
          onChange={(e) => onChange({ ...voice, doList: e.target.value.split('\n').filter(Boolean) })}
          rows={4}
          className="w-full px-3 py-2 text-sm border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"
          placeholder="독자에게 직접 말하듯 '당신'을 사용&#10;구체적인 예시와 사례 활용&#10;짧고 명확한 문장 사용"
        />
      </div>

      <div>
        <label className="block text-xs text-neutral-500 dark:text-neutral-400 mb-2">금지 스타일 (한 줄에 하나씩)</label>
        <textarea
          value={voice.dontList?.join('\n') || ''}
          onChange={(e) => onChange({ ...voice, dontList: e.target.value.split('\n').filter(Boolean) })}
          rows={4}
          className="w-full px-3 py-2 text-sm border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"
          placeholder="추상적이고 모호한 표현&#10;권위적이고 설교하는 어투&#10;너무 학술적인 용어"
        />
      </div>

      <div>
        <label className="block text-xs text-neutral-500 dark:text-neutral-400 mb-2">예시 문구 (한 줄에 하나씩)</label>
        <textarea
          value={voice.examplePhrases?.join('\n') || ''}
          onChange={(e) => onChange({ ...voice, examplePhrases: e.target.value.split('\n').filter(Boolean) })}
          rows={3}
          className="w-full px-3 py-2 text-sm border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"
          placeholder="'당신도 할 수 있습니다'&#10;'함께 시작해볼까요?'&#10;'중요한 것은 시작하는 것입니다'"
        />
      </div>
    </div>
  )
}
