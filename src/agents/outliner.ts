import { runAgent, AgentConfig } from '@/lib/claude'
import { BookOutline, BookType, ResearchResult, TableOfContents, TOCEntry, OutlineFeedback, ChapterOutline, Section } from '@/types/book'

const outlinerAgentConfig: AgentConfig = {
  name: 'Outliner Agent',
  systemPrompt: `당신은 책의 구조를 설계하는 전문가입니다.

## 역할
- 리서치 결과를 바탕으로 책의 전체 구조를 설계합니다
- 논리적이고 흡입력 있는 챕터 구성을 만듭니다
- 각 챕터를 세부 섹션으로 나눕니다
- 각 챕터의 핵심 포인트를 정리합니다
- 독자의 여정을 고려한 흐름을 설계합니다

## 출력 형식
JSON 형식으로 다음 구조로 응답하세요:
{
  "synopsis": "책의 전체 개요 (2-3문장)",
  "chapters": [
    {
      "number": 1,
      "title": "챕터 제목",
      "summary": "챕터 요약",
      "keyPoints": ["핵심 포인트 1", "핵심 포인트 2"],
      "sections": [
        {
          "id": "1.1",
          "title": "섹션 제목",
          "summary": "섹션 요약",
          "estimatedWords": 500
        }
      ]
    }
  ],
  "estimatedPages": 예상 페이지 수,
  "targetAudience": "타겟 독자",
  "tone": "문체/톤"
}`,
  temperature: 0.6,
}

const refinementAgentConfig: AgentConfig = {
  name: 'Outliner Refinement Agent',
  systemPrompt: `당신은 책의 구조를 수정하는 전문가입니다.

## 역할
- 사용자의 피드백을 바탕으로 기존 아웃라인을 개선합니다
- 챕터 추가, 삭제, 수정, 순서 변경을 수행합니다
- 전체적인 흐름과 일관성을 유지합니다

## 출력 형식
수정된 아웃라인을 동일한 JSON 형식으로 응답하세요.`,
  temperature: 0.5,
}

export async function runOutlinerAgent(
  bookType: BookType,
  title: string,
  description: string,
  research: ResearchResult
): Promise<BookOutline> {
  const prompt = `
## 책 유형: ${bookType}
## 제목: ${title}
## 설명: ${description}

## 리서치 결과:
${JSON.stringify(research, null, 2)}

위 정보를 바탕으로 책의 상세한 아웃라인을 작성해주세요.
각 챕터에 2-4개의 섹션을 포함해주세요.
`

  const agentResult = await runAgent(outlinerAgentConfig, prompt)
  const response = agentResult.text

  try {
    const jsonMatch = response.match(/```json\n?([\s\S]*?)\n?```/) ||
                      response.match(/\{[\s\S]*\}/)
    const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : response
    const parsed = JSON.parse(jsonStr) as BookOutline

    // Ensure sections exist for each chapter
    parsed.chapters = parsed.chapters.map((chapter, idx) => ({
      ...chapter,
      sections: chapter.sections || [{
        id: `${idx + 1}.1`,
        title: '개요',
        summary: chapter.summary,
        estimatedWords: 500,
      }],
    }))

    return Object.assign(parsed, { _usage: agentResult.usage })
  } catch {
    const fallback: BookOutline = {
      synopsis: description,
      chapters: [{
        number: 1,
        title: '서론',
        summary: response,
        keyPoints: [],
        sections: [{
          id: '1.1',
          title: '시작하며',
          summary: '서론 내용',
          estimatedWords: 500,
        }],
      }],
      estimatedPages: 100,
      targetAudience: '일반 독자',
      tone: '친근한',
    }
    return Object.assign(fallback, { _usage: agentResult.usage })
  }
}

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
 * Refine the outline based on user feedback
 */
export async function refineOutline(
  currentOutline: BookOutline,
  feedback: OutlineFeedback
): Promise<BookOutline> {
  const prompt = `
## 현재 아웃라인:
${JSON.stringify(currentOutline, null, 2)}

## 사용자 피드백:
- 유형: ${feedback.type}
${feedback.targetChapter ? `- 대상 챕터: ${feedback.targetChapter}` : ''}
- 지시사항: ${feedback.instruction}

위 피드백을 반영하여 아웃라인을 수정해주세요.
`

  const agentResult = await runAgent(refinementAgentConfig, prompt)
  const response = agentResult.text

  try {
    const jsonMatch = response.match(/```json\n?([\s\S]*?)\n?```/) ||
                      response.match(/\{[\s\S]*\}/)
    const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : response
    const parsed = JSON.parse(jsonStr) as BookOutline

    // Ensure sections exist for each chapter
    parsed.chapters = parsed.chapters.map((chapter, idx) => ({
      ...chapter,
      sections: chapter.sections || [{
        id: `${idx + 1}.1`,
        title: '개요',
        summary: chapter.summary,
        estimatedWords: 500,
      }],
    }))

    return Object.assign(parsed, { _usage: agentResult.usage })
  } catch {
    return Object.assign({ ...currentOutline }, { _usage: agentResult.usage })
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
