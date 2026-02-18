import { test, expect } from '@playwright/test'
import { TEST_USER } from '../fixtures/seed-data'
import { fillLoginForm, fillRegisterForm } from '../helpers/form'
import { expectNavigatedTo, expectHeading, expectErrorMessage } from '../helpers/assertions'

test.describe('Authentication', () => {
  test('should display register page', async ({ page }) => {
    await page.goto('/auth/register')
    await expectHeading(page, '회원가입')
    await expect(page.getByLabel('이메일')).toBeVisible()
    await expect(page.locator('#password')).toBeVisible()
    await expect(page.locator('#confirmPassword')).toBeVisible()
    await expect(page.getByRole('button', { name: '회원가입' })).toBeVisible()
  })

  test('should register a new user successfully', async ({ page }) => {
    const uniqueEmail = `e2e-register-${Date.now()}@example.com`

    await page.goto('/auth/register')
    await fillRegisterForm(page, 'Test User', uniqueEmail, 'ValidPassword123!')
    await page.getByRole('button', { name: '회원가입' }).click()

    // After successful registration, auto-login redirects to home
    await page.waitForURL('/', { timeout: 15000 })
  })

  test('should display login page', async ({ page }) => {
    await page.goto('/auth/login')
    await expectHeading(page, '로그인')
    await expect(page.getByLabel('이메일')).toBeVisible()
    await expect(page.getByLabel('비밀번호')).toBeVisible()
    await expect(page.getByRole('button', { name: '로그인' })).toBeVisible()
  })

  test('should login successfully', async ({ page }) => {
    await page.goto('/auth/login')
    await fillLoginForm(page, TEST_USER.email, TEST_USER.password)
    await page.getByRole('button', { name: '로그인' }).click()

    // Successful login redirects to home
    await page.waitForURL('/', { timeout: 15000 })
  })

  test('should show error for wrong password', async ({ page }) => {
    await page.goto('/auth/login')
    await fillLoginForm(page, TEST_USER.email, 'WrongPassword123!')
    await page.getByRole('button', { name: '로그인' }).click()

    // Should show error message
    await expectErrorMessage(page, '이메일 또는 비밀번호가 올바르지 않습니다')
  })

  test('should logout', async ({ page }) => {
    // First login
    await page.goto('/auth/login')
    await fillLoginForm(page, TEST_USER.email, TEST_USER.password)
    await page.getByRole('button', { name: '로그인' }).click()
    await page.waitForURL('/', { timeout: 15000 })

    // Find and click logout (check for signOut button/link)
    // The logout mechanism depends on the UI - try common patterns
    const logoutButton = page.getByRole('button', { name: /로그아웃|sign out/i })
    if (await logoutButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await logoutButton.click()
    } else {
      // Try navigating to signout API directly
      await page.goto('/api/auth/signout')
      // Confirm signout if there's a confirmation page
      const confirmButton = page.getByRole('button', { name: /sign out/i })
      if (await confirmButton.isVisible({ timeout: 3000 }).catch(() => false)) {
        await confirmButton.click()
      }
    }

    // After logout, accessing protected route should redirect to login
    await page.goto('/projects')
    await page.waitForURL(/\/auth\/login/, { timeout: 15000 })
  })

  test('should redirect unauthenticated user to login', async ({ browser }) => {
    // Create a fresh context without stored auth
    const context = await browser.newContext()
    const page = await context.newPage()

    await page.goto('/projects')

    // Should redirect to login page
    await page.waitForURL(/\/auth\/login/, { timeout: 15000 })

    await context.close()
  })
})
