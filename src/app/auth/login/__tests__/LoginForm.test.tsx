import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe } from 'vitest-axe'
import LoginForm from '@/components/auth/LoginForm'

// signIn mock
const mockSignIn = vi.fn()
vi.mock('next-auth/react', async () => {
  const actual = await vi.importActual('next-auth/react')
  return {
    ...actual,
    signIn: (...args: unknown[]) => mockSignIn(...args),
  }
})

describe('LoginForm a11y', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSignIn.mockResolvedValue({ error: null })
  })

  it('axe 접근성 위반이 없어야 한다', async () => {
    const { container } = render(<LoginForm />)
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it('이메일 label과 input이 htmlFor+id로 연결되어야 한다', () => {
    render(<LoginForm />)
    const emailInput = screen.getByLabelText('email')
    expect(emailInput).toBeInTheDocument()
    expect(emailInput).toHaveAttribute('id', 'email')
    expect(emailInput).toHaveAttribute('type', 'email')
  })

  it('비밀번호 label과 input이 htmlFor+id로 연결되어야 한다', () => {
    render(<LoginForm />)
    const passwordInput = screen.getByLabelText('password')
    expect(passwordInput).toBeInTheDocument()
    expect(passwordInput).toHaveAttribute('id', 'password')
    expect(passwordInput).toHaveAttribute('type', 'password')
  })

  it('에러 발생 시 role="alert"가 적용되어야 한다', async () => {
    mockSignIn.mockResolvedValue({ error: 'CredentialsSignin' })

    render(<LoginForm />)

    const emailInput = screen.getByLabelText('email')
    const passwordInput = screen.getByLabelText('password')

    await userEvent.type(emailInput, 'test@test.com')
    await userEvent.type(passwordInput, 'wrongpassword')
    fireEvent.submit(screen.getByRole('button', { name: 'submit' }).closest('form')!)

    await waitFor(() => {
      const alert = screen.getByRole('alert')
      expect(alert).toBeInTheDocument()
      expect(alert).toHaveTextContent('invalidCredentials')
    })
  })

  it('에러 시 input에 aria-invalid가 적용되어야 한다', async () => {
    mockSignIn.mockResolvedValue({ error: 'CredentialsSignin' })

    render(<LoginForm />)

    await userEvent.type(screen.getByLabelText('email'), 'test@test.com')
    await userEvent.type(screen.getByLabelText('password'), 'wrongpassword')
    fireEvent.submit(screen.getByRole('button', { name: 'submit' }).closest('form')!)

    await waitFor(() => {
      expect(screen.getByLabelText('email')).toHaveAttribute('aria-invalid', 'true')
      expect(screen.getByLabelText('password')).toHaveAttribute('aria-invalid', 'true')
    })
  })

  it('에러 시 aria-describedby로 에러 메시지가 연결되어야 한다', async () => {
    mockSignIn.mockResolvedValue({ error: 'CredentialsSignin' })

    render(<LoginForm />)

    await userEvent.type(screen.getByLabelText('email'), 'test@test.com')
    await userEvent.type(screen.getByLabelText('password'), 'wrongpassword')
    fireEvent.submit(screen.getByRole('button', { name: 'submit' }).closest('form')!)

    await waitFor(() => {
      const alert = screen.getByRole('alert')
      const alertId = alert.getAttribute('id')
      expect(alertId).toBeTruthy()
      expect(screen.getByLabelText('email')).toHaveAttribute('aria-describedby', alertId)
      expect(screen.getByLabelText('password')).toHaveAttribute('aria-describedby', alertId)
    })
  })
})
