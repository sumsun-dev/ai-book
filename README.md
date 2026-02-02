# AI Book

AI 기반 책 집필 서비스

## 개요

사용자가 원하는 책의 주제와 스타일을 입력하면, 여러 AI 에이전트가 협업하여 책을 완성해주는 서비스입니다.

## Multi-Agent Architecture

```
사용자 입력 → Research Agent → Outliner Agent → Writer Agent → Editor Agent → Critic Agent → 출판
                    ↑                                              ↓
                    └──────────────── 피드백 루프 ─────────────────┘
```

### Agent Roles

1. **Research Agent** - 자료 조사 및 검색
   - AI 기반 질문 생성으로 책 방향성 구체화
   - 참고 문헌 정리
   - 팩트 체크

2. **Outliner Agent** - 구조 설계
   - 책의 전체 구조 설계
   - 챕터 및 섹션 구성
   - 목차 생성 및 편집

3. **Writer Agent** - 본문 작성
   - 페이지/챕터 단위 AI 작성
   - 문체 일관성 유지
   - 스트리밍 방식 실시간 출력

4. **Editor Agent** - 검수 및 교정
   - 문법 및 맞춤법 검사
   - 문장 다듬기
   - 일관성 검토

5. **Critic Agent** - 평가 및 피드백
   - 품질 평가 (Pass/Revise 결정)
   - 개선 방향 제시
   - 최종 승인

## 주요 기능

### 집필 워크플로우
- **Research** - AI 질문 기반 책 구상 구체화
- **Outline** - 목차 자동 생성 및 드래그앤드롭 편집
- **Write** - InDesign 스타일 페이지 에디터 / 챕터 에디터
- **Edit** - AI 기반 교정 및 수정 제안
- **Review** - 최종 검토 및 승인

### 에디터
- 페이지 기반 편집 (A4, A5, B5, Letter, 신국판)
- 챕터 기반 편집
- 리치 텍스트 에디터
- AI 자동 작성 (새로 작성 / 이어쓰기 / 다시쓰기)
- 실시간 자동 저장

### 출판 기능
- **PDF 내보내기** - 다양한 용지 크기 지원
- **EPUB 내보내기** - 전자책 / Amazon Kindle 지원
- **표지 디자인** - AI 생성 또는 템플릿 기반
- **CMYK 변환** - 인쇄용 표지 출력
- **ISBN 관리** - ISBN-10/13 검증 및 바코드 생성
- **메타데이터** - 저자, 출판사, 저작권 정보 관리

## 기술 스택

- **Frontend**: Next.js 14 (App Router)
- **AI Model**: Claude (Anthropic API)
- **Database**: Prisma + SQLite
- **Styling**: Tailwind CSS
- **EPUB Generation**: epub-gen-memory
- **PDF Generation**: react-pdf

## 책 종류

- 소설 (Fiction)
- 비소설/논픽션 (Non-fiction)
- 자기계발 (Self-help)
- 기술서적 (Technical)
- 에세이 (Essay)
- 동화 (Children's Book)
- 시집 (Poetry)

## 프로젝트 구조

```
ai-book/
├── src/
│   ├── app/
│   │   ├── page.tsx              # 랜딩 페이지
│   │   ├── new/                  # 새 프로젝트 생성
│   │   ├── projects/             # 프로젝트 목록
│   │   ├── project/[id]/
│   │   │   ├── research/         # 리서치 단계
│   │   │   ├── outline/          # 목차 설계
│   │   │   ├── write/            # 집필
│   │   │   ├── edit/             # 편집
│   │   │   └── review/           # 검토
│   │   ├── preview/[id]/         # 북 프리뷰
│   │   └── api/                  # API Routes
│   ├── components/
│   │   ├── outline/              # 목차 편집 컴포넌트
│   │   ├── page-editor/          # 페이지 에디터
│   │   ├── preview/              # 북 프리뷰
│   │   ├── metadata/             # 메타데이터 폼
│   │   └── isbn/                 # ISBN 입력
│   ├── lib/
│   │   ├── claude.ts             # Claude API 연동
│   │   ├── epub.ts               # EPUB 생성
│   │   ├── isbn.ts               # ISBN 유틸리티
│   │   └── cmyk.ts               # CMYK 변환
│   └── types/
│       └── book.ts               # 타입 정의
├── prisma/
│   └── schema.prisma             # DB 스키마
└── package.json
```

## 시작하기

```bash
# 의존성 설치
npm install

# 환경 변수 설정
cp .env.example .env
# ANTHROPIC_API_KEY 설정

# DB 초기화
npx prisma db push

# 개발 서버 실행
npm run dev
```

## 개발 현황

- [x] 프로젝트 초기 설정
- [x] Multi-Agent 시스템 설계
- [x] Claude API 연동
- [x] 5단계 워크플로우 UI (Research → Outline → Write → Edit → Review)
- [x] InDesign 스타일 페이지 에디터
- [x] PDF 출력 기능
- [x] EPUB 출력 기능
- [x] 표지 디자인
- [x] ISBN 관리
- [x] 메타데이터 관리
- [x] CMYK 인쇄용 표지
- [ ] 카테고리 선택 UI (BISAC/KDC)
- [ ] 테스트 커버리지 확대
