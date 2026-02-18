import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import { axe } from 'vitest-axe'
import React, { useContext } from 'react'
import { Toast } from '../Toast'
import { ToastProvider, ToastContext } from '../ToastProvider'
import type { Toast as ToastType } from '@/hooks/useToast'

const mockToast: ToastType = {
  id: 'test-toast-1',
  type: 'error',
  message: '에러가 발생했습니다.',
  duration: 3000,
}

describe('Toast a11y', () => {
  it('Toast에 role="alert"가 있어야 한다', () => {
    render(<Toast toast={mockToast} onDismiss={vi.fn()} />)
    const alert = screen.getByRole('alert')
    expect(alert).toBeInTheDocument()
    expect(alert).toHaveTextContent('에러가 발생했습니다.')
  })

  it('axe 접근성 위반이 없어야 한다', async () => {
    const { container } = render(<Toast toast={mockToast} onDismiss={vi.fn()} />)
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })
})

function TestTrigger({ toastOptions }: { toastOptions: ToastType }) {
  const context = useContext(ToastContext)
  return (
    <button onClick={() => context?.addToast(toastOptions)}>
      Add Toast
    </button>
  )
}

describe('ToastProvider a11y', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('toast container에 role="region"과 aria-live="assertive"가 있어야 한다', () => {
    render(
      <ToastProvider>
        <TestTrigger
          toastOptions={{
            id: 'test-region',
            type: 'success',
            message: '성공!',
            duration: 3000,
          }}
        />
      </ToastProvider>,
    )

    act(() => {
      screen.getByText('Add Toast').click()
    })

    const region = screen.getByRole('region')
    expect(region).toBeInTheDocument()
    expect(region).toHaveAttribute('aria-live', 'assertive')
  })

  it('타이머 후 toast가 자동 제거되어야 한다', () => {
    render(
      <ToastProvider>
        <TestTrigger
          toastOptions={{
            id: 'auto-remove',
            type: 'info',
            message: '자동 제거 토스트',
            duration: 2000,
          }}
        />
      </ToastProvider>,
    )

    act(() => {
      screen.getByText('Add Toast').click()
    })

    expect(screen.getByText('자동 제거 토스트')).toBeInTheDocument()

    act(() => {
      vi.advanceTimersByTime(2100)
    })

    expect(screen.queryByText('자동 제거 토스트')).not.toBeInTheDocument()
  })
})
