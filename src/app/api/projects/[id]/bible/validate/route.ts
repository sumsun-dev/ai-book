import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, projectOwnerWhere } from '@/lib/auth/auth-utils'
import { handleApiError } from '@/lib/api-utils'
import { z } from 'zod'
import { prisma } from '@/lib/db/client'
import { runAgent } from '@/lib/claude'
import { checkQuota, recordUsage } from '@/lib/token-quota'
import type { BookBible, FictionBible, SelfHelpBible } from '@/types/book-bible'
import { isFictionBible } from '@/types/book-bible'
import { parseJSONFromText, AI_CONTENT_LIMITS } from '@/lib/utils/json-parser'

interface RouteParams {
  params: Promise<{ id: string }>
}

const ValidateSchema = z.object({
  content: z.string().min(1).max(AI_CONTENT_LIMITS.SCHEMA_MAX),
  chapterNumber: z.number().int().positive().optional(),
})

interface ValidationIssue {
  type: 'character' | 'setting' | 'plot' | 'style' | 'message' | 'framework' | 'tone'
  severity: 'error' | 'warning' | 'info'
  title: string
  description: string
  suggestion?: string
}

interface ValidationResult {
  isValid: boolean
  issues: ValidationIssue[]
  summary: string
}

function buildFictionValidationContext(bible: FictionBible): string {
  const sections: string[] = []

  // 캐릭터 정보
  if (bible.characters.length > 0) {
    let charText = '## 등장인물\n'
    bible.characters.forEach(c => {
      charText += `- **${c.name}**: ${c.description}`
      if (c.traits && c.traits.length > 0) {
        charText += ` (특성: ${c.traits.join(', ')})`
      }
      charText += '\n'
    })
    sections.push(charText)
  }

  // 세계관 설정
  if (bible.worldSettings.length > 0) {
    let settingText = '## 세계관/설정\n'
    bible.worldSettings.forEach(s => {
      settingText += `- **${s.name}**: ${s.description}\n`
    })
    sections.push(settingText)
  }

  // 문체 가이드
  if (bible.styleGuide) {
    const style = bible.styleGuide
    let styleText = '## 문체 가이드\n'
    const povMap: Record<string, string> = {
      'first': '1인칭',
      'third-limited': '3인칭 제한',
      'third-omniscient': '3인칭 전지',
      'second': '2인칭',
    }
    styleText += `- 시점: ${povMap[style.pov] || style.pov}\n`
    styleText += `- 시제: ${style.tense === 'past' ? '과거' : '현재'}\n`
    if (style.rules && style.rules.length > 0) {
      styleText += `- 규칙: ${style.rules.join(', ')}\n`
    }
    if (style.prohibitions && style.prohibitions.length > 0) {
      styleText += `- 금지: ${style.prohibitions.join(', ')}\n`
    }
    sections.push(styleText)
  }

  return sections.join('\n')
}

function buildSelfHelpValidationContext(bible: SelfHelpBible): string {
  const sections: string[] = []

  // 핵심 메시지
  if (bible.coreMessages.length > 0) {
    let msgText = '## 핵심 메시지\n'
    bible.coreMessages.forEach(m => {
      msgText += `- **${m.title}**: ${m.statement}\n`
      if (m.keyPhrases && m.keyPhrases.length > 0) {
        msgText += `  핵심 문구: "${m.keyPhrases.join('", "')}"\n`
      }
    })
    sections.push(msgText)
  }

  // 프레임워크
  if (bible.frameworks.length > 0) {
    let fwText = '## 프레임워크\n'
    bible.frameworks.forEach(f => {
      fwText += `- **${f.name}**: ${f.description}\n`
    })
    sections.push(fwText)
  }

  // 음성 가이드
  if (bible.voiceGuide) {
    const voice = bible.voiceGuide
    let voiceText = '## 음성 가이드\n'
    const toneMap: Record<string, string> = {
      'authoritative': '권위 있는',
      'friendly': '친근한',
      'inspirational': '영감을 주는',
      'conversational': '대화체',
      'academic': '학술적',
    }
    voiceText += `- 톤: ${toneMap[voice.tone] || voice.tone}\n`
    if (voice.doList && voice.doList.length > 0) {
      voiceText += `- 권장: ${voice.doList.join(', ')}\n`
    }
    if (voice.dontList && voice.dontList.length > 0) {
      voiceText += `- 금지: ${voice.dontList.join(', ')}\n`
    }
    sections.push(voiceText)
  }

  return sections.join('\n')
}

