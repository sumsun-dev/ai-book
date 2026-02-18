import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useProjectFilters } from './useProjectFilters'
import type { BookProject } from '@/types/book'

const createProject = (overrides: Partial<BookProject> = {}): BookProject => ({
  id: '1',
  title: '테스트 소설',
  type: 'fiction',
  description: '테스트 설명',
  outline: null,
  chapters: [],
  status: 'draft',
  stage: 'research',
  targetAudience: null,
  targetLength: null,
  tone: null,
  confirmedAt: null,
  userId: null,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-02'),
  ...overrides,
})

const mockProjects: BookProject[] = [
  createProject({
    id: '1',
    title: '가나다 소설',
    type: 'fiction',
    status: 'draft',
    description: '판타지 모험 이야기',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-05'),
  }),
  createProject({
    id: '2',
    title: '라마바 기술서',
    type: 'technical',
    status: 'writing',
    description: 'React 심화',
    createdAt: new Date('2024-01-02'),
    updatedAt: new Date('2024-01-03'),
  }),
  createProject({
    id: '3',
    title: '사아자 에세이',
    type: 'essay',
    status: 'completed',
    description: '일상 에세이',
    createdAt: new Date('2024-01-03'),
    updatedAt: new Date('2024-01-04'),
  }),
]

describe('useProjectFilters', () => {
  it('should return all projects with default filters', () => {
    const { result } = renderHook(() => useProjectFilters(mockProjects))
    expect(result.current.filteredProjects).toHaveLength(3)
  })

  it('should filter by search query (title)', () => {
    const { result } = renderHook(() => useProjectFilters(mockProjects))
    act(() => result.current.setSearchQuery('소설'))
    expect(result.current.filteredProjects).toHaveLength(1)
    expect(result.current.filteredProjects[0].id).toBe('1')
  })

  it('should filter by search query (description, case-insensitive)', () => {
    const { result } = renderHook(() => useProjectFilters(mockProjects))
    act(() => result.current.setSearchQuery('react'))
    expect(result.current.filteredProjects).toHaveLength(1)
    expect(result.current.filteredProjects[0].id).toBe('2')
  })

  it('should filter by status', () => {
    const { result } = renderHook(() => useProjectFilters(mockProjects))
    act(() => result.current.setStatusFilter('completed'))
    expect(result.current.filteredProjects).toHaveLength(1)
    expect(result.current.filteredProjects[0].id).toBe('3')
  })

  it('should filter by type', () => {
    const { result } = renderHook(() => useProjectFilters(mockProjects))
    act(() => result.current.setTypeFilter('technical'))
    expect(result.current.filteredProjects).toHaveLength(1)
    expect(result.current.filteredProjects[0].id).toBe('2')
  })

  it('should sort by title ascending (Korean localeCompare)', () => {
    const { result } = renderHook(() => useProjectFilters(mockProjects))
    act(() => {
      result.current.setSortBy('title')
      result.current.setSortOrder('asc')
    })
    const titles = result.current.filteredProjects.map((p) => p.title)
    expect(titles).toEqual([
      '가나다 소설',
      '라마바 기술서',
      '사아자 에세이',
    ])
  })

  it('should sort by createdAt descending', () => {
    const { result } = renderHook(() => useProjectFilters(mockProjects))
    act(() => {
      result.current.setSortBy('createdAt')
      result.current.setSortOrder('desc')
    })
    expect(result.current.filteredProjects[0].id).toBe('3')
    expect(result.current.filteredProjects[2].id).toBe('1')
  })

  it('should toggle sort order', () => {
    const { result } = renderHook(() => useProjectFilters(mockProjects))
    expect(result.current.filters.sortOrder).toBe('desc')
    act(() => result.current.toggleSortOrder())
    expect(result.current.filters.sortOrder).toBe('asc')
    act(() => result.current.toggleSortOrder())
    expect(result.current.filters.sortOrder).toBe('desc')
  })

  it('should combine search and type filters', () => {
    const { result } = renderHook(() => useProjectFilters(mockProjects))
    act(() => {
      result.current.setSearchQuery('에세이')
      result.current.setTypeFilter('essay')
    })
    expect(result.current.filteredProjects).toHaveLength(1)
    expect(result.current.filteredProjects[0].id).toBe('3')
  })

  it('should return empty when no matches', () => {
    const { result } = renderHook(() => useProjectFilters(mockProjects))
    act(() => result.current.setSearchQuery('존재하지않는'))
    expect(result.current.filteredProjects).toHaveLength(0)
  })

  it('should reset filters', () => {
    const { result } = renderHook(() => useProjectFilters(mockProjects))
    act(() => {
      result.current.setSearchQuery('test')
      result.current.setStatusFilter('completed')
      result.current.setTypeFilter('fiction')
    })
    expect(result.current.hasActiveFilters).toBe(true)
    act(() => result.current.resetFilters())
    expect(result.current.filters.searchQuery).toBe('')
    expect(result.current.filters.statusFilter).toBe('all')
    expect(result.current.filters.typeFilter).toBe('all')
    expect(result.current.hasActiveFilters).toBe(false)
  })
})
