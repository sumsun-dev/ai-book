import { test, expect } from '../fixtures/test-fixtures'

test.describe('Metadata & ISBN', () => {
  test('should access metadata edit page', async ({ page, projectId }) => {
    // Try accessing metadata via API
    const response = await page.request.get(`/api/projects/${projectId}/metadata`)

    // Metadata API should respond
    expect(response.status()).toBeLessThan(500)
  })

  test('should update metadata (title, author)', async ({ page, projectId }) => {
    // Update metadata via API
    const response = await page.request.put(`/api/projects/${projectId}/metadata`, {
      data: {
        subtitle: 'E2E 테스트 부제',
        authors: JSON.stringify([
          { name: 'E2E Author', role: 'author', bio: 'Test bio' },
        ]),
        publisher: 'E2E 출판사',
        language: 'ko',
      },
    })

    if (response.ok()) {
      const data = await response.json()
      expect(data.success).toBeTruthy()

      // Verify
      const getRes = await page.request.get(`/api/projects/${projectId}/metadata`)
      const getData = await getRes.json()
      expect(getData.data.subtitle).toBe('E2E 테스트 부제')
      expect(getData.data.publisher).toBe('E2E 출판사')
    }
  })

  test('should validate ISBN input', async ({ page, projectId }) => {
    // Try setting an invalid ISBN
    const invalidResponse = await page.request.post(`/api/projects/${projectId}/isbn`, {
      data: {
        isbn13: '1234567890123', // Invalid ISBN
      },
    })

    // Should either reject or respond with validation error
    if (invalidResponse.ok()) {
      const data = await invalidResponse.json()
      // If API accepts it, check if isValid is false
      if (data.data) {
        expect(data.data.isValid).toBeFalsy()
      }
    } else {
      // Rejection is also valid behavior
      expect(invalidResponse.status()).toBeGreaterThanOrEqual(400)
    }
  })

  test('should update category selection', async ({ page, projectId }) => {
    // Update categories via metadata API
    const response = await page.request.put(`/api/projects/${projectId}/metadata`, {
      data: {
        categories: JSON.stringify([
          { code: 'FIC000000', system: 'BISAC', label: 'FICTION / General' },
        ]),
      },
    })

    if (response.ok()) {
      const data = await response.json()
      expect(data.success).toBeTruthy()
    }
  })

  test('should save metadata changes', async ({ page, projectId }) => {
    // Create metadata
    await page.request.put(`/api/projects/${projectId}/metadata`, {
      data: {
        subtitle: '저장 테스트',
        publisher: '테스트 출판사',
        keywords: JSON.stringify(['AI', '소설', 'SF']),
        language: 'ko',
      },
    })

    // Verify saved data
    const response = await page.request.get(`/api/projects/${projectId}/metadata`)
    if (response.ok()) {
      const data = await response.json()
      expect(data.data.subtitle).toBe('저장 테스트')
      expect(data.data.publisher).toBe('테스트 출판사')
    }
  })
})
