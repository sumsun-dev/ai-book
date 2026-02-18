import { test, expect } from '../fixtures/test-fixtures'
import { goToProjectStage } from '../helpers/navigation'
import { mockResearchQuestionsAPI, mockResearchPlanAPI } from '../fixtures/mock-ai'
import { expectHeading } from '../helpers/assertions'

test.describe('Research Stage', () => {
  test('should enter research stage', async ({ page, projectId }) => {
    await goToProjectStage(page, projectId, 'research')

    // Should show research page header
    await expectHeading(page, '리서치')
    await expect(page.getByText('책의 컨셉과 방향을 정의하세요')).toBeVisible()
  })

  test('should generate AI questions after submitting idea', async ({ page, projectId }) => {
    await mockResearchQuestionsAPI(page)
    await goToProjectStage(page, projectId, 'research')

    // Fill initial idea
    await page.getByPlaceholder('책 아이디어, 주제 또는 컨셉을 설명해주세요').fill(
      'AI가 자의식을 갖게 되는 미래 도시의 이야기'
    )

    // Click submit button
    await page.getByRole('button', { name: '아이디어 발전시키기' }).click()

    // Should show first question
    await expect(page.getByText('질문 1 / 3')).toBeVisible({ timeout: 15000 })
    await expect(page.getByText('이 이야기의 주인공은 어떤 인물인가요?')).toBeVisible()
  })

  test('should allow answering research questions', async ({ page, projectId }) => {
    await mockResearchQuestionsAPI(page)
    await mockResearchPlanAPI(page)
    await goToProjectStage(page, projectId, 'research')

    // Submit initial idea
    await page.getByPlaceholder('책 아이디어, 주제 또는 컨셉을 설명해주세요').fill(
      'AI가 자의식을 갖게 되는 미래 도시의 이야기'
    )
    await page.getByRole('button', { name: '아이디어 발전시키기' }).click()
    await expect(page.getByText('질문 1 / 3')).toBeVisible({ timeout: 15000 })

    // Answer question 1
    await page.getByPlaceholder('답변을 입력하세요').fill('30대 AI 연구원')
    await page.getByRole('button', { name: '다음 질문' }).click()

    // Answer question 2
    await expect(page.getByText('질문 2 / 3')).toBeVisible({ timeout: 10000 })
    await page.getByPlaceholder('답변을 입력하세요').fill('2050년 서울')
    await page.getByRole('button', { name: '다음 질문' }).click()

    // Answer question 3 (last question)
    await expect(page.getByText('질문 3 / 3')).toBeVisible({ timeout: 10000 })
    await page.getByPlaceholder('답변을 입력하세요').fill('AI의 자의식과 인간의 윤리적 딜레마')
    await page.getByRole('button', { name: '완료 및 계획 생성' }).click()

    // Should show research complete
    await expect(page.getByText('리서치 완료')).toBeVisible({ timeout: 15000 })
  })

  test('should save research data', async ({ page, projectId }) => {
    // Pre-fill research data via API
    await page.request.put(`/api/projects/${projectId}/research`, {
      data: {
        initialIdea: 'AI 자의식 소설',
        aiQuestions: JSON.stringify([{ id: 'q1', question: '주인공은?', category: 'character' }]),
        userAnswers: JSON.stringify([{ questionId: 'q1', answer: 'AI 연구원' }]),
        findings: '<p>완성된 리서치</p>',
      },
    })

    await goToProjectStage(page, projectId, 'research')

    // Should show complete state with saved data
    await expect(page.getByText('리서치 완료').first()).toBeVisible({ timeout: 15000 })
  })

  test('should proceed to next stage', async ({ page, projectId }) => {
    // Pre-fill research data via API
    await page.request.put(`/api/projects/${projectId}/research`, {
      data: {
        initialIdea: 'AI 자의식 소설',
        aiQuestions: JSON.stringify([{ id: 'q1', question: '주인공은?', category: 'character' }]),
        userAnswers: JSON.stringify([{ questionId: 'q1', answer: 'AI 연구원' }]),
        findings: '<p>완성된 리서치</p>',
      },
    })

    await goToProjectStage(page, projectId, 'research')

    // Wait for complete state
    await expect(page.getByText('리서치 완료').first()).toBeVisible({ timeout: 15000 })

    // Click next stage button
    await page.getByRole('button', { name: '목차로 이동' }).click()

    // Should navigate to outline page
    await page.waitForURL(`**/project/${projectId}/outline`, { timeout: 15000 })
  })
})
