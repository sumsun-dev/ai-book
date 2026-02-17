# AI Book

AI 멀티 에이전트 기반 책 집필 플랫폼. 주제와 스타일을 입력하면 5개의 AI 에이전트가 협업하여 완성된 책을 만들어줍니다.

## Multi-Agent Architecture

```
사용자 입력 → Research Agent → Outliner Agent → Writer Agent → Editor Agent → Critic Agent → 출판
                    ↑                                              ↓
                    └──────────────── 피드백 루프 ─────────────────┘
```

### Agent Roles

| Agent | 역할 | 설명 |
|-------|------|------|
| **Research** | 자료 조사 | AI 질문 생성으로 책 방향성 구체화, 참고 문헌 정리 |
| **Outliner** | 구조 설계 | 챕터/섹션 구성, 장르별 목차 가이드라인 적용 |
| **Writer** | 본문 작성 | 페이지/챕터 단위 스트리밍 작성, 장르별 전문 프롬프트 |
| **Editor** | 검수/교정 | 문법, 맞춤법, 일관성 검토 |
| **Critic** | 평가/피드백 | 품질 평가 (Pass/Revise), 개선 방향 제시 |

## 주요 기능

### 집필 워크플로우
- **Research** — AI 질문 기반 책 구상 구체화, 파일 업로드(docx/pdf/txt) 지원
- **Outline** — 장르별 목차 자동 생성, 드래그앤드롭 편집, 11가지 문체 프리셋 + 커스텀 문체
- **Write** — InDesign 스타일 페이지 에디터, 챕터 에디터, AI 자동 작성 (새로 작성/이어쓰기/다시쓰기)
- **Edit** — AI 기반 교정 및 수정 제안
- **Review** — 최종 검토 및 승인

### Book Bible 시스템
- 장르, 스타일, 톤, 캐릭터, 세계관 등 컨텍스트 관리
- 집필 시 일관된 스타일 자동 적용

### AI Chat
- 챕터별 AI 채팅으로 내용 토론 및 아이디어 발전

### 에디터
- TipTap 기반 리치 텍스트 에디터
- 페이지 기반 편집 (A4, A5, B5, Letter, 신국판)
- 챕터 기반 편집
- 실시간 자동 저장

### 출판
- **PDF 내보내기** — 다양한 용지 크기 지원
- **EPUB 내보내기** — 전자책 / Amazon Kindle 지원
- **표지 디자인** — AI 생성 또는 템플릿 기반
- **CMYK 변환** — 인쇄용 표지 출력
- **ISBN 관리** — ISBN-10/13 검증 및 바코드 생성
- **메타데이터** — 저자, 출판사, 저작권 정보 관리

### 기타
- 3D 인터랙티브 랜딩 페이지 (Three.js + React Three Fiber)
- Toast 알림 시스템
- 파일 업로드 (docx, pdf, txt 파싱)
- 다크/라이트 모드 완전 지원

## 기술 스택

| 분류 | 기술 |
|------|------|
| **Framework** | Next.js 14 (App Router), React 18, TypeScript 5 |
| **Styling** | Tailwind CSS 4, Tailwind Typography, Framer Motion |
| **Editor** | TipTap (rich text) |
| **AI** | Anthropic Claude API (@anthropic-ai/sdk) |
| **Database** | Prisma + SQLite |
| **State** | Zustand |
| **3D** | Three.js, React Three Fiber, React Three Drei |
| **Export** | @react-pdf/renderer (PDF), epub-gen-memory (EPUB) |
| **Validation** | Zod |
| **File Parsing** | mammoth (docx), pdf-parse (pdf), sharp (image) |
| **Testing** | Vitest, Testing Library |

## 책 종류

