'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { motion, useScroll, useTransform, useInView, AnimatePresence } from 'framer-motion'

// ============================================================================
// Types
// ============================================================================
interface Agent {
  id: string
  name: string
  nameKo: string
  description: string
  icon: React.ReactNode
}

interface BookSample {
  id: string
  title: string
  author: string
  category: string
  color: string
}

interface Testimonial {
  id: string
  quote: string
  author: string
  role: string
}

// ============================================================================
// Data
// ============================================================================
const agents: Agent[] = [
  {
    id: 'research',
    name: 'Research',
    nameKo: '리서치',
    description: '관련 자료를 수집하고 팩트를 검증합니다',
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    ),
  },
  {
    id: 'outliner',
    name: 'Outliner',
    nameKo: '아웃라이너',
    description: '책의 구조를 설계하고 목차를 구성합니다',
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    ),
  },
  {
    id: 'writer',
    name: 'Writer',
    nameKo: '작가',
    description: '섹션별로 본문을 작성하고 스토리를 전개합니다',
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
      </svg>
    ),
  },
  {
    id: 'editor',
    name: 'Editor',
    nameKo: '편집자',
    description: '문장을 다듬고 일관성을 검토합니다',
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
      </svg>
    ),
  },
  {
    id: 'critic',
    name: 'Critic',
    nameKo: '비평가',
    description: '품질을 평가하고 개선 방향을 제시합니다',
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
]

const bookSamples: BookSample[] = [
  { id: '1', title: '별이 빛나는 밤에', author: 'AI 작가', category: '소설', color: '#704214' },
  { id: '2', title: '성공하는 습관의 비밀', author: 'AI 작가', category: '자기계발', color: '#2d4a3e' },
  { id: '3', title: '커피 한 잔의 여유', author: 'AI 작가', category: '에세이', color: '#4a3728' },
  { id: '4', title: '아이와 함께하는 동화', author: 'AI 작가', category: '동화', color: '#5c4a7d' },
  { id: '5', title: 'React 마스터하기', author: 'AI 작가', category: '기술서적', color: '#1e3a5f' },
  { id: '6', title: '마음의 시', author: 'AI 작가', category: '시집', color: '#6b4423' },
]

const testimonials: Testimonial[] = [
  {
    id: '1',
    quote: '오랫동안 머릿속에만 있던 이야기를 드디어 책으로 만들 수 있었어요. AI가 제 아이디어를 정말 잘 이해하고 발전시켜주었습니다.',
    author: '김지영',
    role: '첫 소설 출간 작가',
  },
  {
    id: '2',
    quote: '전문 작가가 아니어도 책을 쓸 수 있다는 게 놀라웠어요. 마치 베테랑 편집자와 함께 작업하는 느낌이었습니다.',
    author: '이현우',
    role: '자기계발서 저자',
  },
  {
    id: '3',
    quote: '아이에게 들려줄 동화를 직접 만들 수 있어서 정말 특별한 경험이었어요. 세상에 하나뿐인 책이 되었죠.',
    author: '박서연',
    role: '두 아이의 엄마',
  },
]

const categories = ['전체', '소설', '자기계발', '에세이', '동화', '기술서적', '시집']

// ============================================================================
// Components
// ============================================================================

function ThemeToggle() {
  const [isDark, setIsDark] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    setIsDark(document.documentElement.classList.contains('dark'))
  }, [])

  const toggleTheme = () => {
    const newIsDark = !isDark
    setIsDark(newIsDark)
    if (newIsDark) {
      document.documentElement.classList.add('dark')
      localStorage.setItem('theme', 'dark')
    } else {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('theme', 'light')
    }
  }

  if (!mounted) return null

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-full bg-beige dark:bg-charcoal/20 hover:bg-gold/20 transition-colors"
      aria-label="Toggle theme"
    >
      {isDark ? (
        <svg className="w-5 h-5 text-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ) : (
        <svg className="w-5 h-5 text-deep-brown" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
        </svg>
      )}
    </button>
  )
}

function BrushStroke({ className = '' }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 400 60"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        className="brush-stroke"
        d="M10 45 C50 35, 80 50, 120 40 C160 30, 200 45, 250 35 C300 25, 340 40, 390 30"
        stroke="currentColor"
        strokeWidth="12"
        strokeLinecap="round"
        fill="none"
        style={{ opacity: 0.6 }}
      />
    </svg>
  )
}

function Navigation() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-cream/90 dark:bg-charcoal/90 backdrop-blur-md shadow-sm' : ''
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link href="/" className="font-serif text-2xl font-bold text-gradient">
          AI Book
        </Link>
        <div className="flex items-center gap-6">
          <Link href="/projects" className="text-brown dark:text-warm-gray hover:text-deep-brown dark:hover:text-cream-light transition-colors">
            내 프로젝트
          </Link>
          <ThemeToggle />
          <Link href="/write" className="cta-button text-sm py-2 px-5">
            시작하기
          </Link>
        </div>
      </div>
    </motion.nav>
  )
}

