# AI Book - Project Guidelines

## Overview

AI multi-agent book writing platform. Users input a topic and style, and 5 AI agents collaborate to produce a complete book.

### Tech Stack
- **Framework**: Next.js 16 (App Router), React 19, TypeScript 5
- **Styling**: Tailwind CSS 4, Tailwind Typography, Framer Motion (dark mode required)
- **Editor**: TipTap (rich text), InDesign-style page editor
- **AI**: Anthropic Claude API (@anthropic-ai/sdk)
- **DB**: Prisma + PostgreSQL
- **Auth**: NextAuth.js v5 (JWT), bcryptjs, Google OAuth
- **State**: Zustand
- **3D**: Three.js + React Three Fiber (landing page)
- **Export**: PDF (@react-pdf/renderer), EPUB (epub-gen-memory)
- **Validation**: Zod
- **i18n**: next-intl (cookie-based locale, ko/en)
- **Security**: CSRF (Origin/Referer), Rate Limit (Upstash Redis), XSS (DOMPurify), Sentry
- **Testing**: Vitest (80% coverage threshold), Playwright (E2E)

## Project Structure

```
ai-book/
├── src/
│   ├── agents/              # AI agents (research, outliner, writer, editor, critic, consistency)
│   ├── app/
│   │   ├── api/
│   │   │   ├── auth/        # Auth (NextAuth, register)
│   │   │   ├── cover/       # Cover generation API
│   │   │   ├── generate/    # AI generation API
│   │   │   ├── health/      # Health check endpoint
│   │   │   ├── newsletter/  # Newsletter subscription API
│   │   │   ├── projects/    # Project CRUD, outline, write, edit, review, consistency
│   │   │   ├── stream/      # Streaming API
│   │   │   └── upload/      # File upload API
│   │   ├── (legal)/         # Legal pages (privacy, terms)
│   │   ├── auth/            # Login/Register/Error pages
│   │   ├── features/        # Features page
│   │   ├── new/             # New project creation
│   │   ├── pricing/         # Pricing page
│   │   ├── project/[id]/    # 5-step workflow (research → outline → write → edit → review)
│   │   ├── projects/        # Project list
│   │   ├── preview/[id]/    # Book preview
│   │   └── write/           # Write page
│   ├── components/
│   │   ├── auth/            # Auth components (LoginForm, RegisterForm, UserMenu)
│   │   ├── ai-chat/         # Per-chapter AI chat
│   │   ├── bible/           # Book Bible context builder
│   │   ├── cover/           # Cover design
│   │   ├── isbn/            # ISBN input/barcode/guide/tracker
│   │   ├── metadata/        # Metadata form
│   │   ├── landing/         # Landing page (newsletter etc.)
│   │   ├── outline/         # Drag-and-drop TOC editor, plot structure
│   │   ├── page-editor/     # TipTap page editor
│   │   ├── preview/         # Book preview
│   │   ├── project/         # Project common components
│   │   ├── ui/              # Common UI (Toast etc.)
│   │   ├── upload/          # File upload
│   │   ├── review/          # Feedback loop, consistency report
│   │   └── write/           # Write-related components
│   ├── hooks/
│   │   ├── useAIChat.ts     # AI chat hook
│   │   ├── useAIEdit.ts     # AI edit hook
│   │   ├── useStreamingGeneration.ts  # Streaming generation hook
│   │   └── useToast.ts      # Toast notification hook
│   ├── lib/
│   │   ├── bible-context.ts # Book Bible context builder
│   │   ├── claude.ts        # Claude API client
│   │   ├── cover-generator.ts # Cover generation
│   │   ├── cover-templates.ts # Cover templates
│   │   ├── epub.ts          # EPUB generation
│   │   ├── epub-styles.ts   # EPUB styles
│   │   ├── auth/            # Auth utils (password, auth-utils)
│   │   ├── api-utils.ts     # handleApiError + Sentry integration
│   │   ├── errors.ts        # Error handling utils
│   │   ├── file-parser.ts   # File parsing (docx, pdf, txt)
│   │   ├── isbn.ts          # ISBN utilities
│   │   ├── plot-structures.ts # Plot structure templates (6 types)
│   │   ├── pdf.ts           # PDF export
│   │   ├── rate-limit.ts    # Upstash-based Rate Limiting
│   │   ├── sanitize.ts      # DOMPurify HTML sanitization
│   │   ├── store.ts         # Zustand store
│   │   ├── db/              # Prisma client
│   │   └── utils/           # JSON parser, text→HTML conversion
│   └── types/
│       ├── book.ts          # Domain type definitions
│       └── book-bible.ts    # Book Bible types
├── messages/                # i18n translation files (ko.json, en.json)
├── e2e/                     # E2E tests (Playwright)
├── sentry.*.config.ts       # Sentry config (client/server/edge)
├── .github/workflows/       # CI/CD (GitHub Actions)
├── prisma/schema.prisma     # DB schema (18 models, PostgreSQL)
└── vitest.config.ts         # Test configuration
```

