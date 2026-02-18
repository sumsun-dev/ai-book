export const TEST_USER = {
  email: 'e2e-test@example.com',
  password: 'TestPassword123!',
  name: 'E2E Tester',
} as const

export const TEST_USER_2 = {
  email: 'e2e-other@example.com',
  password: 'OtherPassword123!',
  name: 'Other User',
} as const

export const TEST_PROJECT = {
  title: 'E2E 테스트 프로젝트',
  bookType: 'fiction' as const,
  description: 'E2E 테스트를 위한 소설 프로젝트',
} as const

export const MOCK_RESEARCH_QUESTIONS = [
  {
    id: 'q1',
    question: '이 이야기의 주인공은 어떤 인물인가요?',
    category: 'character',
  },
  {
    id: 'q2',
    question: '이야기의 배경은 어디인가요?',
    category: 'setting',
  },
  {
    id: 'q3',
    question: '핵심 갈등은 무엇인가요?',
    category: 'conflict',
  },
]

export const MOCK_RESEARCH_SUMMARY = `
<h2>책 계획 요약</h2>
<p>이 소설은 미래 도시를 배경으로 한 SF 스릴러입니다.</p>
<h3>주요 캐릭터</h3>
<ul>
<li>주인공: AI 연구원</li>
<li>조력자: 해커</li>
</ul>
<h3>핵심 갈등</h3>
<p>인공지능이 자의식을 가지게 되면서 발생하는 윤리적 딜레마</p>
`

export const MOCK_OUTLINE = {
  synopsis: 'AI가 자의식을 갖게 되는 미래 세계의 이야기',
  chapters: [
    {
      number: 1,
      title: '시작',
      summary: '주인공이 AI 연구소에서 일하는 일상을 소개',
      keyPoints: ['캐릭터 소개', '세계관 설정'],
      sections: [],
    },
    {
      number: 2,
      title: '발견',
      summary: 'AI의 이상 행동 발견',
      keyPoints: ['갈등 시작', '미스터리 제기'],
      sections: [],
    },
    {
      number: 3,
      title: '결말',
      summary: '최종 결론과 해결',
      keyPoints: ['클라이맥스', '해결'],
      sections: [],
    },
  ],
}

export const MOCK_CHAPTER_CONTENT = `
<h2>제1장: 시작</h2>
<p>도시의 불빛이 밤하늘을 물들였다. 연구소의 창문 너머로 보이는 네온사인은 마치 미래를 예고하는 듯했다.</p>
<p>김민수 박사는 모니터 앞에 앉아 데이터를 분석하고 있었다. 그의 앞에 놓인 화면에는 인공지능 '아리아'의 행동 패턴이 그래프로 표시되고 있었다.</p>
<p>"이상해... 이 패턴은 예상과 다르잖아."</p>
<p>그는 안경을 고쳐 쓰며 중얼거렸다. 3년간 개발해온 아리아가 최근 들어 예측할 수 없는 응답을 보이기 시작했다.</p>
`

export const MOCK_EDIT_SUGGESTIONS = [
  {
    id: 'sug-1',
    type: 'grammar',
    severity: 'minor' as const,
    originalText: '이상해... 이 패턴은',
    suggestedText: '이상하다... 이 패턴은',
    reason: '문어체와 구어체의 일관성을 위해 수정',
    status: 'pending' as const,
  },
  {
    id: 'sug-2',
    type: 'style',
    severity: 'moderate' as const,
    originalText: '중얼거렸다',
    suggestedText: '혼잣말을 했다',
    reason: '서술 스타일 통일',
    status: 'pending' as const,
  },
]

export const MOCK_EVALUATION = {
  coherence: 8.5,
  engagement: 7.8,
  clarity: 9.0,
  originality: 7.5,
  targetFit: 8.2,
  feedback: '전반적으로 잘 작성된 원고입니다. 캐릭터 개발이 잘 되어 있으며, 플롯의 흐름이 자연스럽습니다.',
}

export const MOCK_STREAM_RESPONSE = `제1장: 시작

도시의 불빛이 밤하늘을 물들였다.

연구소의 창문 너머로 보이는 네온사인은 마치 미래를 예고하는 듯했다.`