function HeroSection() {
  const ref = useRef(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start start', 'end start'],
  })
  const y = useTransform(scrollYProgress, [0, 1], ['0%', '30%'])
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0])

  return (
    <section ref={ref} className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
      {/* Background decoration */}
      <motion.div
        style={{ y, opacity }}
        className="absolute inset-0 pointer-events-none"
      >
        <div className="absolute top-20 right-10 w-64 h-64 bg-gold/5 rounded-full blur-3xl" />
        <div className="absolute bottom-20 left-10 w-96 h-96 bg-brown/5 rounded-full blur-3xl" />
      </motion.div>

      <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <span className="inline-block mb-6 px-4 py-2 bg-gold/10 text-gold rounded-full text-sm font-medium">
            AI 협업 글쓰기 플랫폼
          </span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="font-serif text-5xl md:text-7xl lg:text-8xl font-bold mb-8 leading-tight"
        >
          <span className="text-gradient">당신의 이야기를</span>
          <br />
          <span className="relative inline-block mt-2">
            책으로
            <BrushStroke className="absolute -bottom-2 left-0 w-full h-auto text-gold" />
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="text-lg md:text-xl text-brown dark:text-warm-gray max-w-2xl mx-auto mb-12 leading-relaxed"
        >
          머릿속에 잠들어 있던 이야기를 깨워보세요.
          <br className="hidden md:block" />
          5명의 AI 에이전트가 당신의 책 완성을 도와드립니다.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="flex flex-col sm:flex-row gap-4 justify-center items-center"
        >
          <Link href="/write" className="cta-button text-lg px-8 py-4">
            책 쓰기 시작하기
            <svg className="ml-2 w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
          <a
            href="#how-it-works"
            className="inline-flex items-center text-brown dark:text-warm-gray hover:text-deep-brown dark:hover:text-cream-light transition-colors"
          >
            작동 방식 알아보기
            <svg className="ml-1 w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </a>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 scroll-indicator"
        >
          <svg className="w-6 h-6 text-warm-gray" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </motion.div>
      </div>
    </section>
  )
}

function HowItWorksSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <section id="how-it-works" className="py-32 bg-beige/50 dark:bg-charcoal/30">
      <div className="max-w-7xl mx-auto px-6">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-20"
        >
          <span className="inline-block mb-4 text-gold font-medium tracking-wide">HOW IT WORKS</span>
          <h2 className="font-serif text-4xl md:text-5xl font-bold mb-6">
            5명의 전문가가 협업합니다
          </h2>
          <p className="text-brown dark:text-warm-gray max-w-2xl mx-auto">
            각자의 역할에 최적화된 AI 에이전트들이 순차적으로 작업하며,
            피드백 루프를 통해 완성도를 높여갑니다.
          </p>
        </motion.div>

        {/* Agent Pipeline */}
        <div className="relative">
          {/* Connection line */}
          <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-gold/30 to-transparent hidden lg:block" />

          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6 lg:gap-4">
            {agents.map((agent, index) => (
              <motion.div
                key={agent.id}
                initial={{ opacity: 0, y: 50 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: index * 0.15 }}
                className="agent-card text-center relative"
              >
                {/* Step number */}
                <div className="absolute -top-3 -right-3 w-8 h-8 bg-gold text-cream-light rounded-full flex items-center justify-center text-sm font-bold">
                  {index + 1}
                </div>

                <div className="w-16 h-16 mx-auto mb-4 bg-gold/10 rounded-full flex items-center justify-center text-gold">
                  {agent.icon}
                </div>
                <h3 className="font-serif text-xl font-semibold mb-1">{agent.name}</h3>
                <p className="text-sm text-gold mb-3">{agent.nameKo}</p>
                <p className="text-sm text-brown dark:text-warm-gray">{agent.description}</p>

                {/* Arrow for larger screens */}
                {index < agents.length - 1 && (
                  <div className="hidden lg:block absolute top-1/2 -right-4 transform -translate-y-1/2 text-gold/50 z-10">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>

        {/* Feedback loop indicator */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={isInView ? { opacity: 1, scale: 1 } : {}}
          transition={{ duration: 0.6, delay: 1 }}
          className="mt-12 text-center"
        >
          <div className="inline-flex items-center gap-3 px-6 py-3 bg-cream-light dark:bg-charcoal/50 rounded-full border border-gold/20">
            <svg className="w-5 h-5 text-gold animate-spin" style={{ animationDuration: '3s' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span className="text-sm text-brown dark:text-warm-gray">
              피드백 루프를 통한 지속적인 품질 개선
            </span>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

function GallerySection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })
  const [selectedCategory, setSelectedCategory] = useState('전체')

  const filteredBooks = selectedCategory === '전체'
    ? bookSamples
    : bookSamples.filter(book => book.category === selectedCategory)

  return (
    <section className="py-32">
      <div className="max-w-7xl mx-auto px-6">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <span className="inline-block mb-4 text-gold font-medium tracking-wide">GALLERY</span>
          <h2 className="font-serif text-4xl md:text-5xl font-bold mb-6">
            AI가 완성한 책들
          </h2>
          <p className="text-brown dark:text-warm-gray max-w-2xl mx-auto mb-10">
            다양한 장르의 책들이 AI Book을 통해 탄생했습니다.
            당신의 이야기도 이 갤러리에 추가될 수 있습니다.
          </p>

          {/* Category Filter */}
          <div className="flex flex-wrap justify-center gap-2">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-full text-sm transition-all ${
                  selectedCategory === category
                    ? 'bg-deep-brown dark:bg-gold text-cream-light'
                    : 'bg-beige/50 dark:bg-charcoal/30 text-brown dark:text-warm-gray hover:bg-beige dark:hover:bg-charcoal/50'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Books Grid */}
        <motion.div
          layout
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6"
        >
          <AnimatePresence mode="popLayout">
            {filteredBooks.map((book, index) => (
              <motion.div
                key={book.id}
                layout
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
                className="group cursor-pointer"
              >
                <div
                  className="relative w-full aspect-[2/3] rounded-md overflow-hidden shadow-lg transition-all duration-500 group-hover:-translate-y-2 group-hover:shadow-2xl"
                  style={{
                    background: `linear-gradient(135deg, ${book.color}, ${book.color}dd)`,
                    transformStyle: 'preserve-3d',
                  }}
                >
                  {/* Book spine effect */}
                  <div className="absolute left-0 top-0 bottom-0 w-3 bg-black/20" />

                  {/* Gold border decoration */}
                  <div className="absolute inset-2 border border-gold/30 rounded-sm" />

                  {/* Book content */}
                  <div className="absolute inset-0 p-4 flex flex-col justify-between text-cream-light">
                    <div>
                      <span className="text-xs opacity-70">{book.category}</span>
                    </div>
                    <div>
                      <h4 className="font-serif text-sm font-semibold leading-tight mb-1">{book.title}</h4>
                      <p className="text-xs opacity-70">{book.author}</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      </div>
    </section>
  )
}

function TestimonialsSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <section className="py-32 bg-beige/50 dark:bg-charcoal/30">
      <div className="max-w-6xl mx-auto px-6">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <span className="inline-block mb-4 text-gold font-medium tracking-wide">TESTIMONIALS</span>
          <h2 className="font-serif text-4xl md:text-5xl font-bold mb-6">
            작가들의 이야기
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.id}
              initial={{ opacity: 0, y: 50 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: index * 0.15 }}
              className="testimonial-card"
            >
              <p className="text-lg leading-relaxed mb-6 relative z-10">
                {testimonial.quote}
              </p>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gold/20 rounded-full flex items-center justify-center text-gold font-serif font-bold">
                  {testimonial.author[0]}
                </div>
                <div>
                  <p className="font-semibold">{testimonial.author}</p>
                  <p className="text-sm text-brown dark:text-warm-gray">{testimonial.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

function CTASection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <section className="py-32">
      <div className="max-w-4xl mx-auto px-6 text-center">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
        >
          <h2 className="font-serif text-4xl md:text-6xl font-bold mb-8">
            당신의 이야기는
            <br />
            <span className="text-gradient">무엇인가요?</span>
          </h2>
          <p className="text-lg text-brown dark:text-warm-gray max-w-2xl mx-auto mb-12">
            누구나 마음속에 하나의 책을 품고 있습니다.
            <br />
            지금 바로 그 이야기를 세상에 꺼내보세요.
          </p>
          <Link href="/write" className="cta-button text-lg px-10 py-5">
            무료로 시작하기
            <svg className="ml-2 w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        </motion.div>
      </div>
    </section>
  )
}

function Footer() {
  return (
    <footer className="py-12 border-t border-beige dark:border-charcoal/50">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="font-serif text-xl font-bold text-gradient">AI Book</div>
          <p className="text-sm text-warm-gray">
            AI 에이전트들이 협업하여 당신만의 책을 완성합니다.
          </p>
          <div className="flex gap-6">
            <Link href="/write" className="text-sm text-brown dark:text-warm-gray hover:text-deep-brown dark:hover:text-cream-light transition-colors">
              책 쓰기
            </Link>
            <Link href="/projects" className="text-sm text-brown dark:text-warm-gray hover:text-deep-brown dark:hover:text-cream-light transition-colors">
              내 프로젝트
            </Link>
          </div>
        </div>
        <div className="mt-8 pt-8 border-t border-beige dark:border-charcoal/50 text-center text-sm text-warm-gray">
          Made with AI Book
        </div>
      </div>
    </footer>
  )
}

// ============================================================================
// Main Page
// ============================================================================
export default function Home() {
  return (
    <main className="relative">
      <Navigation />
      <HeroSection />
      <HowItWorksSection />
      <GallerySection />
      <TestimonialsSection />
      <CTASection />
      <Footer />
    </main>
  )
}
