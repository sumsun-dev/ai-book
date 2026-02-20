import { describe, it, expect } from 'vitest'
import { buildBibleContext, parseBibleJson } from './bible-context'
import {
  createMockFictionBible,
  createMockSelfHelpBible,
} from '@/test/fixtures/bible'
import type { BookBible } from '@/types/book-bible'

describe('buildBibleContext', () => {
  describe('null/empty 처리', () => {
    it('null bible은 빈 문자열을 반환한다', () => {
      expect(buildBibleContext(null, { currentChapter: 1 })).toBe('')
    })

    it('알 수 없는 type은 빈 문자열을 반환한다', () => {
      const bible = { type: 'unknown' } as unknown as BookBible
      expect(buildBibleContext(bible, { currentChapter: 1 })).toBe('')
    })
  })

  describe('Fiction Bible', () => {
    it('소설 설정 헤더를 포함한다', () => {
      const bible = createMockFictionBible()
      const result = buildBibleContext(bible, { currentChapter: 1 })
      expect(result).toContain('[Book Bible - 소설 설정]')
    })

    it('스타일 가이드를 포함한다', () => {
      const bible = createMockFictionBible()
      const result = buildBibleContext(bible, { currentChapter: 1 })
      expect(result).toContain('문체 가이드')
      expect(result).toContain('3인칭 제한')
      expect(result).toContain('과거 시제')
      expect(result).toContain('시점 캐릭터: 김주인공')
    })

    it('스타일 규칙을 포함한다', () => {
      const bible = createMockFictionBible()
      const result = buildBibleContext(bible, { currentChapter: 1 })
      expect(result).toContain('짧은 문장 선호')
      expect(result).toContain('특수용어1')
      expect(result).toContain('비속어 금지')
    })

    it('현재 챕터까지 등장한 캐릭터를 필터링한다', () => {
      const bible = createMockFictionBible()
      const result = buildBibleContext(bible, { currentChapter: 1 })
      // protagonist는 항상 포함, char-2는 firstAppearance=2이므로 ch1에선 제외, antagonist는 항상 포함
      expect(result).toContain('김주인공')
      expect(result).toContain('이적대')
    })

    it('캐릭터 별명과 관계를 포함한다', () => {
      const bible = createMockFictionBible()
      const result = buildBibleContext(bible, { currentChapter: 3 })
      expect(result).toContain('조연이')
      expect(result).toContain('박조연(친구)')
    })

    it('세계관 설정을 포함한다', () => {
      const bible = createMockFictionBible()
      const result = buildBibleContext(bible, { currentChapter: 1 })
      expect(result).toContain('테스트 도시')
      expect(result).toContain('장소')
    })

    it('활성 플롯 스레드만 포함한다 (resolved 제외)', () => {
      const bible = createMockFictionBible()
      const result = buildBibleContext(bible, { currentChapter: 3 })
      expect(result).toContain('메인 퀘스트')
      expect(result).not.toContain('서브 플롯')
    })

    it('미해결 복선을 포함한다', () => {
      const bible = createMockFictionBible()
      const result = buildBibleContext(bible, { currentChapter: 2 })
      expect(result).toContain('수수께끼의 편지')
      expect(result).toContain('[중요]')
    })

    it('미래 챕터의 복선은 제외한다', () => {
      const bible = createMockFictionBible()
      const result = buildBibleContext(bible, { currentChapter: 1 })
      // fs-2는 plantedChapter=3이므로 ch1에서는 제외
      expect(result).not.toContain('사소한 단서')
    })

    it('maxContextLength 초과 시 잘라낸다', () => {
      const bible = createMockFictionBible()
      const result = buildBibleContext(bible, {
        currentChapter: 10,
        maxContextLength: 100,
      })
      expect(result).toContain('이하 생략')
    })

    it('스타일 가이드가 없으면 해당 섹션을 건너뛴다', () => {
      const bible = createMockFictionBible({
        styleGuide: undefined as unknown as ReturnType<typeof createMockFictionBible>['styleGuide'],
      })
      const result = buildBibleContext(bible, { currentChapter: 1 })
      expect(result).not.toContain('문체 가이드')
    })
  })

  describe('Fiction 장르별 설정', () => {
    it('판타지 설정을 포함한다', () => {
      const bible = createMockFictionBible({
        subgenre: 'fantasy',
        fantasySettings: {
          magicSystems: [
            {
              id: 'ms-1',
              name: '원소 마법',
              source: '마나',
              ranks: ['1서클', '9서클'],
              elements: ['화염', '빙결'],
              description: '기본 마법 체계',
            },
          ],
          races: [
            {
              id: 'r-1',
              name: '엘프',
              traits: ['장수', '마법 친화'],
              description: '숲의 종족',
            },
          ],
          skills: [],
          powerLevels: [
            { id: 'pl-1', rank: 1, name: '초급', description: '초보자' },
            { id: 'pl-2', rank: 2, name: '중급', description: '중급자' },
          ],
        },
      })
      const result = buildBibleContext(bible, { currentChapter: 1 })
      expect(result).toContain('판타지 설정')
      expect(result).toContain('원소 마법')
      expect(result).toContain('마나')
      expect(result).toContain('엘프')
      expect(result).toContain('초급')
    })

    it('무협 설정을 포함한다', () => {
      const bible = createMockFictionBible({
        subgenre: 'martial-arts',
        martialArtsSettings: {
          factions: [
            {
              id: 'f-1',
              name: '화산파',
              type: 'sect',
              alignment: 'orthodox',
              leader: '장문인',
              description: '정파 문파',
            },
          ],
          techniques: [
            {
              id: 't-1',
              name: '매화검법',
              type: 'sword',
              rank: 'first-class',
              description: '화산파 검법',
              moves: ['일초', '이초'],
            },
          ],
          internalEnergies: [
            {
              id: 'ie-1',
              name: '자하신공',
              type: 'orthodox',
              description: '화산파 내공',
              stages: ['초식', '중식'],
            },
          ],
        },
      })
      const result = buildBibleContext(bible, { currentChapter: 1 })
      expect(result).toContain('무협 설정')
      expect(result).toContain('화산파')
      expect(result).toContain('정파')
      expect(result).toContain('매화검법')
      expect(result).toContain('자하신공')
    })

    it('로맨스 판타지 설정을 포함한다', () => {
      const bible = createMockFictionBible({
        subgenre: 'romance-fantasy',
        romanceFantasySettings: {
          nobleFamilies: [
            {
              id: 'nf-1',
              name: '크로셀 공작가',
              rank: 'duke',
              territory: '북부',
              description: '북부의 대공',
            },
          ],
          relationships: [
            {
              id: 'rel-1',
              character1: '아리아',
              character2: '카엘',
              type: 'romantic',
              stage: 'tension',
              description: '긴장 관계',
            },
          ],
          originalWork: {
            title: '원작 소설',
            currentCharacter: '악녀',
            plotKnowledge: ['미래 전개 1'],
          },
        },
      })
      const result = buildBibleContext(bible, { currentChapter: 1 })
      expect(result).toContain('로맨스 판타지 설정')
      expect(result).toContain('크로셀 공작가')
      expect(result).toContain('공작')
      expect(result).toContain('아리아')
      expect(result).toContain('원작 소설')
    })

    it('헌터물 설정을 포함한다', () => {
      const bible = createMockFictionBible({
        subgenre: 'hunter',
        hunterSettings: {
          hunterRanks: [
            {
              id: 'hr-1',
              rank: 1,
              name: 'S급',
              population: '10명',
              description: '최상위',
            },
          ],
          guilds: [
            {
              id: 'g-1',
              name: '화이트호크',
              rank: 'S',
              leader: '길드장',
              description: '최강 길드',
            },
          ],
          skills: [
            {
              id: 'sk-1',
              name: '그림자 이동',
              rank: '유니크',
              type: 'utility',
              description: '순간이동',
            },
          ],
          gates: [
            {
              id: 'gate-1',
              name: '붉은 게이트',
              rank: 'S',
              type: 'gate',
              boss: '드래곤',
              description: 'S급 게이트',
            },
          ],
        },
      })
      const result = buildBibleContext(bible, { currentChapter: 1 })
      expect(result).toContain('헌터물 설정')
      expect(result).toContain('S급')
      expect(result).toContain('화이트호크')
      expect(result).toContain('그림자 이동')
      expect(result).toContain('붉은 게이트')
    })
  })

  describe('SelfHelp Bible', () => {
    it('자기계발 설정 헤더를 포함한다', () => {
      const bible = createMockSelfHelpBible()
      const result = buildBibleContext(bible, { currentChapter: 1 })
      expect(result).toContain('[Book Bible - 자기계발 설정]')
    })

    it('Voice 가이드를 포함한다', () => {
      const bible = createMockSelfHelpBible()
      const result = buildBibleContext(bible, { currentChapter: 1 })
      expect(result).toContain('음성 가이드')
      expect(result).toContain('친근한')
      expect(result).toContain('20-40대 직장인')
      expect(result).toContain('독자에게 질문하기')
      expect(result).toContain('지나친 전문 용어')
    })

    it('예시 문구를 포함한다 (최대 3개)', () => {
      const bible = createMockSelfHelpBible()
      const result = buildBibleContext(bible, { currentChapter: 1 })
      expect(result).toContain('당신도 할 수 있습니다')
    })

    it('현재 챕터에 관련된 핵심 메시지를 포함한다', () => {
      const bible = createMockSelfHelpBible()
      const result = buildBibleContext(bible, { currentChapter: 1 })
      expect(result).toContain('핵심 메시지 1')
      expect(result).toContain('습관의 힘')
      // cm-2는 chapters가 없으므로 항상 포함
      expect(result).toContain('핵심 메시지 2')
    })

    it('이미 소개된 프레임워크를 포함한다', () => {
      const bible = createMockSelfHelpBible()
      // chapter 3에서 보면 fw-1(introduced=2)은 이미 소개됨
      const result = buildBibleContext(bible, { currentChapter: 3 })
      expect(result).toContain('이미 소개된 프레임워크')
      expect(result).toContain('SMART 목표')
    })

    it('현재 챕터에서 소개할 프레임워크를 포함한다', () => {
      const bible = createMockSelfHelpBible()
      const result = buildBibleContext(bible, { currentChapter: 2 })
      expect(result).toContain('이 챕터에서 소개할 프레임워크')
      expect(result).toContain('SMART')
      expect(result).toContain('Specific')
    })

    it('현재 챕터의 사례를 포함한다', () => {
      const bible = createMockSelfHelpBible()
      const result = buildBibleContext(bible, { currentChapter: 3 })
      expect(result).toContain('이 챕터의 사례')
      expect(result).toContain('성공 사례')
      expect(result).toContain('홍길동')
    })

    it('다른 챕터의 사례는 제외한다', () => {
      const bible = createMockSelfHelpBible()
      const result = buildBibleContext(bible, { currentChapter: 1 })
      expect(result).not.toContain('홍길동')
    })

    it('현재 챕터에서 인용할 증거를 포함한다', () => {
      const bible = createMockSelfHelpBible()
      const result = buildBibleContext(bible, { currentChapter: 1 })
      expect(result).toContain('인용할 증거')
      expect(result).toContain('습관 연구')
      expect(result).toContain('2020')
    })

    it('maxContextLength 초과 시 잘라낸다', () => {
      const bible = createMockSelfHelpBible()
      const result = buildBibleContext(bible, {
        currentChapter: 3,
        maxContextLength: 50,
      })
      expect(result).toContain('이하 생략')
    })

    it('voiceGuide가 없으면 해당 섹션을 건너뛴다', () => {
      const bible = createMockSelfHelpBible({
        voiceGuide: undefined as unknown as ReturnType<typeof createMockSelfHelpBible>['voiceGuide'],
      })
      const result = buildBibleContext(bible, { currentChapter: 1 })
      expect(result).not.toContain('음성 가이드')
    })
  })
})

describe('parseBibleJson', () => {
  it('유효한 JSON을 파싱한다', () => {
    const bible = createMockFictionBible()
    const json = JSON.stringify(bible)
    const result = parseBibleJson(json)
    expect(result).toBeDefined()
    expect(result!.type).toBe('fiction')
  })

  it('null을 반환한다 (null 입력)', () => {
    expect(parseBibleJson(null)).toBeNull()
  })

  it('null을 반환한다 (무효 JSON)', () => {
    expect(parseBibleJson('not json')).toBeNull()
  })

  it('빈 문자열은 null을 반환한다', () => {
    expect(parseBibleJson('')).toBeNull()
  })
})
