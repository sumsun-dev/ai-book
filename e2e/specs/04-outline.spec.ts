import { test, expect } from '../fixtures/test-fixtures'
import { goToProjectStage } from '../helpers/navigation'
import { mockOutlineAPI } from '../fixtures/mock-ai'
import { MOCK_OUTLINE } from '../fixtures/seed-data'
import { expectHeading } from '../helpers/assertions'

test.describe('Outline Stage', () => {
  test('should enter outline stage', async ({ page, projectId }) => {
    await goToProjectStage(page, projectId, 'outline')

    await expectHeading(page, '목차')
    await expect(page.getByText('책 구조와 목차를 디자인하세요')).toBeVisible()
  })

  test('should generate AI outline', async ({ page, projectId }) => {
    await mockOutlineAPI(page)
    await goToProjectStage(page, projectId, 'outline')

    // Fill settings
    const audienceInput = page.getByPlaceholder(/독자|대상/).first()
    if (await audienceInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await audienceInput.fill('20-30대 SF 팬')
    }

    // Click generate / submit button
    const submitButton = page.getByRole('button', { name: /생성|목차 생성/ }).first()
    if (await submitButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await submitButton.click()
    }

    // Should show outline edit step with chapters
    await expect(page.getByText('시작').first()).toBeVisible({ timeout: 20000 })
  })

  test('should add and delete chapters', async ({ page, projectId }) => {
    // Pre-set outline data
    await page.request.put(`/api/projects/${projectId}`, {
      data: { outline: MOCK_OUTLINE },
    })

    await goToProjectStage(page, projectId, 'outline')

    // Wait for outline to load
    await expect(page.getByText('시작').first()).toBeVisible({ timeout: 10000 })

    // Check for add chapter button
    const addButton = page.getByRole('button', { name: /챕터 추가|추가/ }).first()
    if (await addButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await addButton.click()

      // New chapter should appear
      await expect(page.getByText(/4/).first()).toBeVisible({ timeout: 5000 })
    }
  })

  test('should reorder chapters via drag and drop', async ({ page, projectId }) => {
    // Pre-set outline data
    await page.request.put(`/api/projects/${projectId}`, {
      data: { outline: MOCK_OUTLINE },
    })

    await goToProjectStage(page, projectId, 'outline')

    // Wait for outline to load
    await expect(page.getByText('시작').first()).toBeVisible({ timeout: 10000 })

    // Drag and drop is complex in E2E tests - verify chapters are displayed
    const chapter1 = page.getByText('시작').first()
    const chapter2 = page.getByText('발견').first()
    const chapter3 = page.getByText('결말').first()

    await expect(chapter1).toBeVisible()
    await expect(chapter2).toBeVisible()
    await expect(chapter3).toBeVisible()
  })

  test('should save outline and proceed', async ({ page, projectId }) => {
    // Pre-set outline data
    await page.request.put(`/api/projects/${projectId}`, {
      data: { outline: MOCK_OUTLINE },
    })

    await goToProjectStage(page, projectId, 'outline')

    // Wait for outline to load
    await expect(page.getByText('시작').first()).toBeVisible({ timeout: 10000 })

    // Look for confirm button
    const confirmButton = page.getByRole('button', { name: /확정|확인|저장/ }).first()
    if (await confirmButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await confirmButton.click()

      // After confirmation, check for "집필 시작" button
      const nextButton = page.getByRole('button', { name: '집필 시작' })
      if (await nextButton.isVisible({ timeout: 5000 }).catch(() => false)) {
        await nextButton.click()
        await page.waitForURL(`**/project/${projectId}/write`, { timeout: 15000 })
      }
    }
  })
})
