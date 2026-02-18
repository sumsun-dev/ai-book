import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { AgentSettings } from './AgentSettings'
import type { AgentCustomConfig } from '@/types/book'

const defaultProps = {
  projectId: 'proj-1',
  initialConfig: {} as AgentCustomConfig,
  onSave: vi.fn().mockResolvedValue(undefined),
  onClose: vi.fn(),
}

describe('AgentSettings', () => {
  it('should render writer, editor, critic sections', () => {
    render(<AgentSettings {...defaultProps} />)
    expect(screen.getByText('Writer (집필)')).toBeInTheDocument()
    expect(screen.getByText('Editor (편집)')).toBeInTheDocument()
    expect(screen.getByText('Critic (검토)')).toBeInTheDocument()
  })

  it('should render close button', () => {
    const onClose = vi.fn()
    render(<AgentSettings {...defaultProps} onClose={onClose} />)
    fireEvent.click(screen.getByText('취소'))
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('should render creativity slider', () => {
    render(<AgentSettings {...defaultProps} />)
    expect(screen.getByLabelText('창의성')).toBeInTheDocument()
  })

  it('should render pass threshold slider', () => {
    render(<AgentSettings {...defaultProps} />)
    expect(screen.getByLabelText('통과 기준')).toBeInTheDocument()
  })

  it('should call onSave when save button is clicked', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined)
    render(<AgentSettings {...defaultProps} onSave={onSave} />)
    fireEvent.click(screen.getByText('저장'))
    // onSave is async, wait
    await vi.waitFor(() => {
      expect(onSave).toHaveBeenCalledOnce()
    })
  })
})
