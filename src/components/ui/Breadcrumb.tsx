'use client'

import Link from 'next/link'

interface BreadcrumbItem {
  label: string
  href?: string
}

interface BreadcrumbProps {
  items: BreadcrumbItem[]
  className?: string
}

export function Breadcrumb({ items, className = '' }: BreadcrumbProps) {
  return (
    <nav className={`flex items-center gap-1.5 text-sm ${className}`} aria-label="브레드크럼">
      {items.map((item, index) => (
        <span key={index} className="flex items-center gap-1.5">
          {index > 0 && (
            <span className="text-neutral-400 dark:text-neutral-500">/</span>
          )}
          {item.href ? (
            <Link
              href={item.href}
              className="text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors"
            >
              {item.label}
            </Link>
          ) : (
            <span className="text-neutral-900 dark:text-white font-medium">
              {item.label}
            </span>
          )}
        </span>
      ))}
    </nav>
  )
}
