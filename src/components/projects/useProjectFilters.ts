import { useState, useMemo } from 'react'
import type { BookProject, BookStatus, BookType } from '@/types/book'

export type SortBy = 'createdAt' | 'updatedAt' | 'title'
export type SortOrder = 'asc' | 'desc'

export interface ProjectFiltersState {
  searchQuery: string
  statusFilter: BookStatus | 'all'
  typeFilter: BookType | 'all'
  sortBy: SortBy
  sortOrder: SortOrder
}

export interface UseProjectFiltersReturn {
  filters: ProjectFiltersState
  setSearchQuery: (query: string) => void
  setStatusFilter: (status: BookStatus | 'all') => void
  setTypeFilter: (type: BookType | 'all') => void
  setSortBy: (sort: SortBy) => void
  setSortOrder: (order: SortOrder) => void
  toggleSortOrder: () => void
  resetFilters: () => void
  filteredProjects: BookProject[]
  hasActiveFilters: boolean
}

const initialFilters: ProjectFiltersState = {
  searchQuery: '',
  statusFilter: 'all',
  typeFilter: 'all',
  sortBy: 'updatedAt',
  sortOrder: 'desc',
}

export function useProjectFilters(
  projects: BookProject[]
): UseProjectFiltersReturn {
  const [filters, setFilters] = useState<ProjectFiltersState>(initialFilters)

  const setSearchQuery = (searchQuery: string) =>
    setFilters((prev) => ({ ...prev, searchQuery }))

  const setStatusFilter = (statusFilter: BookStatus | 'all') =>
    setFilters((prev) => ({ ...prev, statusFilter }))

  const setTypeFilter = (typeFilter: BookType | 'all') =>
    setFilters((prev) => ({ ...prev, typeFilter }))

  const setSortBy = (sortBy: SortBy) =>
    setFilters((prev) => ({ ...prev, sortBy }))

  const setSortOrder = (sortOrder: SortOrder) =>
    setFilters((prev) => ({ ...prev, sortOrder }))

  const toggleSortOrder = () =>
    setFilters((prev) => ({
      ...prev,
      sortOrder: prev.sortOrder === 'asc' ? 'desc' : 'asc',
    }))

  const resetFilters = () => setFilters(initialFilters)

  const hasActiveFilters =
    filters.searchQuery !== '' ||
    filters.statusFilter !== 'all' ||
    filters.typeFilter !== 'all' ||
    filters.sortBy !== initialFilters.sortBy ||
    filters.sortOrder !== initialFilters.sortOrder

  const filteredProjects = useMemo(() => {
    let result = [...projects]

    // Search filter
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase()
      result = result.filter(
        (p) =>
          p.title.toLowerCase().includes(query) ||
          p.description.toLowerCase().includes(query)
      )
    }

    // Status filter
    if (filters.statusFilter !== 'all') {
      result = result.filter((p) => p.status === filters.statusFilter)
    }

    // Type filter
    if (filters.typeFilter !== 'all') {
      result = result.filter((p) => p.type === filters.typeFilter)
    }

    // Sort
    result.sort((a, b) => {
      const direction = filters.sortOrder === 'asc' ? 1 : -1

      if (filters.sortBy === 'title') {
        return direction * a.title.localeCompare(b.title, 'ko')
      }

      const dateA = new Date(a[filters.sortBy]).getTime()
      const dateB = new Date(b[filters.sortBy]).getTime()
      return direction * (dateA - dateB)
    })

    return result
  }, [projects, filters])

  return {
    filters,
    setSearchQuery,
    setStatusFilter,
    setTypeFilter,
    setSortBy,
    setSortOrder,
    toggleSortOrder,
    resetFilters,
    filteredProjects,
    hasActiveFilters,
  }
}