const FICTION_VALIDATE_PROMPT = `당신은 소설 편집자입니다. 주어진 내용이 Book Bible(설정집)과 일치하는지 검증합니다.

## 검증 항목

1. **캐릭터 일관성**: 이름, 성격, 특성이 Bible과 일치하는가?
2. **세계관 일관성**: 설정, 장소, 규칙이 Bible과 모순되지 않는가?
3. **문체 일관성**: 시점, 시제, 문체 규칙을 따르는가?

## 출력 형식
반드시 JSON 형식으로만 출력하세요.

{
  "isValid": true/false,
  "issues": [
    {
      "type": "character" | "setting" | "plot" | "style",
      "severity": "error" | "warning" | "info",
      "title": "문제 제목",
      "description": "상세 설명",
      "suggestion": "수정 제안 (선택)"
    }
  ],
  "summary": "전체 요약 (1-2문장)"
}

문제가 없으면 isValid: true와 빈 issues 배열을 반환하세요.`

const SELFHELP_VALIDATE_PROMPT = `당신은 자기계발서 편집자입니다. 주어진 내용이 Book Bible(설정집)과 일치하는지 검증합니다.

## 검증 항목

1. **메시지 일관성**: 핵심 메시지와 일치하는 톤인가?
2. **프레임워크 일관성**: 이미 소개된 프레임워크를 올바르게 참조하는가?
3. **음성 일관성**: 권장/금지 스타일을 따르는가?

## 출력 형식
반드시 JSON 형식으로만 출력하세요.

{
  "isValid": true/false,
  "issues": [
    {
      "type": "message" | "framework" | "tone",
      "severity": "error" | "warning" | "info",
      "title": "문제 제목",
      "description": "상세 설명",
      "suggestion": "수정 제안 (선택)"
    }
  ],
  "summary": "전체 요약 (1-2문장)"
}

문제가 없으면 isValid: true와 빈 issues 배열을 반환하세요.`


// POST /api/projects/[id]/bible/validate - 내용과 Bible 일관성 검증
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { userId, error: authError } = await requireAuth()
    if (authError) return authError

    await checkQuota(userId!)

    const { id } = await params
    const body = await request.json()

    const parseResult = ValidateSchema.safeParse(body)
    if (!parseResult.success) {
      return NextResponse.json(
        { success: false, error: '잘못된 요청입니다.' },
        { status: 400 }
      )
    }

    const { content } = parseResult.data

    // 프로젝트 조회
    const project = await prisma.project.findFirst({
      where: projectOwnerWhere(id, userId!),
      select: { id: true, type: true, bible: true },
    })

    if (!project) {
      return NextResponse.json(
        { success: false, error: '프로젝트를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // Bible이 없거나 비어있으면 검증 스킵
    if (!project.bible) {
      return NextResponse.json({
        success: true,
        data: {
          isValid: true,
          issues: [],
          summary: 'Bible이 설정되지 않아 검증을 건너뜁니다.',
        },
      })
    }

    const bible: BookBible = JSON.parse(project.bible)
    const isFiction = isFictionBible(bible)

    // Bible 컨텍스트 생성
    const bibleContext = isFiction
      ? buildFictionValidationContext(bible)
      : buildSelfHelpValidationContext(bible as SelfHelpBible)

    // Bible이 비어있으면 검증 스킵
    if (!bibleContext.trim()) {
      return NextResponse.json({
        success: true,
        data: {
          isValid: true,
          issues: [],
          summary: 'Bible에 설정된 항목이 없어 검증을 건너뜁니다.',
        },
      })
    }

    const validatePrompt = isFiction ? FICTION_VALIDATE_PROMPT : SELFHELP_VALIDATE_PROMPT

    // AI로 검증
    const agentResult = await runAgent(
      {
        name: 'bible-validator',
        systemPrompt: validatePrompt,
        temperature: 0.2,
        maxTokens: 2048,
      },
      `## Book Bible 설정\n${bibleContext}\n\n## 검증할 내용\n${content.substring(0, AI_CONTENT_LIMITS.VALIDATE_CONTENT)}`
    )

    const validation = parseJSONFromText<ValidationResult>(agentResult.text, {
      isValid: true,
      issues: [],
      summary: '검증을 완료할 수 없습니다.',
    })
    recordUsage(userId!, 'bible-validator', agentResult.usage, id).catch(console.error)

    return NextResponse.json({
      success: true,
      data: validation,
    })
  } catch (error) {
    return handleApiError(error, { route: 'projects/[id]/bible/validate', method: 'POST' })
  }
}
