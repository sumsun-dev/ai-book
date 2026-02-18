import { test as setup, expect } from '@playwright/test'
import { TEST_USER } from './seed-data'

const AUTH_FILE = 'e2e/.auth/user.json'

setup('authenticate', async ({ page }) => {
  // Step 1: Register test user (ignore if already exists)
  const registerResponse = await page.request.post('/api/auth/register', {
    data: {
      email: TEST_USER.email,
      password: TEST_USER.password,
      name: TEST_USER.name,
    },
  })

  // 201 = created, 409 = already exists (both are fine)
  expect([201, 409]).toContain(registerResponse.status())

  // Step 2: Login via UI to get session cookies
  await page.goto('/auth/login')
  await page.getByLabel('이메일').fill(TEST_USER.email)
  await page.getByLabel('비밀번호').fill(TEST_USER.password)
  await page.getByRole('button', { name: '로그인' }).click()

  // Wait for navigation after login
  await page.waitForURL('/', { timeout: 15000 })

  // Step 3: Save storage state
  await page.context().storageState({ path: AUTH_FILE })
})
