'use client'

import { useState } from 'react'
import Link from 'next/link'

const bookTypes = [
  { id: 'fiction', name: '소설', description: '창작 이야기, 단편/장편 소설' },
  { id: 'nonfiction', name: '논픽션', description: '사실 기반 서적, 전기, 역사' },
  { id: 'selfhelp', name: '자기계발', description: '동기부여, 성장, 습관 형성' },
  { id: 'technical', name: '기술서적', description: '프로그래밍, 기술 가이드' },
  { id: 'essay', name: '에세이', description: '개인적 경험과 생각' },
  { id: 'children', name: '동화', description: '어린이를 위한 이야기' },
  { id: 'poetry', name: '시집', description: '시와 운문' },
]

export default function Home() {
  const [selectedType, setSelectedType] = useState<string | null>(null)

  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            AI Book
          </h1>
          <p className="text-xl text-gray-600">
            AI 에이전트들이 협업하여 당신만의 책을 완성해드립니다
          </p>
        </div>

        {/* Agent Pipeline Visualization */}
        <div className="mb-16">
          <h2 className="text-2xl font-semibold text-center mb-8 text-gray-800">
            AI 협업 파이프라인
          </h2>
          <div className="flex justify-center items-center gap-4 flex-wrap">
            {['Research', 'Outliner', 'Writer', 'Editor', 'Critic'].map((agent, index) => (
              <div key={agent} className="flex items-center">
                <div className="bg-white rounded-lg shadow-md p-4 text-center min-w-[100px]">
                  <div className="text-2xl mb-2">
                    {['🔍', '📋', '✍️', '📝', '⭐'][index]}
                  </div>
                  <div className="font-medium text-gray-700">{agent}</div>
                </div>
                {index < 4 && (
                  <span className="text-gray-400 mx-2 text-2xl">→</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Book Type Selection */}
        <div className="mb-12">
          <h2 className="text-2xl font-semibold text-center mb-8 text-gray-800">
            어떤 책을 쓰고 싶으신가요?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {bookTypes.map((type) => (
              <button
                key={type.id}
                onClick={() => setSelectedType(type.id)}
                className={`p-6 rounded-xl border-2 transition-all text-left ${
                  selectedType === type.id
                    ? 'border-indigo-500 bg-indigo-50 shadow-lg'
                    : 'border-gray-200 bg-white hover:border-indigo-300 hover:shadow-md'
                }`}
              >
                <h3 className="text-lg font-semibold text-gray-800">{type.name}</h3>
                <p className="text-sm text-gray-600 mt-2">{type.description}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Start Button */}
        <div className="text-center">
          <Link
            href={selectedType ? `/write?type=${selectedType}` : '#'}
            className={`inline-block px-8 py-4 rounded-full text-lg font-semibold transition-all ${
              selectedType
                ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg hover:shadow-xl'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
            onClick={(e) => !selectedType && e.preventDefault()}
          >
            책 쓰기 시작하기
          </Link>
        </div>

        {/* Features */}
        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white rounded-xl p-6 shadow-md">
            <div className="text-3xl mb-4">🤖</div>
            <h3 className="text-lg font-semibold mb-2">Multi-Agent AI</h3>
            <p className="text-gray-600">
              5개의 전문화된 AI 에이전트가 각자의 역할을 수행하며 협업합니다.
            </p>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-md">
            <div className="text-3xl mb-4">📚</div>
            <h3 className="text-lg font-semibold mb-2">다양한 장르</h3>
            <p className="text-gray-600">
              소설부터 기술서적까지 다양한 종류의 책을 작성할 수 있습니다.
            </p>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-md">
            <div className="text-3xl mb-4">📄</div>
            <h3 className="text-lg font-semibold mb-2">PDF 출력</h3>
            <p className="text-gray-600">
              완성된 책을 깔끔한 PDF 형식으로 다운로드할 수 있습니다.
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}
