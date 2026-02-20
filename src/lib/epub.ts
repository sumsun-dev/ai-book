import Epub from 'epub-gen-memory'
import { marked } from 'marked'
import { BookProject, BookMetadata, Chapter } from '@/types/book'
import { getEPUBStyles, EPUBStyleOptions } from './epub-styles'

interface EPUBChapter {
  title: string
  content: string
  author?: string
  filename?: string
  excludeFromToc?: boolean
}

interface EPUBGenerateOptions {
  includeTableOfContents?: boolean
  includeTitlePage?: boolean
  includeColophon?: boolean
  styleOptions?: EPUBStyleOptions
  customCss?: string
  coverImage?: string | Buffer
}

// epub-gen-memory 라이브러리용 내부 옵션 타입
interface InternalEPUBOptions {
  title: string
  author: string | string[]
  publisher?: string
  language?: string
  cover?: string
  css?: string
  tocTitle?: string
  version?: 2 | 3
}

/**
 * Markdown을 HTML로 변환
 */
export function markdownToHTML(markdown: string): string {
  // HTML 태그가 이미 포함되어 있으면 그대로 반환
  if (markdown.includes('<p>') || markdown.includes('<h1>')) {
    return markdown
  }

  // marked 설정
  marked.setOptions({
    breaks: true,
    gfm: true,
  })

  return marked.parse(markdown) as string
}

/**
 * 타이틀 페이지 HTML 생성
 */
function generateTitlePageHTML(
  project: BookProject,
  metadata?: BookMetadata
): string {
  const authors = metadata?.authors?.map(a => a.name).join(', ') || ''
  const subtitle = metadata?.subtitle || ''
  const publisher = metadata?.publisher || ''

  return `
    <div class="title-page">
      <h1>${project.title}</h1>
      ${subtitle ? `<p class="subtitle">${subtitle}</p>` : ''}
      ${authors ? `<p class="author">${authors}</p>` : ''}
      ${publisher ? `<p class="publisher">${publisher}</p>` : ''}
    </div>
  `
}

/**
 * 목차 HTML 생성
 */
function generateTocHTML(chapters: Chapter[]): string {
  const items = chapters
    .sort((a, b) => a.number - b.number)
    .map(ch => `<li><a href="chapter-${ch.number}.xhtml">${ch.title}</a></li>`)
    .join('\n')

  return `
    <div class="toc">
      <h2>목차</h2>
      <ul>
        ${items}
      </ul>
    </div>
  `
}

/**
 * 판권 페이지 HTML 생성
 */
function generateColophonHTML(
  project: BookProject,
  metadata?: BookMetadata
): string {
  const authors = metadata?.authors?.map(a => a.name).join(', ') || ''
  const publisher = metadata?.publisher || ''
  const publishDate = metadata?.publishDate
    ? new Date(metadata.publishDate).toLocaleDateString('ko-KR')
    : ''
  const copyright = metadata?.copyright || ''
  const edition = metadata?.edition || '초판'

  return `
    <div class="colophon">
      <h2>${project.title}</h2>
      ${authors ? `<p>저자: ${authors}</p>` : ''}
      ${publisher ? `<p>발행처: ${publisher}</p>` : ''}
      ${publishDate ? `<p>발행일: ${publishDate}</p>` : ''}
      ${edition ? `<p>판차: ${edition}</p>` : ''}
      ${copyright ? `<p class="copyright">${copyright}</p>` : ''}
    </div>
  `
}

/**
 * 챕터를 EPUB 형식으로 변환
 */
function convertChaptersToEPUBFormat(
  chapters: Chapter[],
  includeChapterNumber: boolean = true
): EPUBChapter[] {
  return chapters
    .sort((a, b) => a.number - b.number)
    .map(ch => {
      const chapterNumber = includeChapterNumber
        ? `<p class="chapter-number">Chapter ${ch.number}</p>`
        : ''

      const content = markdownToHTML(ch.content)

      return {
        title: ch.title,
        content: `
          <div class="chapter">
            ${chapterNumber}
            <h1>${ch.title}</h1>
            ${content}
          </div>
        `,
        filename: `chapter-${ch.number}.xhtml`,
      }
    })
}

