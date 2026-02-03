// ===== Book Bible Types =====
// 장편 책 작성 시 AI의 일관성을 유지하기 위한 컨텍스트 데이터베이스

export type BibleType = 'fiction' | 'selfhelp'

// ===== 공통 타입 =====

export interface BibleBase {
  type: BibleType
  version: number
  createdAt: string
  updatedAt: string
}

// ===== Fiction Bible (소설) =====

export interface FictionCharacter {
  id: string
  name: string
  aliases?: string[]              // 별명, 호칭
  role: 'protagonist' | 'antagonist' | 'supporting' | 'minor'
  description: string             // 외모, 성격 등
  background?: string             // 배경 스토리
  traits: string[]                // 성격 특성
  relationships?: CharacterRelationship[]
  firstAppearance?: number        // 첫 등장 챕터
  arc?: string                    // 캐릭터 아크
  notes?: string
}

export interface CharacterRelationship {
  characterId: string
  characterName: string
  type: string                    // 친구, 적, 가족, 연인 등
  description?: string
}

export interface WorldSetting {
  id: string
  category: 'location' | 'culture' | 'technology' | 'magic' | 'politics' | 'history' | 'other'
  name: string
  description: string
  details?: string
  relatedCharacters?: string[]    // 연관 캐릭터 ID
  notes?: string
}

export interface PlotThread {
  id: string
  name: string
  type: 'main' | 'subplot' | 'backstory'
  description: string
  status: 'setup' | 'developing' | 'climax' | 'resolved'
  startChapter?: number
  endChapter?: number
  relatedCharacters?: string[]
  notes?: string
}

export interface Foreshadowing {
  id: string
  hint: string                    // 복선 내용
  payoff: string                  // 회수 내용
  plantedChapter?: number         // 복선 설치 챕터
  resolvedChapter?: number        // 회수 챕터
  status: 'planted' | 'resolved' | 'abandoned'
  importance: 'major' | 'minor'
  notes?: string
}

export interface TimelineEvent {
  id: string
  date: string                    // 스토리 내 시간
  event: string
  chapter?: number
  characters?: string[]
  notes?: string
}

export interface FictionStyleGuide {
  pov: 'first' | 'third-limited' | 'third-omniscient' | 'second'
  povCharacter?: string           // 1인칭/3인칭 제한의 경우 시점 캐릭터
  tense: 'past' | 'present'
  rules: string[]                 // 스타일 규칙
  vocabulary?: string[]           // 특수 용어
  prohibitions?: string[]         // 금지 사항
}

export interface FictionBible extends BibleBase {
  type: 'fiction'
  characters: FictionCharacter[]
  worldSettings: WorldSetting[]
  plotThreads: PlotThread[]
  foreshadowing: Foreshadowing[]
  timeline: TimelineEvent[]
  styleGuide: FictionStyleGuide
}

// ===== SelfHelp Bible (자기계발) =====

export interface CoreMessage {
  id: string
  title: string                   // 핵심 메시지 제목
  statement: string               // 핵심 주장
  supporting: string[]            // 뒷받침 논거
  keyPhrases: string[]            // 반복할 핵심 문구
  chapters?: number[]             // 관련 챕터들
}

export interface Framework {
  id: string
  name: string                    // 프레임워크 이름
  acronym?: string                // 약어 (예: SMART)
  description: string
  steps: FrameworkStep[]
  visualType?: 'pyramid' | 'cycle' | 'matrix' | 'list' | 'flow'
  introducedChapter?: number
  usedInChapters?: number[]
}

export interface FrameworkStep {
  order: number
  name: string
  description: string
  example?: string
}

export interface CaseStudy {
  id: string
  title: string
  type: 'success' | 'failure' | 'transformation' | 'comparison'
  subject: string                 // 주인공 (익명 또는 실명)
  isAnonymous: boolean
  situation: string               // 상황
  action: string                  // 행동
  result: string                  // 결과
  lesson: string                  // 교훈
  chapter?: number
  relatedFramework?: string       // 연관 프레임워크 ID
}

export interface Evidence {
  id: string
  type: 'research' | 'statistics' | 'quote' | 'expert' | 'historical'
  title: string
  source: string                  // 출처
  year?: number
  description: string
  citation?: string               // 인용 형식
  usedInChapters?: number[]
}

export interface ActionTool {
  id: string
  name: string
  type: 'exercise' | 'checklist' | 'template' | 'worksheet' | 'habit'
  description: string
  instructions: string[]
  chapter?: number
  relatedFramework?: string
}

export interface SelfHelpVoiceGuide {
  tone: 'authoritative' | 'friendly' | 'inspirational' | 'conversational' | 'academic'
  doList: string[]                // 권장 스타일
  dontList: string[]              // 금지 스타일
  examplePhrases?: string[]       // 예시 문구
  targetReader?: string           // 독자 페르소나
}

export interface SelfHelpBible extends BibleBase {
  type: 'selfhelp'
  coreMessages: CoreMessage[]
  frameworks: Framework[]
  caseStudies: CaseStudy[]
  evidences: Evidence[]
  actionTools: ActionTool[]
  voiceGuide: SelfHelpVoiceGuide
}

// ===== Union Type =====

export type BookBible = FictionBible | SelfHelpBible

// ===== Factory Functions =====

export function createEmptyFictionBible(): FictionBible {
  const now = new Date().toISOString()
  return {
    type: 'fiction',
    version: 1,
    createdAt: now,
    updatedAt: now,
    characters: [],
    worldSettings: [],
    plotThreads: [],
    foreshadowing: [],
    timeline: [],
    styleGuide: {
      pov: 'third-limited',
      tense: 'past',
      rules: [],
    },
  }
}

export function createEmptySelfHelpBible(): SelfHelpBible {
  const now = new Date().toISOString()
  return {
    type: 'selfhelp',
    version: 1,
    createdAt: now,
    updatedAt: now,
    coreMessages: [],
    frameworks: [],
    caseStudies: [],
    evidences: [],
    actionTools: [],
    voiceGuide: {
      tone: 'friendly',
      doList: [],
      dontList: [],
    },
  }
}

export function createEmptyBible(bookType: string): BookBible {
  if (bookType === 'fiction') {
    return createEmptyFictionBible()
  }
  return createEmptySelfHelpBible()
}

// ===== Type Guards =====

export function isFictionBible(bible: BookBible): bible is FictionBible {
  return bible.type === 'fiction'
}

export function isSelfHelpBible(bible: BookBible): bible is SelfHelpBible {
  return bible.type === 'selfhelp'
}

// ===== ID Generator =====

export function generateBibleItemId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}
