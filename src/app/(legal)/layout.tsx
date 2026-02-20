import Link from 'next/link'

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white dark:bg-neutral-950">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <div
          className="prose prose-neutral dark:prose-invert max-w-none
            text-neutral-900 dark:text-neutral-100
            prose-headings:text-neutral-900 dark:prose-headings:text-white
            prose-p:text-neutral-800 dark:prose-p:text-neutral-200
            prose-strong:text-neutral-900 dark:prose-strong:text-white
            prose-li:text-neutral-800 dark:prose-li:text-neutral-200
            prose-a:text-blue-600 dark:prose-a:text-blue-400"
        >
          {children}
        </div>
        <div className="mt-16 pt-8 border-t border-neutral-200 dark:border-neutral-800">
          <Link
            href="/"
            className="text-sm text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors"
          >
            &larr; 홈으로 돌아가기
          </Link>
        </div>
      </div>
    </div>
  )
}
