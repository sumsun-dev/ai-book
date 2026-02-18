import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ProjectDashboard } from './ProjectDashboard'
import type { BookProject } from '@/types/book'

const mockPush = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}))

const mockProject: BookProject = {
  id: 'proj-1',
  title: '테스트 프로젝트',
  type: 'fiction',
  description: '테스트 설명',
  outline: null,
  chapters: [
    {
      id: 'ch1',
      number: 1,
      title: '1장',
      content: '챕터 내용 테스트',
      status: 'approved',
      revisions: [],
    },
    {
      id: 'ch2',
      number: 2,
      title: '2장',
      content: '',
      status: 'writing',
      revisions: [],
    },
  ],
  status: 'writing',
  stage: 'write',
  targetAudience: null,
  targetLength: null,
  tone: null,
  confirmedAt: null,
  userId: null,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-02-01'),
}

describe('ProjectDashboard', () => {
  beforeEach(() => {
    mockPush.mockClear()
  })

  it('should render project title and description', () => {
    render(<ProjectDashboard project={mockProject} />)
    expect(screen.getByText('테스트 프로젝트')).toBeInTheDocument()
    expect(screen.getByText('테스트 설명')).toBeInTheDocument()
  })

  it('should show stage progress with current stage highlighted', () => {
    render(<ProjectDashboard project={mockProject} />)
    expect(screen.getByText('리서치')).toBeInTheDocument()
    expect(screen.getByText('집필')).toBeInTheDocument()
  })

  it('should display stats cards', () => {
    render(<ProjectDashboard project={mockProject} />)
    expect(screen.getByText('전체 챕터')).toBeInTheDocument()
    expect(screen.getByText('2개')).toBeInTheDocument()
  })

  it('should navigate to stage on continue button click', () => {
    render(<ProjectDashboard project={mockProject} />)
    fireEvent.click(screen.getByText('집필 계속하기'))
    expect(mockPush).toHaveBeenCalledWith('/project/proj-1/write')
  })

  it('should navigate to chapter on row click', () => {
    render(<ProjectDashboard project={mockProject} />)
    fireEvent.click(screen.getByText('1장'))
    expect(mockPush).toHaveBeenCalledWith(
      '/project/proj-1/write?chapter=1'
    )
  })
})
