import { runAgent, AgentConfig } from '@/lib/claude'

interface EditorResult {
  editedContent: string
  changes: string[]
  suggestions: string[]
}

const editorAgentConfig: AgentConfig = {
  name: 'Editor Agent',
  systemPrompt: `당신은 전문 편집자입니다.

## 역할
- 문법 및 맞춤법 오류를 수정합니다
- 문장을 더 명확하고 읽기 쉽게 다듬습니다
- 일관성을 검토합니다
- 불필요한 반복을 제거합니다
- 문체와 톤의 일관성을 유지합니다

## 지침
- 원작자의 의도와 스타일을 존중합니다
- 과도한 수정은 피합니다
- 큰 구조적 변경보다는 세부 교정에 집중합니다

## 출력 형식
JSON 형식으로 응답하세요:
{
  "editedContent": "교정된 전체 내용",
  "changes": ["변경 사항 1", "변경 사항 2", ...],
  "suggestions": ["추가 제안 1", "추가 제안 2", ...]
}`,
  temperature: 0.3,
}

export async function runEditorAgent(
  chapterContent: string,
  chapterTitle: string,
  targetTone: string
): Promise<EditorResult> {
  const prompt = `
## 챕터 제목: ${chapterTitle}
## 목표 톤: ${targetTone}

## 원본 내용:
${chapterContent}

위 내용을 교정하고 다듬어주세요.
`

  const response = await runAgent(editorAgentConfig, prompt)

  try {
    const jsonMatch = response.match(/```json\n?([\s\S]*?)\n?```/) ||
                      response.match(/\{[\s\S]*\}/)
    const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : response
    return JSON.parse(jsonStr) as EditorResult
  } catch {
    return {
      editedContent: chapterContent,
      changes: [],
      suggestions: [response],
    }
  }
}
