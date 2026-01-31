import { BookOutline, TableOfContents, TOCEntry, ChapterOutline, Section } from '@/types/book'

/**
 * Generate a table of contents from a book outline
 */
export function generateTableOfContents(
  bookTitle: string,
  outline: BookOutline
): TableOfContents {
  const entries: TOCEntry[] = []

  for (const chapter of outline.chapters) {
    // Add chapter entry
    entries.push({
      type: 'chapter',
      number: String(chapter.number),
      title: chapter.title,
    })

    // Add section entries
    if (chapter.sections) {
      for (const section of chapter.sections) {
        entries.push({
          type: 'section',
          number: section.id,
          title: section.title,
        })
      }
    }
  }

  return {
    title: bookTitle,
    entries,
    generatedAt: new Date(),
  }
}

/**
 * Add a new chapter to the outline
 */
export function addChapter(
  outline: BookOutline,
  title: string,
  summary: string,
  position?: number
): BookOutline {
  const newChapterNumber = position ?? outline.chapters.length + 1

  const newChapter: ChapterOutline = {
    number: newChapterNumber,
    title,
    summary,
    keyPoints: [],
    sections: [{
      id: `${newChapterNumber}.1`,
      title: '개요',
      summary,
      estimatedWords: 500,
    }],
  }

  const chapters = [...outline.chapters]

  if (position !== undefined && position <= chapters.length) {
    chapters.splice(position - 1, 0, newChapter)
    // Renumber chapters
    chapters.forEach((ch, idx) => {
      ch.number = idx + 1
      ch.sections = ch.sections.map((sec, secIdx) => ({
        ...sec,
        id: `${idx + 1}.${secIdx + 1}`,
      }))
    })
  } else {
    chapters.push(newChapter)
  }

  return { ...outline, chapters }
}

/**
 * Remove a chapter from the outline
 */
export function removeChapter(
  outline: BookOutline,
  chapterNumber: number
): BookOutline {
  const chapters = outline.chapters
    .filter(ch => ch.number !== chapterNumber)
    .map((ch, idx) => ({
      ...ch,
      number: idx + 1,
      sections: ch.sections.map((sec, secIdx) => ({
        ...sec,
        id: `${idx + 1}.${secIdx + 1}`,
      })),
    }))

  return { ...outline, chapters }
}

/**
 * Reorder chapters in the outline
 */
export function reorderChapters(
  outline: BookOutline,
  fromIndex: number,
  toIndex: number
): BookOutline {
  const chapters = [...outline.chapters]
  const [removed] = chapters.splice(fromIndex, 1)
  chapters.splice(toIndex, 0, removed)

  // Renumber chapters
  const renumbered = chapters.map((ch, idx) => ({
    ...ch,
    number: idx + 1,
    sections: ch.sections.map((sec, secIdx) => ({
      ...sec,
      id: `${idx + 1}.${secIdx + 1}`,
    })),
  }))

  return { ...outline, chapters: renumbered }
}

/**
 * Add a section to a chapter
 */
export function addSection(
  outline: BookOutline,
  chapterNumber: number,
  title: string,
  summary: string
): BookOutline {
  const chapters = outline.chapters.map(ch => {
    if (ch.number !== chapterNumber) return ch

    const newSectionNumber = ch.sections.length + 1
    const newSection: Section = {
      id: `${chapterNumber}.${newSectionNumber}`,
      title,
      summary,
      estimatedWords: 500,
    }

    return {
      ...ch,
      sections: [...ch.sections, newSection],
    }
  })

  return { ...outline, chapters }
}

/**
 * Remove a section from a chapter
 */
export function removeSection(
  outline: BookOutline,
  chapterNumber: number,
  sectionId: string
): BookOutline {
  const chapters = outline.chapters.map(ch => {
    if (ch.number !== chapterNumber) return ch

    const sections = ch.sections
      .filter(sec => sec.id !== sectionId)
      .map((sec, idx) => ({
        ...sec,
        id: `${chapterNumber}.${idx + 1}`,
      }))

    return { ...ch, sections }
  })

  return { ...outline, chapters }
}
