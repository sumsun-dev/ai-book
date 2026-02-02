import type { Page, PageStatus, PaperSize } from '@/types/book'

const CHARS_PER_PAGE = 1500
const WORDS_PER_PAGE = 400

// 용지 크기별 최대 글자 수 (16px 기준, 한글 기준)
export const PAGE_CHAR_LIMITS: Record<PaperSize, number> = {
  a4: 1400,      // A4: 넉넉한 여백 포함
  a5: 800,       // A5: 작은 판형
  b5: 1000,      // B5: 중간 크기
  letter: 1300,  // Letter: A4와 유사
  novel: 700,    // 신국판: 소설용 작은 판형
}

// 페이지당 권장 단어 수
export const PAGE_WORD_LIMITS: Record<PaperSize, number> = {
  a4: 350,
  a5: 200,
  b5: 250,
  letter: 325,
  novel: 175,
}

// HTML 태그 제거하고 순수 텍스트만 추출
export function stripHtmlTags(html: string): string {
  // img 태그는 완전히 제거 (base64 포함)
  let text = html.replace(/<img[^>]*>/gi, '')
  // 나머지 HTML 태그 제거
  text = text.replace(/<[^>]+>/g, ' ')
  // HTML 엔티티 변환
  text = text.replace(/&nbsp;/g, ' ')
  text = text.replace(/&amp;/g, '&')
  text = text.replace(/&lt;/g, '<')
  text = text.replace(/&gt;/g, '>')
  text = text.replace(/&quot;/g, '"')
  // 연속 공백 정리
  text = text.replace(/\s+/g, ' ').trim()
  return text
}

export function countWords(text: string): number {
  // HTML이 포함되어 있으면 태그 제거
  const cleanText = text.includes('<') ? stripHtmlTags(text) : text
  if (!cleanText.trim()) return 0
  const koreanChars = (cleanText.match(/[\uAC00-\uD7AF]/g) || []).length
  const englishWords = cleanText
    .replace(/[\uAC00-\uD7AF]/g, ' ')
    .trim()
    .split(/\s+/)
    .filter((w) => w.length > 0).length
  return koreanChars + englishWords
}

// 텍스트 길이 계산 (HTML 태그 제외)
export function getTextLength(content: string): number {
  const cleanText = content.includes('<') ? stripHtmlTags(content) : content
  return cleanText.length
}

export function getPageStatus(content: string): PageStatus {
  const wordCount = countWords(content)
  if (wordCount === 0) return 'empty'
  if (wordCount >= WORDS_PER_PAGE * 0.8) return 'complete'
  return 'draft'
}

export function splitChapterToPages(content: string, startPageNumber = 1): Omit<Page, 'id' | 'chapterId' | 'createdAt' | 'updatedAt'>[] {
  if (!content.trim()) {
    return [{
      pageNumber: startPageNumber,
      content: '',
      status: 'empty',
      wordCount: 0,
    }]
  }

  const pageBreakMarker = '---pagebreak---'
  const hasManualBreaks = content.includes(pageBreakMarker)

  if (hasManualBreaks) {
    const sections = content.split(pageBreakMarker)
    return sections.map((section, idx) => {
      const trimmedContent = section.trim()
      const wordCount = countWords(trimmedContent)
      return {
        pageNumber: startPageNumber + idx,
        content: trimmedContent,
        status: getPageStatus(trimmedContent),
        wordCount,
      }
    })
  }

  const paragraphs = content.split(/\n\n+/)
  const pages: Omit<Page, 'id' | 'chapterId' | 'createdAt' | 'updatedAt'>[] = []
  let currentPageContent = ''
  let pageNumber = startPageNumber

  for (const para of paragraphs) {
    const potentialContent = currentPageContent
      ? currentPageContent + '\n\n' + para
      : para

    if (potentialContent.length > CHARS_PER_PAGE && currentPageContent) {
      const wordCount = countWords(currentPageContent)
      pages.push({
        pageNumber: pageNumber++,
        content: currentPageContent.trim(),
        status: getPageStatus(currentPageContent),
        wordCount,
      })
      currentPageContent = para
    } else {
      currentPageContent = potentialContent
    }
  }

  if (currentPageContent.trim()) {
    const wordCount = countWords(currentPageContent)
    pages.push({
      pageNumber: pageNumber,
      content: currentPageContent.trim(),
      status: getPageStatus(currentPageContent),
      wordCount,
    })
  }

  return pages.length > 0 ? pages : [{
    pageNumber: startPageNumber,
    content: '',
    status: 'empty',
    wordCount: 0,
  }]
}

export function mergePagesToChapter(pages: Page[]): string {
  return pages
    .slice()
    .sort((a, b) => a.pageNumber - b.pageNumber)
    .map((p) => p.content)
    .filter((c) => c.trim())
    .join('\n\n')
}

export function calculateTotalPages(chapters: { content: string }[]): number {
  return chapters.reduce((total, ch) => {
    const pageData = splitChapterToPages(ch.content)
    return total + pageData.length
  }, 0)
}

export function getPageRange(chapterNumber: number, chaptersBeforeCount: number[]): { start: number; end: number } {
  let start = 1
  for (let i = 0; i < chapterNumber - 1 && i < chaptersBeforeCount.length; i++) {
    start += chaptersBeforeCount[i]
  }
  const end = start + (chaptersBeforeCount[chapterNumber - 1] || 1) - 1
  return { start, end }
}

