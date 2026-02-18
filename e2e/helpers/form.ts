import { Page } from '@playwright/test'

/**
 * Fill login form with email and password
 */
export async function fillLoginForm(page: Page, email: string, password: string) {
  await page.getByLabel('이메일').fill(email)
  await page.getByLabel('비밀번호').fill(password)
}

/**
 * Fill register form with name, email, and password
 */
export async function fillRegisterForm(
  page: Page,
  name: string,
  email: string,
  password: string
) {
  await page.getByLabel('이름').fill(name)
  await page.getByLabel('이메일').fill(email)
  // Use more specific selectors since there are two password fields
  await page.locator('#password').fill(password)
  await page.locator('#confirmPassword').fill(password)
}

/**
 * Create a project via the /new page UI
 */
export async function createProjectViaUI(
  page: Page,
  title: string,
  bookType: string
) {
  await page.goto('/new')
  await page.waitForLoadState('networkidle')

  // Step 1: Select book type
  await page.getByRole('button', { name: getBookTypeLabel(bookType) }).click()

  // Step 2: Fill title
  await page.getByPlaceholder('책 제목').fill(title)

  // Step 3: Click create button
  await page.getByRole('button', { name: '시작하기' }).click()

  // Wait for navigation to research page
  await page.waitForURL(/\/project\/.*\/research/, { timeout: 15000 })
}

/**
 * Create a project via the /projects page modal
 */
export async function createProjectViaModal(
  page: Page,
  title: string,
  description: string,
  bookType?: string
) {
  await page.goto('/projects')
  await page.waitForLoadState('networkidle')

  // Click new project button
  await page.getByRole('button', { name: '새 프로젝트' }).click()

  // Fill form
  await page.getByPlaceholder('책 제목을 입력하세요').fill(title)

  // Select book type if specified
  if (bookType) {
    await page.getByRole('button', { name: getBookTypeLabel(bookType) }).click()
  }

  await page.getByPlaceholder('책에 대한 간단한 설명').fill(description)

  // Submit
  await page.getByRole('button', { name: '프로젝트 생성' }).click()
}

function getBookTypeLabel(bookType: string): string {
  const labels: Record<string, string> = {
    fiction: '소설',
    nonfiction: '논픽션',
    selfhelp: '자기계발',
    technical: '기술서적',
    essay: '에세이',
    children: '동화',
    poetry: '시집',
  }
  return labels[bookType] || bookType
}
