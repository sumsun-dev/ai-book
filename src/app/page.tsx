'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion'
import { useTranslations } from 'next-intl'
import FloatingBookThree from '@/components/FloatingBookThree'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import NewsletterForm from '@/components/landing/NewsletterForm'

// ============================================================================
// Static Data (visual properties only — text comes from translations)
// ============================================================================
const agentIds = ['research', 'outliner', 'writer', 'editor', 'critic'] as const
const agentEngNames = ['Research', 'Outliner', 'Writer', 'Editor', 'Critic']

const agentIcons: React.ReactNode[] = [
  <svg key="research" className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>,
  <svg key="outliner" className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
  </svg>,
  <svg key="writer" className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
  </svg>,
  <svg key="editor" className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>,
  <svg key="critic" className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>,
]

const bookSampleData = [
  { key: 'poetry', id: '6', color: '#6b4423', cover: '/images/cover_poetry.png' },
  { key: 'selfhelp', id: '2', color: '#2d4a3e', cover: '/images/cover_habit.png' },
  { key: 'essay', id: '3', color: '#4a3728', cover: '/images/cover_coffee.png' },
  { key: 'children', id: '4', color: '#5c4a7d', cover: '/images/cover_fairy.png' },
  { key: 'technical', id: '5', color: '#1e3a5f', cover: '/images/cover_react.png' },
  { key: 'fiction', id: '1', color: '#704214', cover: '/gallery_starry_night_emotional.png' },
]

const categoryKeys = ['all', 'fiction', 'selfhelp', 'essay', 'children', 'technical', 'poetry'] as const

const testimonialIds = ['1', '2', '3'] as const
const testimonialAvatars: Record<string, string> = {
  '1': '/images/ko_avatar2.png',
  '2': '/images/ko_avatar1.png',
  '3': '/images/ko_avatar3.png',
}

// ============================================================================
// Components
// ============================================================================

function ThemeToggle() {
  const [isDark, setIsDark] = useState(false)
  const [mounted, setMounted] = useState(false)

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    setMounted(true)
    setIsDark(document.documentElement.classList.contains('dark'))
  }, [])
  /* eslint-enable react-hooks/set-state-in-effect */

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

