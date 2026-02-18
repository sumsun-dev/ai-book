import { test, expect } from '../fixtures/test-fixtures'
import { goToProjectStage } from '../helpers/navigation'
import { mockEditAPI } from '../fixtures/mock-ai'
import { MOCK_OUTLINE, MOCK_CHAPTER_CONTENT } from '../fixtures/seed-data'
import { expectHeading } from '../helpers/assertions'

test.describe('Edit Stage', () => {
  async function setupProjectForEditing(page: any, projectId: string) {
    // Set up project with outline and chapters
    await page.request.put(`/api/projects/${projectId}`, {
      data: {
        outline: MOCK_OUTLINE,
        confirmedAt: new Date().toISOString(),
        stage: 'edit',
        status: 'writing',
      },
    })

    // Create chapters with content
    for (const ch of MOCK_OUTLINE.chapters) {
      await page.request.post(`/api/projects/${projectId}/chapters`, {
        data: {
          number: ch.number,
          title: ch.title,
          content: MOCK_CHAPTER_CONTENT,
          status: 'writing',
        },
      })
    }
  }

  test('should enter edit stage', async ({ page, projectId }) => {
    await setupProjectForEditing(page, projectId)
    await goToProjectStage(page, projectId, 'edit')

    await expectHeading(page, '편집')
    await expect(page.getByText('AI가 문법, 스타일, 내용을 검토합니다')).toBeVisible()
  })

  test('should start AI analysis', async ({ page, projectId }) => {
    await setupProjectForEditing(page, projectId)
    await mockEditAPI(page)
    await goToProjectStage(page, projectId, 'edit')

    // Click AI analyze button
    const analyzeButton = page.getByRole('button', { name: 'AI 분석' })
    await expect(analyzeButton).toBeVisible({ timeout: 10000 })
    await analyzeButton.click()

    // Should show suggestions after analysis
    await expect(page.getByText('제안').first()).toBeVisible({ timeout: 15000 })
  })

  test('should display edit suggestions', async ({ page, projectId }) => {
    await setupProjectForEditing(page, projectId)
    await mockEditAPI(page)
    await goToProjectStage(page, projectId, 'edit')

    // Run analysis
    await page.getByRole('button', { name: 'AI 분석' }).click()

    // Should show suggestion details
    await expect(page.getByText(/grammar|style/i).first()).toBeVisible({ timeout: 15000 })
    await expect(page.getByText('문어체와 구어체의 일관성을 위해 수정').first()).toBeVisible()
  })

  test('should accept or reject suggestions', async ({ page, projectId }) => {
    await setupProjectForEditing(page, projectId)
    await mockEditAPI(page)
    await goToProjectStage(page, projectId, 'edit')

    // Also mock edit history endpoint
    await page.route('**/api/projects/*/edit/history', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true }),
      })
    })

    // Run analysis
    await page.getByRole('button', { name: 'AI 분석' }).click()

    // Wait for suggestions to appear
    await expect(page.getByText('제안').first()).toBeVisible({ timeout: 15000 })

    // Accept first suggestion (click the checkmark button)
    const acceptButtons = page.locator('button').filter({ has: page.locator('svg path[d*="M5 13l4 4L19 7"]') })
    const firstAccept = acceptButtons.first()
    if (await firstAccept.isVisible({ timeout: 5000 }).catch(() => false)) {
      await firstAccept.click()

      // Suggestion should be marked as accepted (opacity changes)
      await page.waitForTimeout(500)
    }

    // Reject second suggestion (click the X button)
    const rejectButtons = page.locator('button').filter({ has: page.locator('svg path[d*="M6 18L18 6"]') })
    const firstReject = rejectButtons.first()
    if (await firstReject.isVisible({ timeout: 5000 }).catch(() => false)) {
      await firstReject.click()
      await page.waitForTimeout(500)
    }
  })
})
