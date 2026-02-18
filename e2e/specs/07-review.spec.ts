import { test, expect } from '../fixtures/test-fixtures'
import { goToProjectStage } from '../helpers/navigation'
import { mockReviewAPI } from '../fixtures/mock-ai'
import { MOCK_OUTLINE, MOCK_CHAPTER_CONTENT } from '../fixtures/seed-data'
import { expectHeading } from '../helpers/assertions'

test.describe('Review Stage', () => {
  async function setupProjectForReview(page: any, projectId: string) {
    await page.request.put(`/api/projects/${projectId}`, {
      data: {
        outline: MOCK_OUTLINE,
        confirmedAt: new Date().toISOString(),
        stage: 'review',
        status: 'editing',
      },
    })

    for (const ch of MOCK_OUTLINE.chapters) {
      await page.request.post(`/api/projects/${projectId}/chapters`, {
        data: {
          number: ch.number,
          title: ch.title,
          content: MOCK_CHAPTER_CONTENT,
          status: 'editing',
        },
      })
    }
  }

  test('should enter review stage', async ({ page, projectId }) => {
    await setupProjectForReview(page, projectId)
    await goToProjectStage(page, projectId, 'review')

    await expectHeading(page, '검토')
    await expect(page.getByText('품질을 평가하고 최종 콘텐츠를 승인하세요')).toBeVisible()
  })

  test('should run AI quality evaluation', async ({ page, projectId }) => {
    await setupProjectForReview(page, projectId)
    await mockReviewAPI(page)
    await goToProjectStage(page, projectId, 'review')

    // Click evaluate button
    await page.getByRole('button', { name: '평가 실행' }).click()

    // Should show evaluation results
    await expect(page.getByText('종합 점수')).toBeVisible({ timeout: 15000 })
    await expect(page.getByText('일관성')).toBeVisible()
    await expect(page.getByText('몰입도')).toBeVisible()
    await expect(page.getByText('명확성')).toBeVisible()
    await expect(page.getByText('독창성')).toBeVisible()
    await expect(page.getByText('적합도')).toBeVisible()
  })

  test('should show Pass result and feedback', async ({ page, projectId }) => {
    await setupProjectForReview(page, projectId)
    await mockReviewAPI(page)
    await goToProjectStage(page, projectId, 'review')

    // Run evaluation
    await page.getByRole('button', { name: '평가 실행' }).click()

    // Average of (8.5+7.8+9.0+7.5+8.2)/5 = 8.2 >= 7, so "출판 준비 완료" should show
    await expect(page.getByText('출판 준비 완료')).toBeVisible({ timeout: 15000 })

    // Should show AI feedback
    await expect(page.getByText('AI 피드백')).toBeVisible()
    await expect(page.getByText(/전반적으로 잘 작성된 원고/)).toBeVisible()
  })

  test('should allow re-evaluation', async ({ page, projectId }) => {
    await setupProjectForReview(page, projectId)
    await mockReviewAPI(page)
    await goToProjectStage(page, projectId, 'review')

    // First evaluation
    await page.getByRole('button', { name: '평가 실행' }).click()
    await expect(page.getByText('종합 점수')).toBeVisible({ timeout: 15000 })

    // Run evaluation again
    await page.getByRole('button', { name: '평가 실행' }).click()

    // Should still show results (re-evaluated)
    await expect(page.getByText('종합 점수')).toBeVisible({ timeout: 15000 })
  })
})
