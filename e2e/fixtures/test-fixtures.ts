import { test as base, expect, Page } from '@playwright/test'
import { TEST_PROJECT } from './seed-data'
import { mockAllAIAPIs } from './mock-ai'

type TestFixtures = {
  authenticatedPage: Page
  projectId: string
  mockedPage: Page
}

export const test = base.extend<TestFixtures>({
  /**
   * A page that is already authenticated via stored session
   */
  authenticatedPage: async ({ page }, use) => {
    await use(page)
  },

  /**
   * Creates a test project and returns its ID
   */
  projectId: async ({ page }, use) => {
    // Create project via API
    const response = await page.request.post('/api/projects', {
      data: {
        title: TEST_PROJECT.title,
        type: TEST_PROJECT.bookType,
        description: TEST_PROJECT.description,
      },
    })

    expect(response.ok()).toBeTruthy()
    const data = await response.json()
    expect(data.success).toBeTruthy()

    const projectId = data.data.id

    await use(projectId)

    // Cleanup: delete the project after test
    await page.request.delete(`/api/projects/${projectId}`)
  },

  /**
   * A page with all AI APIs mocked
   */
  mockedPage: async ({ page }, use) => {
    await mockAllAIAPIs(page)
    await use(page)
  },
})

export { expect }