## Multi-Agent Pipeline

```
[Research] → Generate questions / collect answers → research data
    ↓
[Outliner] → Design TOC / chapter structure
    ↓
[Writer]   → Write chapters/pages (streaming)
    ↓
[Editor]   → Spelling / consistency review
    ↓
[Critic]   → Quality evaluation (Pass/Revise) → export on pass
```

## Commands (Allowed)

```bash
npm run dev           # Dev server
npm run build         # Production build
npm run lint          # ESLint
npm test              # Vitest watch mode
npm run test:run      # Single test run
npm run test:coverage # Coverage report
npm run test:e2e      # E2E tests (Playwright)
npx prisma studio     # DB GUI
npx prisma db push    # Push schema
npx prisma generate   # Generate client
```

## Environment Variables

```env
# === Required ===
ANTHROPIC_API_KEY=    # Claude API key
AUTH_SECRET=          # NextAuth secret (openssl rand -base64 32)
DATABASE_URL=         # PostgreSQL connection string

# === Optional ===
# DIRECT_URL=                  # Prisma direct DB connection (for migrations)
# AUTH_GOOGLE_ID=              # Google OAuth
# AUTH_GOOGLE_SECRET=          # Google OAuth
# UPSTASH_REDIS_REST_URL=     # Rate Limiting (Upstash Redis)
# UPSTASH_REDIS_REST_TOKEN=   # Rate Limiting
# NEXT_PUBLIC_SENTRY_DSN=     # Sentry error monitoring
# SENTRY_DSN=                 # Sentry server-side
# DATABASE_URL_TEST=          # E2E test database URL
```

## Dark/Light Mode Rules (CRITICAL)

**Every text and background MUST have both light and dark mode color pairs.**

```tsx
// ❌ Single mode only
className="text-white"
className="bg-gray-900"

// ✅ Both modes specified
className="text-neutral-900 dark:text-white"
className="bg-white dark:bg-neutral-900"
```

**Prose usage (TipTap, HTML rendering):**
```tsx
className="prose prose-neutral dark:prose-invert
  text-neutral-900 dark:text-neutral-100
  prose-headings:text-neutral-900 dark:prose-headings:text-white
  prose-p:text-neutral-800 dark:prose-p:text-neutral-200
  prose-strong:text-neutral-900 dark:prose-strong:text-white
  prose-li:text-neutral-800 dark:prose-li:text-neutral-200"
```

**Checklist:**
- Every `text-*` has a `dark:text-*` pair?
- Every `bg-*` has a `dark:bg-*` pair?
- Every `border-*` has a `dark:border-*` pair?
- Prose headings, p, strong, li colors explicitly set?

## Supported Formats

Paper sizes: A4, A5, B5, Letter, Shinguk-pan

## Book Types

Fiction, Non-fiction, Self-help, Technical, Essay, Children's, Poetry