소설 (Fiction) · 비소설/논픽션 (Non-fiction) · 자기계발 (Self-help) · 기술서적 (Technical) · 에세이 (Essay) · 동화 (Children's Book) · 시집 (Poetry)

## 프로젝트 구조

```
ai-book/
├── src/
│   ├── agents/              # AI 에이전트 (research, outliner, writer, editor, critic)
│   ├── app/
│   │   ├── api/
│   │   │   ├── cover/       # 표지 생성 API
│   │   │   ├── generate/    # AI 생성 API
│   │   │   ├── projects/    # 프로젝트 CRUD, outline, write, edit, review
│   │   │   ├── stream/      # 스트리밍 API
│   │   │   └── upload/      # 파일 업로드 API
│   │   ├── new/             # 새 프로젝트 생성
│   │   ├── project/[id]/    # 5단계 워크플로우 (research → outline → write → edit → review)
│   │   ├── projects/        # 프로젝트 목록
│   │   ├── preview/[id]/    # 북 프리뷰
│   │   └── write/           # 집필 페이지
│   ├── components/
│   │   ├── ai-chat/         # 챕터별 AI 채팅
│   │   ├── bible/           # Book Bible 컨텍스트 빌더
│   │   ├── cover/           # 표지 디자인 (*)
│   │   ├── isbn/            # ISBN 입력/바코드
│   │   ├── metadata/        # 메타데이터 폼
│   │   ├── outline/         # 드래그앤드롭 목차 에디터
│   │   ├── page-editor/     # TipTap 페이지 에디터
│   │   ├── preview/         # 북 프리뷰
│   │   ├── project/         # 프로젝트 공통 컴포넌트
│   │   ├── ui/              # 공통 UI (Toast 등)
│   │   ├── upload/          # 파일 업로드
│   │   └── write/           # 집필 관련 컴포넌트
│   ├── hooks/
│   │   ├── useAIChat.ts     # AI 채팅 훅
│   │   ├── useAIEdit.ts     # AI 편집 훅
│   │   ├── useStreamingGeneration.ts  # 스트리밍 생성 훅
│   │   └── useToast.ts      # Toast 알림 훅
│   ├── lib/
│   │   ├── bible-context.ts # Book Bible 컨텍스트 빌더
│   │   ├── claude.ts        # Claude API 클라이언트
│   │   ├── cover-generator.ts # 표지 생성
│   │   ├── cover-templates.ts # 표지 템플릿
│   │   ├── epub.ts          # EPUB 생성
│   │   ├── epub-styles.ts   # EPUB 스타일
│   │   ├── errors.ts        # 에러 처리 유틸
│   │   ├── file-parser.ts   # 파일 파싱 (docx, pdf, txt)
│   │   ├── isbn.ts          # ISBN 유틸리티
│   │   ├── pdf.ts           # PDF 내보내기
│   │   ├── store.ts         # Zustand 스토어
│   │   ├── db/              # Prisma 클라이언트
│   │   └── utils/           # JSON 파서, 텍스트→HTML 변환
│   └── types/
│       ├── book.ts          # 도메인 타입 정의
│       └── book-bible.ts    # Book Bible 타입
├── prisma/schema.prisma     # DB 스키마
└── vitest.config.ts         # 테스트 설정
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

## 명령어

```bash
npm run dev           # 개발 서버
npm run build         # 프로덕션 빌드
npm test              # Vitest watch 모드
npm run test:run      # 단일 테스트 실행
npm run test:coverage # 커버리지 리포트
```

## 환경 변수

```env
ANTHROPIC_API_KEY=    # Claude API 키 (필수)
DATABASE_URL=file:./prisma/dev.db
```

## 개발 현황

- [x] Multi-Agent 시스템 (Research → Outline → Write → Edit → Review)
- [x] Claude API 연동 (스트리밍 지원)
- [x] Book Bible 시스템 (장르/스타일/톤/캐릭터 컨텍스트)
- [x] 11가지 문체 프리셋 + 커스텀 문체
- [x] InDesign 스타일 페이지 에디터 (TipTap)
- [x] 챕터별 AI 채팅
- [x] 파일 업로드 (docx/pdf/txt 파싱)
- [x] PDF/EPUB 내보내기
- [x] 표지 디자인 + CMYK 변환
- [x] ISBN 관리 + 바코드 생성
- [x] 메타데이터 관리
- [x] 3D 인터랙티브 랜딩 페이지
- [x] Toast 알림 시스템
- [x] Zod 입력 검증 (API endpoints)
- [x] 다크/라이트 모드 완전 지원
- [ ] 카테고리 선택 UI (BISAC/KDC)
- [ ] 사용자 인증
- [ ] 테스트 커버리지 확대 (목표: 80%)
