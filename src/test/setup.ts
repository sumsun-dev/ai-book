import '@testing-library/jest-dom'
import 'vitest-axe/extend-expect'
import React from 'react'
import { afterEach, expect, vi } from 'vitest'
import * as matchers from 'vitest-axe/matchers'

expect.extend(matchers)
import { cleanup } from '@testing-library/react'

// React 테스트 후 정리
afterEach(() => {
  cleanup()
})

// Next.js Router 모킹
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
  }),
  useParams: () => ({
    id: 'test-project-id',
    chapterId: 'test-chapter-id',
  }),
  usePathname: () => '/project/test-project-id/write',
  useSearchParams: () => new URLSearchParams(),
}))

// NextAuth 모킹
vi.mock('next-auth/react', () => ({
  useSession: vi.fn(() => ({
    data: {
      user: { id: 'test-user-id', email: 'test@test.com', name: 'Test User' },
      expires: new Date(Date.now() + 86400000).toISOString(),
    },
    status: 'authenticated',
  })),
  SessionProvider: ({ children }: { children: React.ReactNode }) => children,
  signIn: vi.fn(),
  signOut: vi.fn(),
}))

// NextAuth 서버사이드 모킹 (API 라우트 테스트용)
vi.mock('@/auth', () => ({
  auth: vi.fn().mockResolvedValue({
    user: { id: 'test-user-id', email: 'test@test.com', name: 'Test User' },
    expires: new Date(Date.now() + 86400000).toISOString(),
  }),
  handlers: { GET: vi.fn(), POST: vi.fn() },
  signIn: vi.fn(),
  signOut: vi.fn(),
}))

// Fetch 모킹
global.fetch = vi.fn()

// ResizeObserver 모킹
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// matchMedia 모킹
global.matchMedia = vi.fn().mockImplementation((query) => ({
  matches: false,
  media: query,
  onchange: null,
  addListener: vi.fn(),
  removeListener: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn(),
}))

// next-intl 모킹
vi.mock('next-intl', () => ({
  useTranslations: () => {
    const t = (key: string, params?: Record<string, unknown>) => {
      if (params) {
        return Object.entries(params).reduce(
          (str, [k, v]) => str.replace(`{${k}}`, String(v)),
          key
        )
      }
      return key
    }
    t.rich = (key: string) => key
    t.raw = (key: string) => key
    t.has = () => true
    return t
  },
  useLocale: () => 'ko',
  NextIntlClientProvider: ({ children }: { children: React.ReactNode }) => children,
}))

vi.mock('next-intl/server', () => ({
  getTranslations: vi.fn().mockImplementation(() => {
    const t = (key: string, params?: Record<string, unknown>) => {
      if (params) {
        return Object.entries(params).reduce(
          (str, [k, v]) => str.replace(`{${k}}`, String(v)),
          key
        )
      }
      return key
    }
    t.rich = (key: string) => key
    t.raw = (key: string) => key
    t.has = () => true
    return Promise.resolve(t)
  }),
  getLocale: vi.fn().mockResolvedValue('ko'),
  getMessages: vi.fn().mockResolvedValue({}),
}))
