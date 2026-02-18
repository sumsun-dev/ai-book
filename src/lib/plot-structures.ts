import { PlotStructureType, BookType } from '@/types/book'

export interface PlotStructure {
  id: PlotStructureType
  applicableGenres: BookType[]
  beats: PlotBeat[]
  promptGuide: string
}

export interface PlotBeat {
  name: string
  description: string
  percentage: number // 전체 분량 대비 비율 (0-100)
}

export const PLOT_STRUCTURES: Record<PlotStructureType, PlotStructure> = {
  three_act: {
    id: 'three_act',
    applicableGenres: ['fiction', 'children'],
    beats: [
      { name: '1막: 설정', description: '세계관, 인물, 갈등의 씨앗 소개', percentage: 25 },
      { name: '2막: 대립', description: '갈등 심화, 시련과 장애물', percentage: 50 },
      { name: '3막: 해결', description: '클라이맥스와 결말', percentage: 25 },
    ],
    promptGuide: `3막 구조를 따라 목차를 구성하세요:
- 1막 (전체의 25%): 설정 - 주인공과 세계관 소개, 일상, 사건의 발단
- 2막 (전체의 50%): 대립 - 갈등 심화, 시련, 중간점 반전, 위기 고조
- 3막 (전체의 25%): 해결 - 클라이맥스, 갈등 해소, 여운
챕터는 자연스럽게 이 비율에 맞춰 배분하세요.`,
  },

  heros_journey: {
    id: 'heros_journey',
    applicableGenres: ['fiction'],
    beats: [
      { name: '일상 세계', description: '영웅의 평범한 일상', percentage: 8 },
      { name: '모험의 부름', description: '변화를 요구하는 사건 발생', percentage: 8 },
      { name: '부름의 거부', description: '영웅의 망설임', percentage: 5 },
      { name: '멘토와의 만남', description: '조력자 등장', percentage: 5 },
      { name: '첫 번째 관문', description: '모험의 세계로 진입', percentage: 8 },
      { name: '시련, 동맹, 적', description: '새로운 세계에서의 경험', percentage: 16 },
      { name: '동굴 가장 깊은 곳', description: '가장 큰 위험에 접근', percentage: 10 },
      { name: '시련', description: '생사를 건 대결', percentage: 10 },
      { name: '보상', description: '승리 또는 깨달음', percentage: 8 },
      { name: '귀환의 길', description: '일상으로 돌아가는 여정', percentage: 8 },
      { name: '부활', description: '최종 시험', percentage: 8 },
      { name: '영약을 가지고 귀환', description: '변화된 영웅의 귀환', percentage: 6 },
    ],
    promptGuide: `영웅의 여정(Hero's Journey) 12단계를 따라 목차를 구성하세요:
1. 일상 세계 → 2. 모험의 부름 → 3. 부름의 거부 → 4. 멘토와의 만남
5. 첫 번째 관문 → 6. 시련, 동맹, 적 → 7. 동굴 가장 깊은 곳 → 8. 시련
9. 보상 → 10. 귀환의 길 → 11. 부활 → 12. 영약을 가지고 귀환
각 단계를 1-2개 챕터로 구성하되, 6단계(시련, 동맹, 적)는 여러 챕터에 걸쳐 전개하세요.`,
  },

  save_the_cat: {
    id: 'save_the_cat',
    applicableGenres: ['fiction'],
    beats: [
      { name: '오프닝 이미지', description: '이야기의 첫인상', percentage: 3 },
      { name: '테마 제시', description: '작품의 주제 암시', percentage: 5 },
      { name: '설정', description: '일상과 인물 소개', percentage: 8 },
      { name: '촉매', description: '변화의 시작', percentage: 5 },
      { name: '토론', description: '주인공의 갈등과 선택', percentage: 8 },
      { name: '2막 진입', description: '새로운 세계로 진입', percentage: 5 },
      { name: 'B 스토리', description: '사랑/우정 서브플롯', percentage: 5 },
      { name: '재미와 게임', description: '이야기의 약속 이행', percentage: 15 },
      { name: '미드포인트', description: '가짜 승리 또는 가짜 패배', percentage: 5 },
      { name: '악당의 반격', description: '적대 세력의 강화', percentage: 12 },
      { name: '모든 것을 잃다', description: '최악의 순간', percentage: 5 },
      { name: '영혼의 어둠 밤', description: '절망과 성찰', percentage: 5 },
      { name: '3막 진입', description: '해결의 실마리', percentage: 3 },
      { name: '피날레', description: '클라이맥스와 해결', percentage: 10 },
      { name: '마지막 이미지', description: '변화를 보여주는 마무리', percentage: 3 },
    ],
    promptGuide: `Save the Cat! 15 비트 구조를 따라 목차를 구성하세요:
오프닝 이미지 → 테마 제시 → 설정 → 촉매 → 토론 → 2막 진입 → B 스토리 →
재미와 게임 → 미드포인트 → 악당의 반격 → 모든 것을 잃다 → 영혼의 어둠 밤 →
3막 진입 → 피날레 → 마지막 이미지
비트들을 자연스럽게 챕터로 묶되, '재미와 게임'과 '악당의 반격'은 여러 챕터에 걸쳐 전개하세요.`,
  },

  kishotenketsu: {
    id: 'kishotenketsu',
    applicableGenres: ['fiction', 'children', 'essay'],
    beats: [
      { name: '기 (起)', description: '도입 - 배경과 인물 소개', percentage: 25 },
      { name: '승 (承)', description: '전개 - 이야기 발전', percentage: 25 },
      { name: '전 (轉)', description: '전환 - 예상 밖의 전개', percentage: 25 },
      { name: '결 (結)', description: '결말 - 마무리와 여운', percentage: 25 },
    ],
    promptGuide: `기승전결 구조를 따라 목차를 구성하세요:
- 기(起, 25%): 도입 - 이야기의 배경, 인물, 상황을 자연스럽게 소개
- 승(承, 25%): 전개 - 기의 흐름을 이어받아 이야기를 발전시킴
- 전(轉, 25%): 전환 - 예상치 못한 전개, 새로운 관점이나 사건으로 전환
- 결(結, 25%): 결말 - 전체를 아우르며 마무리, 여운을 남김
갈등 없이도 이야기가 성립하는 것이 기승전결의 특징입니다.`,
  },

  fichtean_curve: {
    id: 'fichtean_curve',
    applicableGenres: ['fiction'],
    beats: [
      { name: '위기 1', description: '즉각적인 위기로 시작', percentage: 15 },
      { name: '상승 행동 1', description: '첫 번째 긴장 고조', percentage: 15 },
      { name: '위기 2', description: '두 번째 위기', percentage: 15 },
      { name: '상승 행동 2', description: '긴장의 지속적 상승', percentage: 15 },
      { name: '위기 3', description: '세 번째, 가장 큰 위기', percentage: 15 },
      { name: '클라이맥스', description: '최고 긴장의 정점', percentage: 15 },
      { name: '하강 행동', description: '해소와 마무리', percentage: 10 },
    ],
    promptGuide: `피히테 곡선(Fichtean Curve)을 따라 목차를 구성하세요:
- 서론 없이 즉각적인 위기로 이야기를 시작합니다
- 여러 위기를 거치며 긴장감을 점진적으로 고조시킵니다
- 각 위기 사이에 배경 설명을 자연스럽게 삽입합니다
- 마지막 위기가 클라이맥스로 이어지며, 짧은 해소로 마무리합니다
챕터마다 최소 하나의 위기나 긴장 요소를 포함하세요.`,
  },

  none: {
    id: 'none',
    applicableGenres: ['fiction', 'nonfiction', 'selfhelp', 'technical', 'essay', 'children', 'poetry'],
    beats: [],
    promptGuide: '',
  },
}

export function getApplicableStructures(bookType: BookType): PlotStructure[] {
  return Object.values(PLOT_STRUCTURES).filter(
    (s) => s.applicableGenres.includes(bookType)
  )
}

export function isPlotStructureApplicable(bookType: BookType): boolean {
  return ['fiction', 'children', 'essay'].includes(bookType)
}
