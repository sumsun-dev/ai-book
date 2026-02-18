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
- 메시지 검색/고정(핀)/내보내기 지원

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

### 사용자 인증
- **NextAuth.js v5** 기반 인증 시스템 (JWT 세션)
- 이메일/비밀번호 로그인 (bcryptjs 해싱)
- Google OAuth 지원 (선택)
- 모든 API 라우트 인증 보호 (28개 라우트)
- 프로젝트 소유권 검증 (데이터 격리)
- 미들웨어 기반 라우트 보호

### 프로젝트 관리
- **프로젝트 대시보드** — 통계, 챕터 현황, 진행 단계 시각화
- **검색/필터/정렬** — 프로젝트 목록에서 빠른 탐색
- **버전 관리** — 프로젝트 스냅샷 생성/복원 (최대 20개, 자동 백업)
- **AI 에이전트 설정** — Writer/Editor/Critic 커스터마이징 (문체, 창의성, 엄격도)

### 국제화 (i18n)
- **next-intl** 기반 다국어 지원 (한국어/영어)
- 쿠키 기반 로케일 전환 (URL 구조 변경 없음)
- 17개 네임스페이스, 200+ 번역 키
- ko/en 키 일치 자동 검증 테스트

### UX
- 3D 인터랙티브 랜딩 페이지 (Three.js + React Three Fiber)
- Toast 알림 시스템
- 파일 업로드 (docx, pdf, txt 파싱)
- 다크/라이트 모드 완전 지원
- 로딩 스켈레톤 UI
- 전역 에러 바운더리 & 404 페이지
- AI 생성 진행 표시 (실시간 단어 수, 경과 시간, 프로그레스바)
- 출처 관리 & 인용 (인라인 인용, 참고문헌 자동 생성)
- 환경 변수 검증 (Zod + Proxy 패턴)
- 접근성(a11y) 강화 (aria-*, role, axe 검증)

## 기술 스택

| 분류 | 기술 |
|------|------|
| **Framework** | Next.js 16 (App Router), React 19, TypeScript 5 |
| **Styling** | Tailwind CSS 4, Tailwind Typography, Framer Motion |
| **Editor** | TipTap (rich text) |
| **AI** | Anthropic Claude API (@anthropic-ai/sdk) |
| **Database** | Prisma + SQLite |
| **State** | Zustand |
| **3D** | Three.js, React Three Fiber, React Three Drei |
| **Export** | @react-pdf/renderer (PDF), epub-gen-memory (EPUB) |
| **Validation** | Zod |
| **File Parsing** | mammoth (docx), pdf-parse (pdf), sharp (image) |
| **Auth** | NextAuth.js v5 (JWT), bcryptjs, @auth/prisma-adapter |
| **i18n** | next-intl (cookie 기반 로케일, ko/en) |
| **Testing** | Vitest, Testing Library, Playwright (E2E) |

## 책 종류

소설 (Fiction) · 비소설/논픽션 (Non-fiction) · 자기계발 (Self-help) · 기술서적 (Technical) · 에세이 (Essay) · 동화 (Children's Book) · 시집 (Poetry)

## 프로젝트 구조

```
ai-book/
├── src/
│   ├── agents/              # AI 에이전트 (research, outliner, writer, editor, critic)
│   ├── app/
│   │   ├── api/
│   │   │   ├── auth/        # 인증 (NextAuth, 회원가입)
│   │   │   ├── cover/       # 표지 생성 API
│   │   │   ├── generate/    # AI 생성 API
│   │   │   ├── projects/    # 프로젝트 CRUD, outline, write, edit, review
│   │   │   ├── stream/      # 스트리밍 API
│   │   │   └── upload/      # 파일 업로드 API
│   │   ├── auth/            # 로그인/회원가입/에러 페이지
│   │   ├── new/             # 새 프로젝트 생성
│   │   ├── project/[id]/    # 5단계 워크플로우 (research → outline → write → edit → review)
│   │   ├── projects/        # 프로젝트 목록
│   │   ├── preview/[id]/    # 북 프리뷰
│   │   └── write/           # 집필 페이지
│   ├── components/
│   │   ├── auth/            # 인증 컴포넌트 (LoginForm, RegisterForm, UserMenu)
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
│   │   ├── auth/            # 인증 유틸 (password, auth-utils)
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
├── messages/                 # i18n 번역 파일 (ko.json, en.json)
├── e2e/                     # E2E 테스트 (Playwright)
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
npm run test:e2e      # E2E 테스트 (Playwright)
```

## 환경 변수

```env
ANTHROPIC_API_KEY=    # Claude API 키 (필수)
DATABASE_URL=file:./prisma/dev.db
AUTH_SECRET=          # NextAuth 시크릿 (openssl rand -base64 32)
AUTH_TRUST_HOST=true  # 로컬 개발용
# AUTH_GOOGLE_ID=     # Google OAuth (선택)
# AUTH_GOOGLE_SECRET= # Google OAuth (선택)
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
- [x] 카테고리 선택 UI (BISAC/KDC/DDC/custom)
- [x] 사용자 인증 (NextAuth.js v5, JWT, Google OAuth)
- [x] 테스트 커버리지 80% 달성 (전체 95.38% stmts / 83.15% branch, 54 files / 595 tests)
- [x] 커버리지 미달 파일 개선 완료 (useAIChat, file-parser, useStreamingGeneration, isbn 등)
- [x] 프로젝트 검색/필터/정렬
- [x] 전역 에러 바운더리 & 404
- [x] 로딩 스켈레톤 UI
- [x] 환경 변수 검증 (Zod + Proxy)
- [x] 채팅 히스토리 강화 (검색/핀/내보내기)
- [x] AI 생성 진행 표시 (프로그레스바, 경과 시간)
- [x] 프로젝트 대시보드
- [x] 출처 관리 & 인용
- [x] 프로젝트 버전 관리 (스냅샷)
- [x] AI 에이전트 커스터마이징
- [x] 국제화 i18n (next-intl, 한국어/영어)
- [x] 접근성(a11y) 개선 (aria-*, role, axe 검증)
- [x] E2E 테스트 (Playwright, 12 spec)
- [x] Next.js 16 + React 19 업그레이드