/**
 * EPUB 파일 생성
 */
export async function generateEPUB(
  project: BookProject,
  chapters: Chapter[],
  metadata?: BookMetadata,
  options: EPUBGenerateOptions = {}
): Promise<Buffer> {
  const {
    includeTableOfContents = true,
    includeTitlePage = true,
    includeColophon = true,
    styleOptions = {},
    customCss,
    coverImage,
  } = options

  // 스타일 생성
  const css = customCss || getEPUBStyles(styleOptions)

  // 챕터 목록 생성
  const epubChapters: EPUBChapter[] = []

  // 타이틀 페이지
  if (includeTitlePage) {
    epubChapters.push({
      title: '표지',
      content: generateTitlePageHTML(project, metadata),
      filename: 'title.xhtml',
      excludeFromToc: true,
    })
  }

  // 목차
  if (includeTableOfContents) {
    epubChapters.push({
      title: '목차',
      content: generateTocHTML(chapters),
      filename: 'toc.xhtml',
    })
  }

  // 본문 챕터
  epubChapters.push(...convertChaptersToEPUBFormat(chapters))

  // 판권 페이지
  if (includeColophon) {
    epubChapters.push({
      title: '판권',
      content: generateColophonHTML(project, metadata),
      filename: 'colophon.xhtml',
    })
  }

  // 저자 목록
  const authors = metadata?.authors?.map(a => a.name) || []
  const authorString = authors.length > 0 ? authors.join(', ') : '작성자 미상'

  // EPUB 옵션
  const epubOptions: InternalEPUBOptions = {
    title: project.title,
    author: authorString,
    publisher: metadata?.publisher || '',
    language: metadata?.language || 'ko',
    css,
    tocTitle: '목차',
    version: 3,
  }

  // 표지 이미지 (문자열 URL인 경우만 지원)
  if (coverImage && typeof coverImage === 'string') {
    epubOptions.cover = coverImage
  }

  // epub-gen-memory를 사용하여 EPUB 생성
  const epub = await Epub(epubOptions as Parameters<typeof Epub>[0], epubChapters)

  return Buffer.from(epub)
}

/**
 * EPUB 다운로드 (클라이언트용)
 */
export async function downloadEPUB(
  project: BookProject,
  chapters: Chapter[],
  metadata?: BookMetadata,
  options?: EPUBGenerateOptions
): Promise<void> {
  // 브라우저 환경 확인
  if (typeof window === 'undefined') {
    throw new Error('downloadEPUB은 브라우저 환경에서만 사용 가능합니다.')
  }

  // API를 통해 EPUB 생성
  const response = await fetch(`/api/projects/${project.id}/export/epub`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      includeTableOfContents: options?.includeTableOfContents ?? true,
      includeTitlePage: options?.includeTitlePage ?? true,
      includeColophon: options?.includeColophon ?? true,
      styleOptions: options?.styleOptions,
    }),
  })

  if (!response.ok) {
    throw new Error('EPUB 생성에 실패했습니다.')
  }

  const blob = await response.blob()
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${project.title}.epub`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * 간단한 EPUB 생성 (챕터 맵 사용)
 */
export async function generateEPUBFromMap(
  project: BookProject,
  chapterMap: Map<number, string>,
  metadata?: BookMetadata,
  options?: EPUBGenerateOptions
): Promise<Buffer> {
  // Map을 Chapter 배열로 변환
  const chapters: Chapter[] = []

  chapterMap.forEach((content, number) => {
    const outlineChapter = project.outline?.chapters.find(ch => ch.number === number)
    chapters.push({
      number,
      title: outlineChapter?.title || `챕터 ${number}`,
      content,
      status: 'approved',
      revisions: [],
    })
  })

  return generateEPUB(project, chapters, metadata, options)
}