// 페이지 오버플로우 체크 (HTML 태그 제외)
export function checkPageOverflow(content: string, paperSize: PaperSize): {
  isOverflow: boolean
  charCount: number
  maxChars: number
  overflowAmount: number
} {
  const charCount = getTextLength(content)
  const maxChars = PAGE_CHAR_LIMITS[paperSize]
  const isOverflow = charCount > maxChars
  return {
    isOverflow,
    charCount,
    maxChars,
    overflowAmount: isOverflow ? charCount - maxChars : 0,
  }
}

// 자동 페이지 분리: 한 페이지 내용을 여러 페이지로 분리
export function splitOverflowContent(
  content: string,
  paperSize: PaperSize
): string[] {
  const maxChars = PAGE_CHAR_LIMITS[paperSize]
  const textLength = getTextLength(content)

  // 텍스트 길이 기준으로 오버플로우 체크
  if (textLength <= maxChars) {
    return [content]
  }

  const pages: string[] = []
  let remaining = content

  while (remaining.length > 0) {
    if (remaining.length <= maxChars) {
      pages.push(remaining.trim())
      break
    }

    // 최대 글자 수 내에서 적절한 분리점 찾기
    let splitPoint = maxChars

    // 1. 문단 끝 찾기 (가장 좋은 분리점)
    const paragraphEnd = remaining.lastIndexOf('\n\n', maxChars)
    if (paragraphEnd > maxChars * 0.5) {
      splitPoint = paragraphEnd + 2
    } else {
      // 2. 문장 끝 찾기
      const sentenceEnders = ['. ', '。', '! ', '? ', '.\n', '!\n', '?\n']
      let bestSentenceEnd = -1

      for (const ender of sentenceEnders) {
        const pos = remaining.lastIndexOf(ender, maxChars)
        if (pos > bestSentenceEnd && pos > maxChars * 0.3) {
          bestSentenceEnd = pos + ender.length
        }
      }

      if (bestSentenceEnd > maxChars * 0.3) {
        splitPoint = bestSentenceEnd
      } else {
        // 3. 단어 경계에서 분리 (공백)
        const spacePos = remaining.lastIndexOf(' ', maxChars)
        if (spacePos > maxChars * 0.5) {
          splitPoint = spacePos + 1
        }
        // 그 외의 경우 maxChars에서 강제 분리
      }
    }

    pages.push(remaining.substring(0, splitPoint).trim())
    remaining = remaining.substring(splitPoint).trim()
  }

  return pages.filter(p => p.length > 0)
}

// 페이지 배열 재구성 (오버플로우 페이지 분리 적용)
export function redistributePages(
  pages: Page[],
  changedPageNumber: number,
  newContent: string,
  paperSize: PaperSize,
  chapterId: string
): Page[] {
  const splitContents = splitOverflowContent(newContent, paperSize)

  // 변경된 페이지가 분리되지 않으면 단순 업데이트
  if (splitContents.length === 1) {
    return pages.map(p =>
      p.pageNumber === changedPageNumber
        ? {
            ...p,
            content: splitContents[0],
            wordCount: countWords(splitContents[0]),
            status: getPageStatus(splitContents[0]),
          }
        : p
    )
  }

  // 분리가 필요한 경우
  const beforePages = pages.filter(p => p.pageNumber < changedPageNumber)
  const afterPages = pages.filter(p => p.pageNumber > changedPageNumber)

  // 분리된 페이지들 생성
  const newPages: Page[] = splitContents.map((content, idx) => ({
    id: idx === 0
      ? pages.find(p => p.pageNumber === changedPageNumber)?.id || `temp-${Date.now()}-${idx}`
      : `temp-split-${Date.now()}-${idx}`,
    chapterId,
    pageNumber: changedPageNumber + idx,
    content,
    status: getPageStatus(content),
    wordCount: countWords(content),
  }))

  // 이후 페이지들 번호 재조정
  const offset = splitContents.length - 1
  const adjustedAfterPages = afterPages.map(p => ({
    ...p,
    pageNumber: p.pageNumber + offset,
  }))

  return [...beforePages, ...newPages, ...adjustedAfterPages]
    .sort((a, b) => a.pageNumber - b.pageNumber)
}

// 빈 페이지 병합 (이전 페이지에 여유가 있으면 합침)
export function mergeEmptyPages(
  pages: Page[],
  paperSize: PaperSize,
  chapterId: string
): Page[] {
  if (pages.length <= 1) return pages

  const result: Page[] = []
  const maxChars = PAGE_CHAR_LIMITS[paperSize]

  for (let i = 0; i < pages.length; i++) {
    const current = pages[i]

    if (result.length === 0) {
      result.push({ ...current, pageNumber: 1 })
      continue
    }

    const prev = result[result.length - 1]
    const combinedLength = prev.content.length + (current.content.length > 0 ? current.content.length + 2 : 0)

    // 이전 페이지에 합칠 수 있는 경우
    if (combinedLength <= maxChars && current.content.trim()) {
      const mergedContent = prev.content + '\n\n' + current.content
      result[result.length - 1] = {
        ...prev,
        content: mergedContent.trim(),
        wordCount: countWords(mergedContent),
        status: getPageStatus(mergedContent),
      }
    } else if (current.content.trim()) {
      // 합칠 수 없으면 새 페이지로 추가
      result.push({
        ...current,
        pageNumber: result.length + 1,
      })
    }
    // 빈 페이지는 건너뜀
  }

  // 최소 1페이지 유지
  if (result.length === 0) {
    return [{
      id: pages[0]?.id || `temp-${Date.now()}`,
      chapterId,
      pageNumber: 1,
      content: '',
      status: 'empty',
      wordCount: 0,
    }]
  }

  return result
}
