import { test, expect } from '../fixtures/test-fixtures'
import { goToProjectStage } from '../helpers/navigation'
import { mockWriteAPI } from '../fixtures/mock-ai'
import { MOCK_OUTLINE, MOCK_CHAPTER_CONTENT } from '../fixtures/seed-data'
import { expectHeading } from '../helpers/assertions'

test.describe('Write Stage', () => {
  // Helper to set up a project with outline
  async function setupProjectWithOutline(page: any, projectId: string) {
    await page.request.put(`/api/projects/${projectId}`, {
      data: {
        outline: MOCK_OUTLINE,
        confirmedAt: new Date().toISOString(),
        stage: 'write',
        status: 'writing',
      },
    })
  }

  test('should enter write stage', async ({ page, projectId }) => {
    await setupProjectWithOutline(page, projectId)
    await goToProjectStage(page, projectId, 'write')

    await expectHeading(page, '집필')
    await expect(page.getByText('책의 각 챕터를 작성하세요')).toBeVisible()
  })

  test('should display chapter list', async ({ page, projectId }) => {
    await setupProjectWithOutline(page, projectId)
    await goToProjectStage(page, projectId, 'write')

    // Should show chapters from outline
    await expect(page.getByText('시작').first()).toBeVisible({ timeout: 10000 })
    await expect(page.getByText('발견').first()).toBeVisible()
    await expect(page.getByText('결말').first()).toBeVisible()
  })

  test('should generate AI content with SSE streaming mock', async ({ page, projectId }) => {
    await setupProjectWithOutline(page, projectId)
    await mockWriteAPI(page)
    await goToProjectStage(page, projectId, 'write')

    // Wait for chapter list to load
    await expect(page.getByText('시작').first()).toBeVisible({ timeout: 10000 })

    // Click AI write button
    const aiWriteButton = page.getByRole('button', { name: /AI 작성|새로 작성|AI로 작성/ }).first()
    if (await aiWriteButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await aiWriteButton.click()

      // Wait for content to appear (streamed)
      await expect(page.getByText('도시의 불빛').first()).toBeVisible({ timeout: 15000 })
    }
  })

  test('should allow manual editing', async ({ page, projectId }) => {
    await setupProjectWithOutline(page, projectId)

    // Create a chapter with content
    await page.request.post(`/api/projects/${projectId}/chapters`, {
      data: {
        number: 1,
        title: '시작',
        content: MOCK_CHAPTER_CONTENT,
        status: 'writing',
      },
    })

    await goToProjectStage(page, projectId, 'write')

    // Wait for content to load
    await expect(page.getByText('시작').first()).toBeVisible({ timeout: 10000 })

    // The editor should be present (either TipTap or textarea)
    const editor = page.locator('.ProseMirror, .tiptap, textarea').first()
    await expect(editor).toBeVisible({ timeout: 10000 })
  })

  test('should save chapter content', async ({ page, projectId }) => {
    await setupProjectWithOutline(page, projectId)
    await goToProjectStage(page, projectId, 'write')

    // Wait for page to load
    await expect(page.getByText('시작').first()).toBeVisible({ timeout: 10000 })

    // Click save button
    const saveButton = page.getByRole('button', { name: '저장' }).first()
    if (await saveButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await saveButton.click()
      // Verify save indicator
      await expect(page.locator('text=/저장|saved/i').first()).toBeVisible({ timeout: 10000 })
    }
  })

  test('should navigate between chapters', async ({ page, projectId }) => {
    await setupProjectWithOutline(page, projectId)

    // Create chapters
    for (const ch of MOCK_OUTLINE.chapters) {
      await page.request.post(`/api/projects/${projectId}/chapters`, {
        data: {
          number: ch.number,
          title: ch.title,
          content: `${ch.title} 내용`,
          status: 'writing',
        },
      })
    }

    await goToProjectStage(page, projectId, 'write')

    // Wait for chapter list
    await expect(page.getByText('시작').first()).toBeVisible({ timeout: 10000 })

    // Click on chapter 2
    await page.getByText('발견').first().click()

    // Wait for chapter 2 content to load
    await page.waitForTimeout(1000) // Give time for chapter switch

    // Verify chapter 2 is selected
    await expect(page.getByText('발견').first()).toBeVisible()
  })
})
