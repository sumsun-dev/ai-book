import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, projectOwnerWhere } from '@/lib/auth/auth-utils'
import { handleApiError } from '@/lib/api-utils'
import { z } from 'zod'
import { prisma } from '@/lib/db/client'
import { runAgent } from '@/lib/claude'
import { checkQuota, recordUsage } from '@/lib/token-quota'
import type {
  BookBible,
  FictionBible,
  SelfHelpBible,
} from '@/types/book-bible'
import {
  generateBibleItemId,
  createEmptyBible,
} from '@/types/book-bible'
import { parseJSONFromText, AI_CONTENT_LIMITS } from '@/lib/utils/json-parser'

interface RouteParams {
  params: Promise<{ id: string }>
}

const ExtractSchema = z.object({
  chapterNumber: z.number().int().positive(),
  content: z.string().min(1).max(AI_CONTENT_LIMITS.SCHEMA_MAX),
})

// Fiction 추출 결과 타입
interface FictionExtraction {
  characters: Array<{
    name: string
    role: 'protagonist' | 'antagonist' | 'supporting' | 'minor'
    description: string
    traits: string[]
  }>
  settings: Array<{
    category: 'location' | 'culture' | 'technology' | 'magic' | 'politics' | 'history' | 'other'
    name: string
    description: string
  }>
  plotPoints: Array<{
    description: string
    type: 'main' | 'subplot'
  }>
  foreshadowing: Array<{
    hint: string
    importance: 'major' | 'minor'
  }>
}

// SelfHelp 추출 결과 타입
interface SelfHelpExtraction {
  messages: Array<{
    title: string
    statement: string
    keyPhrases: string[]
  }>
  frameworks: Array<{
    name: string
    description: string
    steps: string[]
  }>
  cases: Array<{
    title: string
    situation: string
    action: string
    result: string
    lesson: string
  }>
}

const FICTION_EXTRACT_PROMPT = `당신은 소설 분석 전문가입니다. 주어진 챕터 내용에서 캐릭터, 세계관 설정, 플롯 포인트, 복선을 추출합니다.

## 추출 항목

1. **캐릭터**: 새로 등장하거나 언급된 인물
   - name: 이름
   - role: protagonist(주인공), antagonist(적대자), supporting(조연), minor(단역)
   - description: 외모, 성격 등 묘사
   - traits: 성격 특성 배열

2. **세계관 설정**: 장소, 문화, 기술, 마법 등
   - category: location, culture, technology, magic, politics, history, other
   - name: 설정 이름
   - description: 설명

3. **플롯 포인트**: 주요 사건이나 전개
   - description: 설명
   - type: main(메인 플롯), subplot(서브 플롯)

4. **복선**: 숨겨진 암시나 힌트
   - hint: 복선 내용
   - importance: major(중요), minor(일반)

## 출력 형식
반드시 JSON 형식으로만 출력하세요. 다른 텍스트 없이 JSON만 출력합니다.

{
  "characters": [...],
  "settings": [...],
  "plotPoints": [...],
  "foreshadowing": [...]
}

항목이 없으면 빈 배열을 반환하세요.`

const SELFHELP_EXTRACT_PROMPT = `당신은 자기계발서 분석 전문가입니다. 주어진 챕터 내용에서 핵심 메시지, 프레임워크, 사례를 추출합니다.

## 추출 항목

1. **핵심 메시지**: 챕터에서 전달하는 주요 주장
   - title: 메시지 제목
   - statement: 핵심 주장
   - keyPhrases: 반복되는 핵심 문구 배열

2. **프레임워크**: 소개된 모델, 방법론, 단계
   - name: 프레임워크 이름
   - description: 설명
   - steps: 단계 배열 (문자열)

3. **사례**: 인용된 사례, 스토리, 예시
   - title: 사례 제목
   - situation: 상황
   - action: 행동
   - result: 결과
   - lesson: 교훈

## 출력 형식
반드시 JSON 형식으로만 출력하세요. 다른 텍스트 없이 JSON만 출력합니다.

{
  "messages": [...],
  "frameworks": [...],
  "cases": [...]
}

항목이 없으면 빈 배열을 반환하세요.`


