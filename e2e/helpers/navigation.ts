import { Page, expect } from '@playwright/test'

/**
 * Navigate to projects page and wait for load
 */
export async function goToProjects(page: Page) {
  await page.goto('/projects')
  await page.waitForLoadState('networkidle')
}

/**
 * Navigate to a specific project stage
 */
export async function goToProjectStage(
  page: Page,
  projectId: string,
  stage: 'research' | 'outline' | 'write' | 'edit' | 'review'
) {
  await page.goto(`/project/${projectId}/${stage}`)
  await page.waitForLoadState('networkidle')
}

/**
 * Navigate to project dashboard
 */
export async function goToProjectDashboard(page: Page, projectId: string) {
  await page.goto(`/project/${projectId}`)
  await page.waitForLoadState('networkidle')
}

/**
 * Navigate to preview page
 */
export async function goToPreview(page: Page, projectId: string) {
  await page.goto(`/preview/${projectId}`)
  await page.waitForLoadState('networkidle')
}

/**
 * Wait for page to be fully loaded
 */
export async function waitForPageLoad(page: Page) {
  await page.waitForLoadState('domcontentloaded')
  await page.waitForLoadState('networkidle')
}

/**
 * Navigate to new project page
 */
export async function goToNewProject(page: Page) {
  await page.goto('/new')
  await page.waitForLoadState('networkidle')
}
