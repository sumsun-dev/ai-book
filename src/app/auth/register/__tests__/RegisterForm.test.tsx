import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe } from 'vitest-axe'
import RegisterForm from '@/components/auth/RegisterForm'

describe('RegisterForm a11y', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('axe 접근성 위반이 없어야 한다', async () => {
    const { container } = render(<RegisterForm />)
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it('이름 label과 input이 htmlFor+id로 연결되어야 한다', () => {
    render(<RegisterForm />)
    const nameInput = screen.getByLabelText(/name/)
    expect(nameInput).toBeInTheDocument()
    expect(nameInput).toHaveAttribute('id', 'name')
  })

  it('이메일 label과 input이 htmlFor+id로 연결되어야 한다', () => {
    render(<RegisterForm />)
    const emailInput = screen.getByLabelText('email')
    expect(emailInput).toBeInTheDocument()
    expect(emailInput).toHaveAttribute('id', 'email')
  })

  it('비밀번호 label과 input이 htmlFor+id로 연결되어야 한다', () => {
    render(<RegisterForm />)
    const passwordInput = screen.getByLabelText('password', { exact: true })
    expect(passwordInput).toBeInTheDocument()
    expect(passwordInput).toHaveAttribute('id', 'password')
  })

  it('비밀번호 확인 label과 input이 htmlFor+id로 연결되어야 한다', () => {
    render(<RegisterForm />)
    const confirmInput = screen.getByLabelText('confirmPassword')
    expect(confirmInput).toBeInTheDocument()
    expect(confirmInput).toHaveAttribute('id', 'confirmPassword')
  })

  it('에러 발생 시 role="alert"가 적용되어야 한다', async () => {
    render(<RegisterForm />)

    await userEvent.type(screen.getByLabelText('password', { exact: true }), 'pass1234')
    await userEvent.type(screen.getByLabelText('confirmPassword'), 'different')
    fireEvent.submit(screen.getByRole('button', { name: 'submit' }).closest('form')!)

    await waitFor(() => {
      const alert = screen.getByRole('alert')
      expect(alert).toBeInTheDocument()
      expect(alert).toHaveTextContent('passwordMismatch')
    })
  })

  it('에러 시 관련 input에 aria-invalid가 적용되어야 한다', async () => {
    render(<RegisterForm />)

    await userEvent.type(screen.getByLabelText('password', { exact: true }), 'pass1234')
    await userEvent.type(screen.getByLabelText('confirmPassword'), 'different')
    fireEvent.submit(screen.getByRole('button', { name: 'submit' }).closest('form')!)

    await waitFor(() => {
      expect(screen.getByLabelText('password', { exact: true })).toHaveAttribute('aria-invalid', 'true')
      expect(screen.getByLabelText('confirmPassword')).toHaveAttribute('aria-invalid', 'true')
    })
  })

  it('에러 시 aria-describedby로 에러 메시지가 연결되어야 한다', async () => {
    render(<RegisterForm />)

    await userEvent.type(screen.getByLabelText('password', { exact: true }), 'pass1234')
    await userEvent.type(screen.getByLabelText('confirmPassword'), 'different')
    fireEvent.submit(screen.getByRole('button', { name: 'submit' }).closest('form')!)

    await waitFor(() => {
      const alert = screen.getByRole('alert')
      const alertId = alert.getAttribute('id')
      expect(alertId).toBeTruthy()
      expect(screen.getByLabelText('password', { exact: true })).toHaveAttribute('aria-describedby', alertId)
      expect(screen.getByLabelText('confirmPassword')).toHaveAttribute('aria-describedby', alertId)
    })
  })
})
