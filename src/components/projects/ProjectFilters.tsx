'use client'

import type { BookStatus, BookType } from '@/types/book'
import type { SortBy, UseProjectFiltersReturn } from './useProjectFilters'

const statusOptions: { value: BookStatus | 'all'; label: string }[] = [
  { value: 'all', label: '전체' },
  { value: 'draft', label: '초안' },
  { value: 'researching', label: '리서치' },
  { value: 'outlining', label: '목차' },
  { value: 'writing', label: '집필' },
  { value: 'editing', label: '편집' },
  { value: 'reviewing', label: '검토' },
  { value: 'completed', label: '완료' },
]

const typeOptions: { value: BookType | 'all'; label: string }[] = [
  { value: 'all', label: '전체' },
  { value: 'fiction', label: '소설' },
  { value: 'nonfiction', label: '논픽션' },
  { value: 'selfhelp', label: '자기계발' },
  { value: 'technical', label: '기술서' },
  { value: 'essay', label: '에세이' },
  { value: 'children', label: '아동도서' },
  { value: 'poetry', label: '시집' },
]

const sortOptions: { value: SortBy; label: string }[] = [
  { value: 'updatedAt', label: '수정일' },
  { value: 'createdAt', label: '생성일' },
  { value: 'title', label: '제목' },
]

interface ProjectFiltersProps {
  filterHook: UseProjectFiltersReturn
  totalCount: number
  filteredCount: number
}

export function ProjectFilters({
  filterHook,
  totalCount,
  filteredCount,
}: ProjectFiltersProps) {
  const {
    filters,
    setSearchQuery,
    setStatusFilter,
    setTypeFilter,
    setSortBy,
    toggleSortOrder,
    resetFilters,
    hasActiveFilters,
  } = filterHook

  return (
    <div className="mb-8 space-y-4">
      {/* Search */}
      <div className="relative">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 dark:text-neutral-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
          />
        </svg>
        <input
          type="text"
          value={filters.searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="프로젝트 검색..."
          className="w-full pl-10 pr-4 py-3 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-500 text-sm focus:outline-none focus:border-neutral-400 dark:focus:border-neutral-600 transition-colors"
          aria-label="프로젝트 검색"
        />
      </div>

      {/* Filters row */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Status filter */}
        <select
          value={filters.statusFilter}
          onChange={(e) =>
            setStatusFilter(e.target.value as BookStatus | 'all')
          }
          className="px-3 py-2 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 text-sm focus:outline-none focus:border-neutral-400 dark:focus:border-neutral-600 transition-colors"
          aria-label="상태 필터"
        >
          {statusOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        {/* Type filter */}
        <select
          value={filters.typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as BookType | 'all')}
          className="px-3 py-2 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 text-sm focus:outline-none focus:border-neutral-400 dark:focus:border-neutral-600 transition-colors"
          aria-label="장르 필터"
        >
          {typeOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        {/* Sort */}
        <select
          value={filters.sortBy}
          onChange={(e) => setSortBy(e.target.value as SortBy)}
          className="px-3 py-2 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 text-sm focus:outline-none focus:border-neutral-400 dark:focus:border-neutral-600 transition-colors"
          aria-label="정렬 기준"
        >
          {sortOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        {/* Sort order toggle */}
        <button
          onClick={toggleSortOrder}
          className="px-3 py-2 border border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 text-sm hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          aria-label={
            filters.sortOrder === 'asc' ? '오름차순' : '내림차순'
          }
        >
          {filters.sortOrder === 'asc' ? (
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M3 4.5h14.25M3 9h9.75M3 13.5h5.25m5.25-.75L17.25 9m0 0L21 12.75M17.25 9v12"
              />
            </svg>
          ) : (
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M3 4.5h14.25M3 9h9.75M3 13.5h9.75m4.5-4.5v12m0 0l-3.75-3.75M17.25 21L21 17.25"
              />
            </svg>
          )}
        </button>

        {/* Reset button */}
        {hasActiveFilters && (
          <button
            onClick={resetFilters}
            className="px-3 py-2 text-sm text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors"
          >
            초기화
          </button>
        )}

        {/* Result count */}
        <span className="ml-auto text-xs text-neutral-400 dark:text-neutral-500">
          {filteredCount === totalCount
            ? `${totalCount}개`
            : `${filteredCount} / ${totalCount}개`}
        </span>
      </div>
    </div>
  )
}
