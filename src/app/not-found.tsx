import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-neutral-50 dark:bg-neutral-950 px-4">
      <div className="text-center max-w-md">
        <h1 className="text-8xl font-extralight text-neutral-300 dark:text-neutral-700 mb-4">
          404
        </h1>
        <h2 className="text-2xl font-light text-neutral-900 dark:text-white tracking-tight mb-3">
          페이지를 찾을 수 없습니다
        </h2>
        <p className="text-neutral-500 dark:text-neutral-400 mb-8">
          요청하신 페이지가 존재하지 않거나 이동되었습니다.
        </p>
        <Link
          href="/projects"
          className="inline-block px-6 py-3 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-sm font-medium tracking-wide transition-all duration-500 hover:bg-neutral-700 dark:hover:bg-neutral-200"
        >
          프로젝트 목록으로
        </Link>
      </div>
    </div>
  )
}
