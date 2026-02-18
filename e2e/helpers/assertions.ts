import { Page, expect, Locator } from '@playwright/test'

/**
 * Assert that a toast/alert message is displayed
 */
export async function expectToastMessage(page: Page, message: string) {
  // Check for various toast implementations
  const toast = page.locator(`text=${message}`).first()
  await expect(toast).toBeVisible({ timeout: 10000 })
}

/**
 * Assert that the page navigated to the expected path
 */
export async function expectNavigatedTo(page: Page, path: string) {
  await page.waitForURL(`**${path}`, { timeout: 15000 })
  expect(page.url()).toContain(path)
}

/**
 * Assert that an element is visible on the page
 */
export async function expectElementVisible(page: Page, selector: string) {
  const element = page.locator(selector).first()
  await expect(element).toBeVisible({ timeout: 10000 })
}

/**
 * Assert that text content is visible on the page
 */
export async function expectTextVisible(page: Page, text: string) {
  await expect(page.getByText(text).first()).toBeVisible({ timeout: 10000 })
}

/**
 * Assert that a form field has the expected value
 */
export async function expectFieldValue(locator: Locator, expectedValue: string) {
  await expect(locator).toHaveValue(expectedValue)
}

/**
 * Assert error message is displayed
 */
export async function expectErrorMessage(page: Page, message: string) {
  const errorEl = page.locator(`text=${message}`).first()
  await expect(errorEl).toBeVisible({ timeout: 10000 })
}

/**
 * Assert page title/heading contains expected text
 */
export async function expectHeading(page: Page, text: string) {
  const heading = page.getByRole('heading', { name: text }).first()
  await expect(heading).toBeVisible({ timeout: 10000 })
}