// POST /api/projects/[id]/bible/extract - 챕터에서 Bible 항목 추출
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { userId, error: authError } = await requireAuth()
    if (authError) return authError

    await checkQuota(userId!)

    const { id } = await params
    const body = await request.json()

    const parseResult = ExtractSchema.safeParse(body)
    if (!parseResult.success) {
      return NextResponse.json(
        { success: false, error: '잘못된 요청입니다.' },
        { status: 400 }
      )
    }

    const { chapterNumber, content } = parseResult.data

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

    // 현재 Bible 파싱
    const bible: BookBible = project.bible
      ? JSON.parse(project.bible)
      : createEmptyBible(project.type)

    const isFiction = project.type === 'fiction'
    const extractPrompt = isFiction ? FICTION_EXTRACT_PROMPT : SELFHELP_EXTRACT_PROMPT

    // AI로 추출
    const agentResult = await runAgent(
      {
        name: 'bible-extractor',
        systemPrompt: extractPrompt,
        temperature: 0.3,
        maxTokens: 4096,
      },
      `다음 챕터 ${chapterNumber}의 내용을 분석하세요:\n\n${content.substring(0, AI_CONTENT_LIMITS.EXTRACT_CONTENT)}`
    )
    const result = agentResult.text
    recordUsage(userId!, 'bible-extractor', agentResult.usage, id).catch(console.error)

    if (isFiction) {
      const extraction = parseJSONFromText<FictionExtraction>(result, {
        characters: [],
        settings: [],
        plotPoints: [],
        foreshadowing: [],
      })

      // 기존 Bible과 비교하여 새로운 항목만 반환
      const fictionBible = bible as FictionBible
      const existingCharNames = new Set(fictionBible.characters.map(c => c.name.toLowerCase()))
      const existingSettingNames = new Set(fictionBible.worldSettings.map(s => s.name.toLowerCase()))

      const newCharacters = extraction.characters.filter(
        c => !existingCharNames.has(c.name.toLowerCase())
      )
      const newSettings = extraction.settings.filter(
        s => !existingSettingNames.has(s.name.toLowerCase())
      )

      return NextResponse.json({
        success: true,
        data: {
          type: 'fiction',
          chapterNumber,
          extracted: {
            characters: newCharacters.map(c => ({
              ...c,
              id: generateBibleItemId(),
              firstAppearance: chapterNumber,
            })),
            settings: newSettings.map(s => ({
              ...s,
              id: generateBibleItemId(),
            })),
            plotPoints: extraction.plotPoints.map(p => ({
              id: generateBibleItemId(),
              name: p.description.substring(0, 50),
              type: p.type,
              description: p.description,
              status: 'developing' as const,
              startChapter: chapterNumber,
            })),
            foreshadowing: extraction.foreshadowing.map(f => ({
              id: generateBibleItemId(),
              hint: f.hint,
              payoff: '',
              status: 'planted' as const,
              importance: f.importance,
              plantedChapter: chapterNumber,
            })),
          },
          existingCount: {
            characters: fictionBible.characters.length,
            settings: fictionBible.worldSettings.length,
          },
        },
      })
    } else {
      const extraction = parseJSONFromText<SelfHelpExtraction>(result, {
        messages: [],
        frameworks: [],
        cases: [],
      })

      const selfHelpBible = bible as SelfHelpBible
      const existingMsgTitles = new Set(selfHelpBible.coreMessages.map(m => m.title.toLowerCase()))
      const existingFwNames = new Set(selfHelpBible.frameworks.map(f => f.name.toLowerCase()))

      const newMessages = extraction.messages.filter(
        m => !existingMsgTitles.has(m.title.toLowerCase())
      )
      const newFrameworks = extraction.frameworks.filter(
        f => !existingFwNames.has(f.name.toLowerCase())
      )

      return NextResponse.json({
        success: true,
        data: {
          type: 'selfhelp',
          chapterNumber,
          extracted: {
            messages: newMessages.map(m => ({
              ...m,
              id: generateBibleItemId(),
              supporting: [],
              chapters: [chapterNumber],
            })),
            frameworks: newFrameworks.map(f => ({
              id: generateBibleItemId(),
              name: f.name,
              description: f.description,
              steps: f.steps.map((s, i) => ({
                order: i + 1,
                name: s,
                description: '',
              })),
              introducedChapter: chapterNumber,
            })),
            cases: extraction.cases.map(c => ({
              id: generateBibleItemId(),
              title: c.title,
              type: 'success' as const,
              subject: '',
              isAnonymous: true,
              situation: c.situation,
              action: c.action,
              result: c.result,
              lesson: c.lesson,
              chapter: chapterNumber,
            })),
          },
          existingCount: {
            messages: selfHelpBible.coreMessages.length,
            frameworks: selfHelpBible.frameworks.length,
          },
        },
      })
    }
  } catch (error) {
    return handleApiError(error, { route: 'projects/[id]/bible/extract', method: 'POST' })
  }
}
