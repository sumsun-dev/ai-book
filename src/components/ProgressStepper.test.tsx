import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import ProgressStepper from './ProgressStepper'
import type { AgentType } from '@/types/book'

describe('ProgressStepper', () => {
  const defaultProps = {
    currentAgent: null as AgentType | null,
    completedAgents: [] as AgentType[],
    isCompleted: false,
  }

  it('5개 단계를 모두 렌더링한다', () => {
    render(<ProgressStepper {...defaultProps} />)

    expect(screen.getByText('Research')).toBeInTheDocument()
    expect(screen.getByText('Outline')).toBeInTheDocument()
    expect(screen.getByText('Write')).toBeInTheDocument()
    expect(screen.getByText('Edit')).toBeInTheDocument()
    expect(screen.getByText('Review')).toBeInTheDocument()
  })

  it('현재 단계에 animate-pulse 클래스가 적용된다', () => {
    render(
      <ProgressStepper
        currentAgent="writer"
        completedAgents={['research', 'outliner']}
        isCompleted={false}
      />,
    )

    const writeStep = screen.getByText('Write').closest('.flex.flex-col')
    const circle = writeStep?.querySelector('.rounded-full')
    expect(circle?.className).toContain('animate-pulse')
  })

  it('완료된 단계에 체크마크를 표시한다', () => {
    render(
      <ProgressStepper
        currentAgent="outliner"
        completedAgents={['research']}
        isCompleted={false}
      />,
    )

    const researchStep = screen.getByText('Research').closest('.flex.flex-col')
    const circle = researchStep?.querySelector('.rounded-full')
    expect(circle?.textContent).toBe('✓')
  })

  it('대기 중 단계에 이모지를 표시한다', () => {
    render(
      <ProgressStepper
        currentAgent="research"
        completedAgents={[]}
        isCompleted={false}
      />,
    )

    const editStep = screen.getByText('Edit').closest('.flex.flex-col')
    const circle = editStep?.querySelector('.rounded-full')
    expect(circle?.textContent).toContain('📝')
  })

  it('isCompleted=true면 모든 단계가 체크마크이다', () => {
    render(
      <ProgressStepper currentAgent={null} completedAgents={[]} isCompleted={true} />,
    )

    const circles = document.querySelectorAll('.rounded-full')
    circles.forEach((circle) => {
      expect(circle.textContent).toBe('✓')
    })
    expect(circles.length).toBe(5)
  })

  it('완료된 단계 사이 연결선에 bg-green-500이 적용된다', () => {
    const { container } = render(
      <ProgressStepper
        currentAgent="writer"
        completedAgents={['research', 'outliner']}
        isCompleted={false}
      />,
    )

    // 연결선은 h-1 클래스를 가진 div
    const connectors = container.querySelectorAll('.h-1')
    // research→outline 연결선 (첫 번째)은 green
    expect(connectors[0]?.className).toContain('bg-green-500')
    // outliner→writer 연결선 (두 번째)도 green (currentAgent=writer > outliner index)
    expect(connectors[1]?.className).toContain('bg-green-500')
    // writer→editor 연결선 (세 번째)은 gray
    expect(connectors[2]?.className).not.toContain('bg-green-500')
  })
})
