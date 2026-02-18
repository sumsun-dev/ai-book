import { test, expect } from '../fixtures/test-fixtures'
import { goToProjects, goToNewProject } from '../helpers/navigation'
import { expectHeading, expectTextVisible, expectNavigatedTo } from '../helpers/assertions'

test.describe('Project CRUD', () => {
  test('should display projects page', async ({ page }) => {
    await goToProjects(page)
    await expectHeading(page, '내 프로젝트')
  })

  test('should create a new project via /new page', async ({ page }) => {
    await goToNewProject(page)

    // Step 1: Select book type (fiction = 소설)
    await page.getByRole('button', { name: '소설' }).click()

    // Step 2: Fill title
    await page.getByPlaceholder('책 제목').fill('E2E 새 프로젝트')

    // Step 3: Fill description (optional)
    await page.getByPlaceholder('간단한 설명 (선택)').fill('E2E 테스트용 프로젝트')

    // Step 4: Click start button
    await page.getByRole('button', { name: '시작하기' }).click()

    // Should navigate to research page
    await page.waitForURL(/\/project\/.*\/research/, { timeout: 15000 })
  })

  test('should navigate to project detail page', async ({ page, projectId }) => {
    await page.goto(`/project/${projectId}`)
    await page.waitForLoadState('networkidle')

    // Project dashboard should be visible
    await expect(page.locator('text=E2E 테스트 프로젝트').first()).toBeVisible({ timeout: 10000 })
  })

  test('should update project title', async ({ page, projectId }) => {
    // Update via API (as the project page may not have inline edit)
    const response = await page.request.put(`/api/projects/${projectId}`, {
      data: { title: 'E2E 수정된 프로젝트' },
    })

    expect(response.ok()).toBeTruthy()

    // Verify the change
    const getResponse = await page.request.get(`/api/projects/${projectId}`)
    const data = await getResponse.json()
    expect(data.data.title).toBe('E2E 수정된 프로젝트')
  })

  test('should delete a project', async ({ page }) => {
    // First create a project to delete
    const createRes = await page.request.post('/api/projects', {
      data: {
        title: '삭제할 프로젝트',
        type: 'fiction',
        description: '삭제 테스트용',
      },
    })
    const createData = await createRes.json()
    const deleteId = createData.data.id

    await goToProjects(page)

    // Find the project card and hover to reveal delete button
    const projectCard = page.locator(`text=삭제할 프로젝트`).first()
    await expect(projectCard).toBeVisible({ timeout: 10000 })

    // Hover on the project card to show delete button
    const article = projectCard.locator('xpath=ancestor::article').first()
    await article.hover()

    // Set up dialog handler before clicking delete
    page.on('dialog', (dialog) => dialog.accept())

    // Click delete button (trash icon SVG button in the card)
    const deleteButton = article.locator('button').last()
    await deleteButton.click()

    // Wait for the project to disappear
    await expect(projectCard).not.toBeVisible({ timeout: 10000 })
  })

  test('should show empty state when no projects', async ({ browser }) => {
    // Create a fresh user with no projects
    const context = await browser.newContext()
    const page = await context.newPage()

    const uniqueEmail = `e2e-empty-${Date.now()}@example.com`

    // Register
    await page.request.post('http://localhost:3001/api/auth/register', {
      data: {
        email: uniqueEmail,
        password: 'TestPassword123!',
        name: 'Empty User',
      },
    })

    // Login via UI
    await page.goto('http://localhost:3001/auth/login')
    await page.getByLabel('이메일').fill(uniqueEmail)
    await page.getByLabel('비밀번호').fill('TestPassword123!')
    await page.getByRole('button', { name: '로그인' }).click()
    await page.waitForURL('http://localhost:3001/', { timeout: 15000 })

    // Go to projects
    await page.goto('http://localhost:3001/projects')
    await page.waitForLoadState('networkidle')

    // Should show empty state message
    await expect(page.getByText('아직 프로젝트가 없습니다')).toBeVisible({ timeout: 10000 })

    await context.close()
  })
})
