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
- **Write** — InDesign 스타일 페이지 에디터, 챕터 에디터, AI 자동 작성 (새로 작성/이어쓰기/다시쓰기), HTML 서식 출력
- **Edit** — AI 기반 교정 및 수정 제안, TipTap 리치 텍스트 편집
- **Review** — 최종 검토 및 승인, 자동 피드백 루프, 일관성 검사

### 차별화 기능
- **자동 피드백 루프** — Editor-Critic 에이전트가 최대 3회 자동 반복 개선 (SSE 실시간 스트리밍)
- **플롯 구조 템플릿** — 3막 구조, 영웅의 여정, Save the Cat, 기승전결, 피히테 곡선, 자유 구조
- **일관성 검사** — 챕터 간 캐릭터, 타임라인, 설정, 플롯 교차 검증 Agent
- **ISBN 발급 가이드** — 한국 ISBN Agency 3단계 신청 절차 안내 + 상태 추적 (draft→applied→issued)
- **뉴스레터** — 이메일 구독 API + 기능 소개(/features) 및 가격(/pricing) 페이지

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
- **ISBN 관리** — ISBN-10/13 검증, 바코드 생성, 발급 상태 추적
- **메타데이터** — 저자, 출판사, 저작권 정보 관리

### 토큰 쿼터 시스템
- **사용량 추적** — 12개 AI 라우트에서 토큰 사용량 자동 기록 (try-finally 패턴)
- **사전 차단** — 모든 AI 요청 시 checkQuota로 한도 초과 사전 검증
- **사용량 UI** — TokenUsageBar 컴포넌트 (80/90/100% 단계별 경고, 적응형 폴링)
- **즉시 갱신** — AI 호출 완료 후 CustomEvent로 사용량 바 즉시 업데이트
- **리셋 안내** — 한도 초과 시 리셋 날짜 표시 + 플랜 업그레이드 CTA
- **접근성** — role="progressbar", aria-live="polite" 등 ARIA 속성

### 보안 & 인프라
- **NextAuth.js v5** 기반 인증 시스템 (JWT 세션)
- 이메일/비밀번호 로그인 (bcryptjs 해싱)
- Google OAuth 지원 (선택)
- 모든 API 라우트 인증 보호 (34개 라우트)
- 프로젝트 소유권 검증 (데이터 격리, projectOwnerWhere)
- **CSRF 보호** — Origin/Referer 헤더 검증 (proxy.ts 통합)
- **Rate Limiting** — Upstash Redis 3단계 (auth: 5/min, AI: 10/min, general: 60/min) + 회원가입 in-memory (3회/10분)
- **XSS 방지** — DOMPurify HTML sanitization (dangerouslySetInnerHTML 보호)
- **API 재시도** — Claude API exponential backoff (429/5xx 자동 재시도, 최대 3회, 누적 usage 추적)
- **Sentry 에러 모니터링** — 클라이언트/서버/엣지 통합, handleApiError 공통 유틸
- **CI/CD** — GitHub Actions (tsc → test → build)
- **Health Check** — `/api/health` 엔드포인트 (DB + 환경변수 검사)
- **법적 페이지** — 개인정보 처리방침(/privacy), 이용약관(/terms)

### 프로젝트 관리
- **프로젝트 대시보드** — 통계, 챕터 현황, 진행 단계 시각화
- **검색/필터/정렬** — 프로젝트 목록에서 빠른 탐색
- **버전 관리** — 프로젝트 스냅샷 생성/복원 (최대 20개, 자동 백업)
- **AI 에이전트 설정** — Writer/Editor/Critic 커스터마이징 (문체, 창의성, 엄격도)

