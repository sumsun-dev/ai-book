import type { Metadata } from 'next'
import { Inter, Playfair_Display } from 'next/font/google'
import { NextIntlClientProvider } from 'next-intl'
import { getLocale, getMessages } from 'next-intl/server'
import { ToastProvider } from '@/components/ui/ToastProvider'
import Providers from '@/app/providers'
import DevTools from '@/components/DevTools'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair-display',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'AI Book - 당신의 이야기를 책으로',
  description: 'AI 에이전트들이 협업하여 당신만의 책을 완성해드립니다. 소설, 에세이, 자기계발서 등 다양한 장르의 책을 쉽고 빠르게 작성하세요.',
  keywords: ['AI', '책 쓰기', '글쓰기', '소설', '에세이', '자동 글쓰기', 'AI 작가'],
  openGraph: {
    title: 'AI Book - 당신의 이야기를 책으로',
    description: 'AI 에이전트들이 협업하여 당신만의 책을 완성해드립니다.',
    type: 'website',
  },
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const locale = await getLocale()
  const messages = await getMessages()

  return (
    <html lang={locale} className={`${inter.variable} ${playfair.variable}`} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  const theme = localStorage.getItem('theme');
                  if (theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                    document.documentElement.classList.add('dark');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="font-sans antialiased">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-white focus:text-black dark:focus:bg-neutral-900 dark:focus:text-white"
        >
          Skip to content
        </a>
        <Providers>
          <NextIntlClientProvider messages={messages} locale={locale}>
            <ToastProvider>
              <main id="main-content">{children}</main>
            </ToastProvider>
          </NextIntlClientProvider>
        </Providers>
        <DevTools />
      </body>
    </html>
  )
}
