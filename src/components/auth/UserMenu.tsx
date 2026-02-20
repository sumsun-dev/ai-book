'use client'

import { useState, useRef, useEffect } from 'react'
import { useSession, signOut } from 'next-auth/react'
import Link from 'next/link'

export default function UserMenu() {
  const { data: session, status } = useSession()
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  if (status === 'loading') {
    return (
      <div className="h-8 w-8 rounded-full bg-neutral-200 dark:bg-neutral-700 animate-pulse" />
    )
  }

  if (!session?.user) {
    return (
      <Link
        href="/auth/login"
        className="rounded-md bg-blue-600 px-3 py-1.5 text-sm text-white font-medium hover:bg-blue-700 transition-colors"
      >
        로그인
      </Link>
    )
  }

  const initials = (session.user.name || session.user.email || '?')
    .charAt(0)
    .toUpperCase()

  return (
    <div ref={menuRef} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
        aria-label="사용자 메뉴"
      >
        {session.user.image ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={session.user.image}
            alt=""
            className="h-8 w-8 rounded-full"
          />
        ) : (
          initials
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-56 rounded-md border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 shadow-lg z-50">
          <div className="px-4 py-3 border-b border-neutral-200 dark:border-neutral-700">
            <p className="text-sm font-medium text-neutral-900 dark:text-white truncate">
              {session.user.name || '사용자'}
            </p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate">
              {session.user.email}
            </p>
          </div>
          <div className="py-1">
            <button
              onClick={() => {
                setOpen(false)
                signOut({ callbackUrl: '/' })
              }}
              className="w-full text-left px-4 py-2 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
            >
              로그아웃
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
