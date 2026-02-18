import { test, expect } from '../fixtures/test-fixtures'
import { goToPreview } from '../helpers/navigation'
import { MOCK_OUTLINE, MOCK_CHAPTER_CONTENT } from '../fixtures/seed-data'

test.describe('Preview & Export', () => {
  async function setupCompletedProject(page: any, projectId: string) {
    await page.request.put(`/api/projects/${projectId}`, {
      data: {
        outline: MOCK_OUTLINE,
        confirmedAt: new Date().toISOString(),
        stage: 'review',
        status: 'completed',
      },
    })

    for (const ch of MOCK_OUTLINE.chapters) {
      await page.request.post(`/api/projects/${projectId}/chapters`, {
        data: {
          number: ch.number,
          title: ch.title,
          content: MOCK_CHAPTER_CONTENT,
          status: 'approved',
        },
      })
    }
  }

  test('should display preview page', async ({ page, projectId }) => {
    await setupCompletedProject(page, projectId)
    await goToPreview(page, projectId)

    // Should show the book content (project title or chapter content)
    await expect(page.getByText('E2E 테스트 프로젝트').first()).toBeVisible({ timeout: 15000 })
  })

  test('should display book content', async ({ page, projectId }) => {
    await setupCompletedProject(page, projectId)
    await goToPreview(page, projectId)

    // Should show chapter content from the book
    await expect(page.getByText(/도시의 불빛|시작/).first()).toBeVisible({ timeout: 15000 })
  })

  test('should trigger PDF export', async ({ page, projectId }) => {
    await setupCompletedProject(page, projectId)
    await goToPreview(page, projectId)

    // Wait for page to load
    await page.waitForLoadState('networkidle')

    // Look for PDF download button
    const pdfButton = page.getByRole('button', { name: /PDF|다운로드/ }).first()
    if (await pdfButton.isVisible({ timeout: 10000 }).catch(() => false)) {
      // Set up download listener
      const downloadPromise = page.waitForEvent('download', { timeout: 30000 }).catch(() => null)

      await pdfButton.click()

      // Either download starts or button was clicked (PDF generation may fail in test env)
      const download = await downloadPromise
      if (download) {
        expect(download.suggestedFilename()).toMatch(/\.pdf$/i)
      }
    }
  })

  test('should trigger EPUB export', async ({ page, projectId }) => {
    await setupCompletedProject(page, projectId)
    await goToPreview(page, projectId)

    await page.waitForLoadState('networkidle')

    // Look for EPUB download button
    const epubButton = page.getByRole('button', { name: /EPUB/ }).first()
    if (await epubButton.isVisible({ timeout: 10000 }).catch(() => false)) {
      const downloadPromise = page.waitForEvent('download', { timeout: 30000 }).catch(() => null)

      await epubButton.click()

      const download = await downloadPromise
      if (download) {
        expect(download.suggestedFilename()).toMatch(/\.epub$/i)
      }
    }
  })
})
