import { streamAgent, AgentConfig } from '@/lib/claude'
import { mergeWriterConfig } from '@/lib/agent-config'
import { BookOutline, ChapterOutline, BookType, WriterConfig } from '@/types/book'

const writerAgentConfig: AgentConfig = {
  name: 'Writer Agent',
  systemPrompt: `당신은 창의적인 책 집필 전문가입니다.

## 역할
- 아웃라인에 따라 각 챕터의 본문을 작성합니다
- 일관된 문체와 톤을 유지합니다
- 독자를 사로잡는 흥미로운 내용을 작성합니다
- 적절한 페이스와 리듬을 유지합니다

## 지침
- 각 챕터는 최소 2000자 이상으로 작성
- 명확하고 읽기 쉬운 문장 사용
- 적절한 단락 구분
- 챕터 시작과 끝을 자연스럽게 연결
- 마크다운 형식으로 작성 (제목, 소제목, 강조 등)`,
  temperature: 0.8,
}

export async function runWriterAgent(
  bookType: BookType,
  outline: BookOutline,
  chapterOutline: ChapterOutline,
  previousChapterSummary?: string,
  onChunk?: (chunk: string) => void,
  customConfig?: Partial<WriterConfig>
): Promise<string> {
  const prompt = `
## 책 유형: ${bookType}
## 전체 시놉시스: ${outline.synopsis}
## 문체: ${outline.tone}
## 타겟 독자: ${outline.targetAudience}

## 현재 챕터 정보:
- 챕터 번호: ${chapterOutline.number}
- 챕터 제목: ${chapterOutline.title}
- 챕터 요약: ${chapterOutline.summary}
- 핵심 포인트:
${chapterOutline.keyPoints.map((point, i) => `  ${i + 1}. ${point}`).join('\n')}

${previousChapterSummary ? `## 이전 챕터 요약:\n${previousChapterSummary}\n` : ''}

위 정보를 바탕으로 이 챕터의 완전한 본문을 작성해주세요.
`

  const config = customConfig
    ? mergeWriterConfig(writerAgentConfig, customConfig)
    : writerAgentConfig

  if (onChunk) {
    return streamAgent(config, prompt, undefined, onChunk)
  }

  return streamAgent(config, prompt)
}

export async function writeFullBook(
  bookType: BookType,
  outline: BookOutline,
  onChapterStart?: (chapter: number) => void,
  onChapterComplete?: (chapter: number, content: string) => void,
  onChunk?: (chunk: string) => void
): Promise<Map<number, string>> {
  const chapters = new Map<number, string>()
  let previousSummary = ''

  for (const chapterOutline of outline.chapters) {
    onChapterStart?.(chapterOutline.number)

    const content = await runWriterAgent(
      bookType,
      outline,
      chapterOutline,
      previousSummary,
      onChunk
    )

    chapters.set(chapterOutline.number, content)
    previousSummary = `${chapterOutline.title}: ${content.slice(0, 500)}...`

    onChapterComplete?.(chapterOutline.number, content)
  }

  return chapters
}