function Navigation() {
  const [scrolled, setScrolled] = useState(false)
  const t = useTranslations('landing')

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
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-cream/90 dark:bg-charcoal/90 backdrop-blur-md shadow-sm' : ''
        }`}
    >
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link href="/" className="font-serif text-2xl font-bold text-gradient">
          AI Book
        </Link>
        <div className="flex items-center gap-6">
          <Link href="/projects" className="text-brown dark:text-warm-gray hover:text-deep-brown dark:hover:text-cream-light transition-colors">
            {t('nav.myProjects')}
          </Link>
          <LanguageSwitcher />
          <ThemeToggle />
          <Link href="/new" className="cta-button text-sm py-2 px-5">
            {t('nav.start')}
          </Link>
        </div>
      </div>
    </motion.nav>
  )
}

function BackgroundBook() {
  // Config for a "thin poetry book" feel
  const BOOK_WIDTH = 1000; // Much larger to cover background
  const BOOK_HEIGHT = 700;
  const PAGE_WIDTH = BOOK_WIDTH / 2;
  const SPINE_WIDTH = 20; // Thinner spine

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
      <div className="absolute top-[40%] left-1/2 -translate-x-1/2 w-full h-full opacity-10 blur-[1px]">
        <motion.div
          className="relative w-full h-full flex justify-center items-center"
          style={{ transformStyle: 'preserve-3d' }}
          initial={{
            rotateX: 40,
            rotateY: 0,
            rotateZ: -10
          }}
          animate={{
            rotateX: [40, 42, 38, 40],
            rotateZ: [-10, -8, -12, -10],
            y: [0, -20, 0],
          }}
          transition={{
            rotateX: { duration: 12, repeat: Infinity, ease: "easeInOut" },
            rotateZ: { duration: 15, repeat: Infinity, ease: "easeInOut" },
            y: { duration: 10, repeat: Infinity, ease: "easeInOut" }
          }}
        >
          {/* ==============================================
              LEFT SIDE (Base)
             ============================================== */}
          <div
            className="relative"
            style={{ width: PAGE_WIDTH, height: BOOK_HEIGHT, transformStyle: 'preserve-3d', marginRight: SPINE_WIDTH / 2 }}
          >
            {/* Left Page Surface (Simple, thin) */}
            <div
              className="absolute inset-0 rounded-l-sm border-l border-b border-t border-gray-400/30 bg-[#fffdf9]"
              style={{ transform: 'translateZ(0px)', transformOrigin: 'right center' }}
            >
              {/* Subtle lines resembling text/poetry */}
              <div className="absolute inset-0 p-16 flex flex-col justify-center opacity-40">
                {[68, 52, 75, 43, 61, 80, 55, 47, 72, 58, 65, 50].map((w, i) => (
                  <div
                    key={i}
                    className="h-1 bg-gray-400/30 mb-8 rounded-full"
                    style={{
                      width: `${w}%`,
                      marginLeft: `${(i * 7) % 20}%`
                    }}
                  />
                ))}
              </div>
            </div>
          </div>


          {/* ==============================================
              SPINE (Center)
             ============================================== */}
          <div
            className="absolute"
            style={{
              width: SPINE_WIDTH,
              height: BOOK_HEIGHT,
              transformStyle: 'preserve-3d',
            }}
          >
            <div className="absolute inset-0 bg-gray-300/20" />
            <div className="absolute inset-x-0 top-0 h-full w-[1px] mx-auto bg-gray-400/30" />
          </div>


          {/* ==============================================
              RIGHT SIDE (Base + Fluttering Pages)
             ============================================== */}
          <div
            className="relative"
            style={{ width: PAGE_WIDTH, height: BOOK_HEIGHT, transformStyle: 'preserve-3d', marginLeft: SPINE_WIDTH / 2 }}
          >
            {/* Right Page Base */}
            <div
              className="absolute inset-0 rounded-r-sm border-r border-b border-t border-gray-400/30 bg-[#fffdf9]"
              style={{ transform: 'translateZ(0px)' }}
            />

            {/* ==============================================
                 FLUTTERING PAGES
                ============================================== */}
            {[0, 1, 2, 3, 4].map((index) => (
              <motion.div
                key={index}
                className="absolute inset-0 rounded-r-sm border-r border-y border-gray-400/20 bg-white/40 origin-left"
                style={{
                  transformStyle: 'preserve-3d',
                  transformOrigin: '0% 50%',
                }}
                animate={{
                  rotateY: [-5 + (index * -2), -25 + (index * -5), -5 + (index * -2)]
                }}
                transition={{
                  duration: 4 + index,
                  ease: "easeInOut",
                  repeat: Infinity,
                  repeatType: "mirror",
                  delay: index * 0.5
                }}
              >
                {/* Content on fluttering pages */}
                <div className="absolute inset-0 p-16 flex flex-col justify-center opacity-20">
                  <div className="h-1 bg-gray-400/30 w-full mb-8" />
                  <div className="h-1 bg-gray-400/30 w-2/3 mb-8" />
                  <div className="h-1 bg-gray-400/30 w-4/5" />
                </div>
              </motion.div>
            ))}

            {/* One page flipping over completely */}
            <motion.div
              className="absolute inset-0 rounded-r-sm border-r border-y border-gray-400/20 bg-white/50 origin-left"
              style={{
                transformStyle: 'preserve-3d',
                transformOrigin: '0% 50%',
              }}
              initial={{ rotateY: 0 }}
              animate={{ rotateY: -180 }}
              transition={{
                duration: 15,
                ease: "easeInOut",
                repeat: Infinity,
                repeatDelay: 2
              }}
            >
              {/* Front content */}
              <div className="absolute inset-0 backface-hidden bg-white/10" />
              {/* Back content */}
              <div
                className="absolute inset-0 backface-hidden bg-[#fffdf9] rounded-l-sm"
                style={{ transform: 'rotateY(180deg)' }}
              />
            </motion.div>

          </div>

        </motion.div>
      </div>
    </div>
  )
}

function HeroSection() {
  const ref = useRef(null)
  const t = useTranslations('landing')
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start start', 'end start'],
  })
  const y = useTransform(scrollYProgress, [0, 1], ['0%', '50%'])
  const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0])

  return (
    <section ref={ref} className="relative min-h-[100vh] flex items-center justify-center overflow-hidden pt-20">
      {/* Dynamic Background */}
      <motion.div style={{ y, opacity }} className="absolute inset-0 pointer-events-none select-none">
        <div className="absolute top-[-10%] right-[-5%] w-[60vw] h-[60vw] bg-gold/5 rounded-full blur-[120px] mix-blend-multiply dark:bg-gold/10 dark:mix-blend-soft-light" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[70vw] h-[70vw] bg-brown/5 rounded-full blur-[150px] mix-blend-multiply dark:bg-brown/10 dark:mix-blend-soft-light" />
      </motion.div>

      <div className="relative z-10 w-full max-w-7xl mx-auto px-6 h-full flex flex-col justify-center">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">

          {/* Main Typography */}
          <div className="lg:col-span-7 text-left z-20">
            <motion.div
              initial="hidden"
              animate="visible"
              variants={{
                hidden: { opacity: 0 },
                visible: {
                  opacity: 1,
                  transition: { staggerChildren: 0.15, delayChildren: 0.2 }
                }
              }}
            >
              <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } } }}>
                <span className="inline-flex items-center gap-2 mb-6 px-4 py-1.5 bg-ink/5 dark:bg-cream/10 backdrop-blur-md rounded-full text-xs font-bold tracking-widest uppercase border border-ink/10 dark:border-cream/10 text-gold-dim">
                  <span className="w-1.5 h-1.5 rounded-full bg-gold animate-pulse" />
                  AI Collaborative Writing
                </span>
              </motion.div>

              <motion.h1
                className="font-serif text-5xl md:text-7xl lg:text-7xl font-bold mb-8 leading-[1.2] tracking-tight text-balance"
                variants={{ hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0, transition: { duration: 1, ease: [0.16, 1, 0.3, 1] } } }}
              >
                <span className="block text-ink dark:text-cream">{t('hero.title')}</span>
                <span className="block text-gold-dim italic drop-shadow-sm">with AI Book</span>
              </motion.h1>

              <motion.p
                className="text-lg md:text-xl text-stone dark:text-warm-gray max-w-xl mb-12 leading-relaxed font-sans font-light"
                variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 1, delay: 0.4, ease: [0.16, 1, 0.3, 1] } } }}
              >
                {t('hero.subtitle')}<br className="hidden md:block" />
                {t('hero.description')}
              </motion.p>

              <motion.div
                className="flex flex-col sm:flex-row gap-8 items-center justify-start"
                variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.8, delay: 0.6 } } }}
              >
                <Link href="/new" className="group relative px-10 py-5 bg-gold text-ink font-bold tracking-widest uppercase overflow-hidden transition-all duration-300 rounded-sm shadow-[0_10px_30px_-10px_rgba(212,175,55,0.5)] hover:shadow-[0_20px_40px_-10px_rgba(212,175,55,0.6)] hover:-translate-y-1 active:translate-y-0 active:shadow-inner">
                  <span className="relative z-10">{t('hero.cta')}</span>
                  <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                </Link>

                <a href="#how-it-works" className="group flex items-center gap-3 text-ink dark:text-cream font-medium transition-colors hover:text-gold py-2">
                  <span>{t('hero.learnMore')}</span>
                  <div className="w-10 h-10 rounded-full border border-ink/20 dark:border-cream/20 flex items-center justify-center group-hover:border-gold group-hover:bg-gold/10 transition-all">
                    <svg className="w-4 h-4 transform group-hover:translate-x-1 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </div>
                </a>
              </motion.div>
            </motion.div>
          </div>

          {/* 3D Visual Element - Master R3F Book */}
          <div className="lg:col-span-5 relative h-[900px] flex items-center justify-center z-10">
            <FloatingBookThree />
          </div>
        </div>
      </div>
    </section>
  )
}


function MarqueeSection() {
  const categoriesText = [
    "Novel", "Poetry", "Essay", "Self-Help", "Technology", "Fairy Tale", "Biography", "History", "Science Art"
  ]

  return (
    <div className="relative py-12 border-y border-stone/10 bg-cream dark:bg-ink overflow-hidden z-10 font-serif italic text-gold-dim">
      <div className="flex whitespace-nowrap overflow-hidden">
        <motion.div
          className="flex gap-20 items-center text-3xl md:text-5xl font-light tracking-[0.2em] uppercase"
          animate={{ x: [0, -2000] }}
          transition={{ repeat: Infinity, ease: "linear", duration: 40 }}
        >
          {Array(4).fill(null).map((_, i) => (
            <div key={i} className="flex gap-20">
              {categoriesText.map((cat, idx) => (
                <span key={idx} className="flex items-center gap-8">
                  {cat}
                  <span className="w-2 h-2 rounded-full bg-gold/30" />
                </span>
              ))}
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  )
}

function ProcessSection() {
  const containerRef = useRef(null)
  const t = useTranslations('landing')

  return (
    <section id="how-it-works" ref={containerRef} className="relative py-32 bg-cream-dark dark:bg-cream-dark overflow-hidden">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-24">
          <span className="text-gold text-xs tracking-[0.2em] uppercase font-bold mb-4 block">Process</span>
          <h2 className="text-4xl md:text-5xl font-serif font-bold text-ink dark:text-cream mb-6">
            Collaboration <span className="italic text-gold">Orchestra</span>
          </h2>
          <p className="text-stone max-w-lg mx-auto text-base font-light leading-relaxed">
            {t('pipeline.title')}
            <br />
            {t('pipeline.subtitle')}
          </p>
        </div>

        {/* Improved Grid for uniform sizing */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-stretch">
          {agentIds.map((id, index) => {
            return (
              <motion.div
                key={id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="group relative flex"
              >
                <div className="relative z-10 bg-cream dark:bg-ink border border-stone/10 p-8 pt-12 rounded-xl transition-all duration-300 hover:border-gold/50 hover:shadow-xl w-full flex flex-col items-center text-center">

                  {/* Number */}
                  <div className="absolute top-4 left-6 text-xs font-bold text-gold/50 tracking-widest uppercase">
                    Step 0{index + 1}
                  </div>

                  <div className="w-16 h-16 bg-gold/5 rounded-2xl flex items-center justify-center text-gold mb-6 group-hover:scale-110 group-hover:bg-gold/10 transition-all duration-300">
                    {agentIcons[index]}
                  </div>

                  <h3 className="font-serif text-xl font-bold mb-2 text-ink dark:text-cream">{agentEngNames[index]}</h3>
                  <p className="text-xs font-bold text-gold uppercase tracking-wider mb-4">{t(`agents.${id}.name`)}</p>

                  <p className="text-sm text-stone dark:text-stone/60 leading-relaxed font-light">
                    {t(`agents.${id}.description`)}
                  </p>
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

function GallerySection() {
  const [selectedCategory, setSelectedCategory] = useState('all')
  const t = useTranslations('landing')

  const filteredBooks = selectedCategory === 'all'
    ? bookSampleData
    : bookSampleData.filter(book => book.key === selectedCategory)

  return (
    <section className="py-32 bg-cream dark:bg-ink">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col md:flex-row justify-between items-end mb-20 gap-8">
          <div className="max-w-2xl">
            <span className="text-gold text-xs tracking-[0.2em] uppercase font-bold mb-4 block">Archives</span>
            <h2 className="text-5xl md:text-6xl font-serif font-bold text-ink dark:text-cream leading-tight">
              Masterpieces <br /><span className="italic text-gold">Created by AI</span>
            </h2>
          </div>

          {/* Minimalist Filter */}
          <div className="flex flex-wrap gap-2">
            {categoryKeys.map((key) => (
              <button
                key={key}
                onClick={() => setSelectedCategory(key)}
                className={`px-4 py-2 rounded-full text-xs font-medium tracking-wider transition-all duration-300 border ${selectedCategory === key
                  ? 'bg-ink dark:bg-cream text-cream dark:text-ink border-ink dark:border-cream'
                  : 'bg-transparent text-stone dark:text-stone/60 border-stone/20 hover:border-gold hover:text-gold'
                  }`}
              >
                {t(`showcase.categories.${key}`)}
              </button>
            ))}
          </div>
        </div>

        {/* Bento Grid */}
        <motion.div
          layout
          className="grid grid-cols-2 md:grid-cols-4 gap-4"
        >
          <AnimatePresence mode="popLayout">
            {filteredBooks.map((book, index) => {
              const isLarge = index === 0 || index === 3;

              return (
                <motion.div
                  key={book.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                  className={`group relative overflow-hidden rounded-sm cursor-pointer ${isLarge ? 'col-span-2 row-span-2 aspect-[4/5]' : 'col-span-1 row-span-1 aspect-[3/4]'}`}
                >
                  {/* Image Cover */}
                  <div className="absolute inset-0 transition-transform duration-700 group-hover:scale-105 bg-stone/10">
                    {book.cover ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img src={book.cover} alt={t(`samples.${book.key}.title`)} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full" style={{ background: book.color }} />
                    )}
                  </div>

                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-60 transition-opacity duration-300 group-hover:opacity-80" />

                  {/* Content Overlay */}
                  <div className="absolute inset-0 p-6 flex flex-col justify-end">
                    <div className="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                      <span className="inline-block px-2 py-1 bg-white/10 backdrop-blur-md rounded-sm text-[10px] text-white/90 mb-2 border border-white/10 tracking-wider uppercase">
                        {t(`samples.${book.key}.category`)}
                      </span>
                      <h3 className={`font-serif font-bold text-white mb-1 leading-tight ${isLarge ? 'text-3xl lg:text-4xl' : 'text-lg lg:text-xl'}`}>
                        {t(`samples.${book.key}.title`)}
                      </h3>
                      <p className="text-white/70 text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100 font-serif italic">
                        by {t(`samples.${book.key}.author`)}
                      </p>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </motion.div>
      </div>
    </section>
  )
}

function TestimonialsSection() {
  const t = useTranslations('landing')

  return (
    <section className="py-32 bg-cream-dark dark:bg-charcoal/20">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-20">
          <span className="text-gold text-xs tracking-[0.2em] uppercase font-bold mb-4 block">Testimonials</span>
          <h2 className="text-4xl md:text-5xl font-serif font-bold text-ink dark:text-cream">
            Authors&apos; Voices
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonialIds.map((id, index) => (
            <motion.div
              key={id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.15 }}
              className="bg-cream dark:bg-ink p-8 rounded-xl border border-stone/10 shadow-sm relative group hover:border-gold/30 transition-all flex flex-col"
            >
              <div className="absolute -top-4 -left-2 text-6xl text-gold/20 font-serif leading-none">&ldquo;</div>
              <p className="text-stone dark:text-stone/60 leading-relaxed mb-8 relative z-10 pt-4 font-light italic flex-grow">
                {t(`testimonials.${id}.quote`)}
              </p>

              <div className="border-t border-stone/10 pt-6 flex items-center gap-5">
                <div className="shrink-0 w-14 h-14 rounded-full overflow-hidden border-2 border-gold/20 group-hover:border-gold transition-all">
                  {testimonialAvatars[id] ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={testimonialAvatars[id]} alt={t(`testimonials.${id}.author`)} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gold/10" />
                  )}
                </div>
                <div className="flex flex-col">
                  <p className="font-serif font-bold text-ink dark:text-cream text-lg leading-snug">{t(`testimonials.${id}.author`)}</p>
                  <p className="text-[10px] text-gold uppercase tracking-widest font-bold mt-1">{t(`testimonials.${id}.role`)}</p>
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
  const t = useTranslations('landing')

  return (
    <section className="relative py-48 bg-ink text-cream overflow-hidden flex items-center justify-center">
      {/* Abstract Background Animation */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/2 -left-1/2 w-[200%] h-[200%] bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-gold/10 via-transparent to-transparent opacity-30 blur-3xl" />
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 90, 0],
            opacity: [0.1, 0.2, 0.1]
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/natural-paper.png')] opacity-5"
        />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
        >
          <h2 className="text-5xl md:text-7xl lg:text-9xl font-serif font-bold mb-16 tracking-tighter leading-none">
            {t('cta.line1')} <br /><span className="text-gold italic font-light">{t('cta.line2')}</span>
          </h2>

          <div className="flex flex-col items-center">
            <Link href="/new" className="group relative inline-flex items-center gap-6 px-16 py-8 bg-gold text-ink text-2xl font-bold tracking-[0.2em] uppercase overflow-hidden transition-all duration-500 hover:bg-cream">
              <span className="relative z-10">Start Your Journey</span>
              <div className="relative z-10 w-12 h-12 rounded-full border border-ink/20 flex items-center justify-center group-hover:translate-x-4 transition-transform duration-500">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </div>
              <div className="absolute inset-0 bg-white translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
            </Link>
            <p className="mt-12 text-stone-500 text-xs tracking-[0.4em] uppercase font-bold animate-pulse">
              Unleash Your Creativity • Limited Invitations
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

function Footer() {
  return (
    <footer className="py-24 bg-ink text-cream border-t border-white/5 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '40px 40px' }}
      />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 lg:gap-24 mb-20">
          <div className="md:col-span-5">
            <Link href="/" className="font-serif text-4xl font-bold mb-6 block tracking-tight">AI Book.</Link>
            <p className="text-stone-400 max-w-sm font-light leading-relaxed mb-8">
              We combine human creativity with artificial intelligence to unfold stories that have never been told before.
            </p>
          </div>

          <div className="md:col-span-3">
            <h4 className="font-serif text-lg mb-6 text-gold">Platform</h4>
            <ul className="space-y-4 text-stone-400">
              <li><Link href="/new" className="hover:text-white transition-colors">Start Writing</Link></li>
              <li><Link href="/features" className="hover:text-white transition-colors">Features</Link></li>
              <li><Link href="/pricing" className="hover:text-white transition-colors">Pricing</Link></li>
            </ul>
          </div>

          <div className="md:col-span-4">
            <NewsletterForm />
          </div>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-center pt-8 border-t border-white/5 text-xs text-stone-600 uppercase tracking-widest">
          <p>&copy; {new Date().getFullYear()} AI Book. All rights reserved.</p>
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
      <BackgroundBook />
      <HeroSection />
      <MarqueeSection />
      <ProcessSection />
      <GallerySection />
      <TestimonialsSection />
      <CTASection />
      <Footer />
    </main>
  )
}
