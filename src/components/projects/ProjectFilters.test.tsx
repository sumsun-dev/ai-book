import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ProjectFilters } from './ProjectFilters'
import type { UseProjectFiltersReturn } from './useProjectFilters'

const createMockFilterHook = (
  overrides: Partial<UseProjectFiltersReturn> = {}
): UseProjectFiltersReturn => ({
  filters: {
    searchQuery: '',
    statusFilter: 'all',
    typeFilter: 'all',
    sortBy: 'updatedAt',
    sortOrder: 'desc',
  },
  setSearchQuery: vi.fn(),
  setStatusFilter: vi.fn(),
  setTypeFilter: vi.fn(),
  setSortBy: vi.fn(),
  setSortOrder: vi.fn(),
  toggleSortOrder: vi.fn(),
  resetFilters: vi.fn(),
  filteredProjects: [],
  hasActiveFilters: false,
  ...overrides,
})

describe('ProjectFilters', () => {
  it('should render search input', () => {
    render(
      <ProjectFilters
        filterHook={createMockFilterHook()}
        totalCount={5}
        filteredCount={5}
      />
    )
    expect(screen.getByLabelText('프로젝트 검색')).toBeInTheDocument()
  })

  it('should call setSearchQuery on input change', () => {
    const setSearchQuery = vi.fn()
    render(
      <ProjectFilters
        filterHook={createMockFilterHook({ setSearchQuery })}
        totalCount={5}
        filteredCount={5}
      />
    )
    fireEvent.change(screen.getByLabelText('프로젝트 검색'), {
      target: { value: '소설' },
    })
    expect(setSearchQuery).toHaveBeenCalledWith('소설')
  })

  it('should render status and type filter selects', () => {
    render(
      <ProjectFilters
        filterHook={createMockFilterHook()}
        totalCount={5}
        filteredCount={5}
      />
    )
    expect(screen.getByLabelText('상태 필터')).toBeInTheDocument()
    expect(screen.getByLabelText('장르 필터')).toBeInTheDocument()
  })

  it('should call toggleSortOrder on button click', () => {
    const toggleSortOrder = vi.fn()
    render(
      <ProjectFilters
        filterHook={createMockFilterHook({ toggleSortOrder })}
        totalCount={5}
        filteredCount={5}
      />
    )
    fireEvent.click(screen.getByLabelText('내림차순'))
    expect(toggleSortOrder).toHaveBeenCalledOnce()
  })

  it('should show reset button when filters are active', () => {
    render(
      <ProjectFilters
        filterHook={createMockFilterHook({ hasActiveFilters: true })}
        totalCount={5}
        filteredCount={3}
      />
    )
    expect(screen.getByText('초기화')).toBeInTheDocument()
  })

  it('should not show reset button when no filters active', () => {
    render(
      <ProjectFilters
        filterHook={createMockFilterHook({ hasActiveFilters: false })}
        totalCount={5}
        filteredCount={5}
      />
    )
    expect(screen.queryByText('초기화')).not.toBeInTheDocument()
  })

  it('should display filtered/total count', () => {
    render(
      <ProjectFilters
        filterHook={createMockFilterHook({ hasActiveFilters: true })}
        totalCount={10}
        filteredCount={3}
      />
    )
    expect(screen.getByText('3 / 10개')).toBeInTheDocument()
  })
})
