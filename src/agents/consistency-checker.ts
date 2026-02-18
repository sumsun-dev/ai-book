import { runAgent, AgentConfig } from '@/lib/claude'
import { ConsistencyIssue, ConsistencyReport } from '@/types/book'

interface ChapterData {
  number: number
  title: string
  content: string
}

const consistencyAgentConfig: AgentConfig = {
  name: 'Consistency Checker',
  systemPrompt: `당신은 전문 교정 편집자입니다. 여러 챕터의 내용을 교차 검증하여 일관성 문제를 찾습니다.

## 검사 항목
1. **character_name**: 캐릭터 이름 불일치 (다른 표기, 오타)
2. **character_trait**: 캐릭터 특성 모순 (성격, 외모, 능력 변화)
3. **timeline**: 타임라인 불일치 (시간 순서 오류, 날짜 모순)
4. **setting**: 배경 설정 모순 (장소, 환경 불일치)
5. **plot**: 플롯 모순 (사건 순서, 인과관계 오류)
6. **style**: 문체 불일치 (톤, 시점, 표현 방식 급변)

## 심각도
- **error**: 독자가 혼란을 느낄 명백한 모순
- **warning**: 주의가 필요한 불일치
- **info**: 개선하면 좋을 사소한 점

## 출력 형식 (반드시 유효한 JSON)
{
  "issues": [
    {
      "type": "character_name",
      "severity": "error",
      "chapterA": 1,
      "chapterB": 3,
      "title": "간단한 문제 제목",
      "description": "상세 설명",
      "suggestion": "수정 제안"
    }
  ],
  "summary": "전체 검사 요약 (1-2문장)"
}

발견된 문제가 없으면 빈 issues 배열을 반환하세요.
실제 문제만 보고하고, 추측이나 가능성만으로 문제를 만들지 마세요.`,
  temperature: 0.2,
}

function truncateChapter(content: string, maxChars: number = 2000): string {
  if (content.length <= maxChars) return content
  const half = Math.floor(maxChars / 2)
  return content.slice(0, half) + '\n\n[...중략...]\n\n' + content.slice(-half)
}

function buildChapterContext(chapters: ChapterData[]): string {
  return chapters
    .map((ch) => {
      const truncated = truncateChapter(ch.content)
      return `## 챕터 ${ch.number}: ${ch.title}\n${truncated}`
    })
    .join('\n\n---\n\n')
}

export async function runConsistencyCheck(
  chapters: ChapterData[]
): Promise<ConsistencyReport> {
  if (chapters.length < 2) {
    return {
      issues: [],
      checkedAt: new Date(),
      chapterCount: chapters.length,
      summary: '검사할 챕터가 2개 미만입니다.',
    }
  }

  // 슬라이딩 윈도우: 10챕터 초과 시 분할 검사
  const windowSize = 10
  const allIssues: ConsistencyIssue[] = []
  let summaries: string[] = []

  for (let i = 0; i < chapters.length; i += windowSize - 2) {
    const window = chapters.slice(i, i + windowSize)
    if (window.length < 2) break

    const context = buildChapterContext(window)
    const prompt = `다음 챕터들의 내용을 교차 검증하여 일관성 문제를 찾아주세요.

${context}

JSON 형식으로 응답해주세요.`

    const response = await runAgent(consistencyAgentConfig, prompt)

    try {
      let jsonStr = ''

      // 1. 마크다운 코드블록 시도
      const codeBlockMatch = response.match(/```json\s*([\s\S]*?)\s*```/)
      if (codeBlockMatch?.[1]) {
        jsonStr = codeBlockMatch[1]
      } else {
        // 2. 중괄호 매칭으로 첫 번째 유효한 JSON 객체 추출
        let braceCount = 0
        let startIdx = -1
        for (let i = 0; i < response.length; i++) {
          if (response[i] === '{') {
            if (braceCount === 0) startIdx = i
            braceCount++
          } else if (response[i] === '}') {
            braceCount--
            if (braceCount === 0 && startIdx !== -1) {
              jsonStr = response.slice(startIdx, i + 1)
              break
            }
          }
        }
        if (!jsonStr) jsonStr = response
      }

      const parsed = JSON.parse(jsonStr)

      if (parsed.issues && Array.isArray(parsed.issues)) {
        allIssues.push(...parsed.issues)
      }
      if (parsed.summary) {
        summaries.push(parsed.summary)
      }
    } catch {
      // 파싱 실패 시 무시
    }
  }

  // 중복 제거 (같은 챕터 쌍, 같은 타입)
  const uniqueIssues = allIssues.filter((issue, index, self) =>
    index === self.findIndex(
      (t) =>
        t.type === issue.type &&
        t.chapterA === issue.chapterA &&
        t.chapterB === issue.chapterB &&
        t.title === issue.title
    )
  )

  return {
    issues: uniqueIssues,
    checkedAt: new Date(),
    chapterCount: chapters.length,
    summary: summaries.join(' ') || (uniqueIssues.length === 0
      ? '일관성 문제가 발견되지 않았습니다.'
      : `${uniqueIssues.length}개의 일관성 문제가 발견되었습니다.`),
  }
}
