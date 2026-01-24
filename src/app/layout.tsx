import type { Metadata } from 'next'
import { Inter, Playfair_Display } from 'next/font/google'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko" className={`${inter.variable} ${playfair.variable}`} suppressHydrationWarning>
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
      <body className="font-sans antialiased">{children}</body>
    </html>
  )
}