### 국제화 (i18n)
- **next-intl** 기반 다국어 지원 (한국어/영어)
- 쿠키 기반 로케일 전환 (URL 구조 변경 없음)
- 26개 네임스페이스, 400+ 번역 키
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
| **AI** | Anthropic Claude API (@anthropic-ai/sdk), OpenAI SDK 6 (DALL-E) |
| **Database** | Prisma 7 + PostgreSQL (@prisma/adapter-pg) |
| **State** | Zustand |
| **3D** | Three.js, React Three Fiber, React Three Drei |
| **Export** | @react-pdf/renderer (PDF), epub-gen-memory (EPUB) |
| **Validation** | Zod 4 |
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
│   ├── agents/              # AI 에이전트 (research, outliner, writer, editor, critic, consistency)
│   ├── app/
│   │   ├── api/
│   │   │   ├── auth/        # 인증 (NextAuth, 회원가입)
│   │   │   ├── cover/       # 표지 생성 API
│   │   │   ├── generate/    # AI 생성 API
│   │   │   ├── health/      # 헬스체크 엔드포인트
│   │   │   ├── newsletter/   # 뉴스레터 구독 API
│   │   │   ├── projects/    # 프로젝트 CRUD, outline, write, edit, review, consistency
│   │   │   ├── stream/      # 스트리밍 API
│   │   │   ├── upload/      # 파일 업로드 API
│   │   │   └── usage/       # 토큰 사용량 API
│   │   ├── (legal)/         # 법적 페이지 (privacy, terms)
│   │   ├── auth/            # 로그인/회원가입/에러 페이지
│   │   ├── features/        # 기능 소개 페이지
│   │   ├── new/             # 새 프로젝트 생성
│   │   ├── pricing/         # 가격 안내 페이지
│   │   ├── project/[id]/    # 5단계 워크플로우 (research → outline → write → edit → review)
│   │   ├── projects/        # 프로젝트 목록
│   │   ├── preview/[id]/    # 북 프리뷰
│   │   └── write/           # 집필 페이지
│   ├── components/
│   │   ├── auth/            # 인증 컴포넌트 (LoginForm, RegisterForm, UserMenu)
│   │   ├── ai-chat/         # 챕터별 AI 채팅
│   │   ├── bible/           # Book Bible 컨텍스트 빌더
│   │   ├── cover/           # 표지 디자인 (*)
│   │   ├── isbn/            # ISBN 입력/바코드/발급 가이드/상태 트래커
│   │   ├── metadata/        # 메타데이터 폼
│   │   ├── landing/          # 랜딩 페이지 (뉴스레터 등)
│   │   ├── outline/         # 드래그앤드롭 목차 에디터, 플롯 구조 선택
│   │   ├── page-editor/     # TipTap 페이지 에디터
│   │   ├── preview/         # 북 프리뷰
│   │   ├── project/         # 프로젝트 공통 컴포넌트
│   │   ├── ui/              # 공통 UI (Toast, TokenUsageBar 등)
│   │   ├── upload/          # 파일 업로드
│   │   ├── review/          # 피드백 루프, 일관성 검사 리포트
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
│   │   ├── api-utils.ts     # handleApiError + Sentry 연동
│   │   ├── errors.ts        # 에러 처리 유틸
│   │   ├── file-parser.ts   # 파일 파싱 (docx, pdf, txt)
│   │   ├── isbn.ts          # ISBN 유틸리티
│   │   ├── plot-structures.ts # 플롯 구조 템플릿 (6종)
│   │   ├── pdf.ts           # PDF 내보내기
│   │   ├── token-quota.ts   # 토큰 쿼터 (checkQuota, recordUsage, ensureUserQuota)
│   │   ├── rate-limit.ts    # Upstash 기반 Rate Limiting
│   │   ├── sanitize.ts      # DOMPurify HTML sanitization
│   │   ├── store.ts         # Zustand 스토어
│   │   ├── db/              # Prisma 클라이언트
│   │   └── utils/           # JSON 파서, 텍스트→HTML 변환
│   └── types/
│       ├── book.ts          # 도메인 타입 정의
│       └── book-bible.ts    # Book Bible 타입
├── messages/                 # i18n 번역 파일 (ko.json, en.json)
├── e2e/                     # E2E 테스트 (Playwright)
├── sentry.*.config.ts       # Sentry 설정 (client/server/edge)
├── .github/workflows/       # CI/CD (GitHub Actions)
├── prisma/schema.prisma     # DB 스키마 (19 models, PostgreSQL)
├── prisma.config.ts         # Prisma 7 설정 (datasource URL, migrations)
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
# === 필수 ===
ANTHROPIC_API_KEY=    # Claude API 키
AUTH_SECRET=          # NextAuth 시크릿 (openssl rand -base64 32)
DATABASE_URL=         # PostgreSQL 연결 문자열

# === 선택 ===
# AUTH_GOOGLE_ID=     # Google OAuth
# AUTH_GOOGLE_SECRET= # Google OAuth
# UPSTASH_REDIS_REST_URL=   # Rate Limiting (Upstash Redis)
# UPSTASH_REDIS_REST_TOKEN= # Rate Limiting
# NEXT_PUBLIC_SENTRY_DSN=   # Sentry 에러 모니터링
# SENTRY_DSN=               # Sentry 서버 사이드
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
- [x] 테스트 커버리지 80% 달성 (95 files / 888 tests)
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
- [x] 자동 피드백 루프 (Editor-Critic 최대 3회 반복, SSE 스트리밍)
- [x] 플롯 구조 템플릿 (3막 구조, 영웅의 여정 등 6종)
- [x] 챕터 간 일관성 검사 Agent (캐릭터, 타임라인, 설정 교차 검증)
- [x] 뉴스레터 구독 + /features, /pricing 페이지
- [x] ISBN 발급 가이드 + 상태 추적 (draft→applied→issued)
- [x] AI 집필 HTML 서식 출력 (h3, strong, ul/ol, blockquote 등)
- [x] 편집 페이지 TipTap 리치 에디터 전환 (textarea → WYSIWYG)
- [x] 집필 중 챕터 이동 시 콘텐츠 보호 (writingChapter 상태 추적)
- [x] 편집 단계 진행 조건 완화 (미완성 챕터 경고 후 허용)
- [x] PostgreSQL 마이그레이션 준비 (SQLite → PostgreSQL)
- [x] CI/CD 파이프라인 (GitHub Actions: tsc → test → build)
- [x] CSRF 보호 + Rate Limiting + XSS 방지
- [x] Sentry 에러 모니터링 통합 (18개 API route)
- [x] API 재시도 로직 (exponential backoff)
- [x] Health Check 엔드포인트 (/api/health)
- [x] 개인정보 처리방침 & 이용약관 페이지
- [x] 토큰 쿼터 시스템 (사용량 추적, 한도 차단, 적응형 UI)
- [x] 회원가입 in-memory rate limit (3회/10분)
- [x] 프로젝트 소유권 검증 강화 (전체 AI 라우트)
- [x] 의존성 메이저 업그레이드 (Prisma 5→7, Zod 3→4, OpenAI SDK 4→6)
