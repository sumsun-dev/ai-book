import { Page } from '@playwright/test'
import {
  MOCK_RESEARCH_QUESTIONS,
  MOCK_RESEARCH_SUMMARY,
  MOCK_OUTLINE,
  MOCK_CHAPTER_CONTENT,
  MOCK_EDIT_SUGGESTIONS,
  MOCK_EVALUATION,
  MOCK_STREAM_RESPONSE,
} from './seed-data'

/**
 * Mock research questions API
 */
export async function mockResearchQuestionsAPI(page: Page) {
  await page.route('**/api/projects/*/research/questions', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ questions: MOCK_RESEARCH_QUESTIONS }),
    })
  })
}

/**
 * Mock research plan API
 */
export async function mockResearchPlanAPI(page: Page) {
  await page.route('**/api/projects/*/research/plan', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ summary: MOCK_RESEARCH_SUMMARY }),
    })
  })
}

/**
 * Mock outline generation API
 */
export async function mockOutlineAPI(page: Page) {
  await page.route('**/api/projects/*/outline/generate', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ outline: MOCK_OUTLINE }),
    })
  })
}

/**
 * Mock write API (SSE streaming)
 */
export async function mockWriteAPI(page: Page) {
  await page.route('**/api/projects/*/write', (route) => {
    if (route.request().method() === 'POST') {
      route.fulfill({
        status: 200,
        contentType: 'text/plain; charset=utf-8',
        body: MOCK_STREAM_RESPONSE,
      })
    } else {
      route.continue()
    }
  })
}

/**
 * Mock edit analyze API
 */
export async function mockEditAPI(page: Page) {
  await page.route('**/api/projects/*/edit/analyze', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ suggestions: MOCK_EDIT_SUGGESTIONS }),
    })
  })
}

/**
 * Mock review evaluate API
 */
export async function mockReviewAPI(page: Page) {
  await page.route('**/api/projects/*/review/evaluate', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ evaluation: MOCK_EVALUATION }),
    })
  })
}

/**
 * Mock all AI APIs at once
 */
export async function mockAllAIAPIs(page: Page) {
  await mockResearchQuestionsAPI(page)
  await mockResearchPlanAPI(page)
  await mockOutlineAPI(page)
  await mockWriteAPI(page)
  await mockEditAPI(page)
  await mockReviewAPI(page)
}

/**
 * Mock generate API for cover generation
 */
export async function mockCoverGenerateAPI(page: Page) {
  await page.route('**/api/cover', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        imageUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      }),
    })
  })
}

/**
 * Mock stream API for page-level generation
 */
export async function mockPageGenerateAPI(page: Page) {
  await page.route('**/api/projects/*/chapters/*/pages/generate', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'text/plain; charset=utf-8',
      body: MOCK_CHAPTER_CONTENT,
    })
  })
}
