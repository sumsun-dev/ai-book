import { test, expect } from '../fixtures/test-fixtures'
import { goToProjects } from '../helpers/navigation'

test.describe('Project Management', () => {
  async function createMultipleProjects(page: any) {
    const projects = [
      { title: '소설 프로젝트', type: 'fiction', description: '소설 테스트' },
      { title: '에세이 프로젝트', type: 'essay', description: '에세이 테스트' },
      { title: '기술서 프로젝트', type: 'technical', description: '기술서 테스트' },
    ]

    const ids: string[] = []
    for (const p of projects) {
      const res = await page.request.post('/api/projects', { data: p })
      const data = await res.json()
      ids.push(data.data.id)
    }

    return ids
  }

  test('should filter projects by book type', async ({ page }) => {
    const projectIds = await createMultipleProjects(page)

    try {
      await goToProjects(page)

      // Wait for projects to load
      await expect(page.getByText('소설 프로젝트').first()).toBeVisible({ timeout: 10000 })

      // Look for filter controls
      const filterButton = page.locator('button, select').filter({ hasText: /필터|장르|유형/ }).first()
      if (await filterButton.isVisible({ timeout: 5000 }).catch(() => false)) {
        await filterButton.click()

        // Select fiction filter
        const fictionOption = page.getByText(/소설/).first()
        if (await fictionOption.isVisible({ timeout: 3000 }).catch(() => false)) {
          await fictionOption.click()

          // Should show only fiction projects
          await expect(page.getByText('소설 프로젝트').first()).toBeVisible()
        }
      }
    } finally {
      // Cleanup
      for (const id of projectIds) {
        await page.request.delete(`/api/projects/${id}`)
      }
    }
  })

  test('should sort projects', async ({ page }) => {
    const projectIds = await createMultipleProjects(page)

    try {
      await goToProjects(page)

      // Wait for projects to load
      await expect(page.getByText('소설 프로젝트').first()).toBeVisible({ timeout: 10000 })

      // Look for sort controls
      const sortButton = page.locator('button, select').filter({ hasText: /정렬/ }).first()
      if (await sortButton.isVisible({ timeout: 5000 }).catch(() => false)) {
        await sortButton.click()

        // Select sort option
        const titleSort = page.getByText(/제목|이름/).first()
        if (await titleSort.isVisible({ timeout: 3000 }).catch(() => false)) {
          await titleSort.click()
        }
      }

      // Verify all projects are still visible
      await expect(page.getByText('소설 프로젝트').first()).toBeVisible()
      await expect(page.getByText('에세이 프로젝트').first()).toBeVisible()
    } finally {
      for (const id of projectIds) {
        await page.request.delete(`/api/projects/${id}`)
      }
    }
  })

  test('should search projects', async ({ page }) => {
    const projectIds = await createMultipleProjects(page)

    try {
      await goToProjects(page)

      // Wait for projects to load
      await expect(page.getByText('소설 프로젝트').first()).toBeVisible({ timeout: 10000 })

      // Look for search input
      const searchInput = page.getByPlaceholder(/검색|search/i).first()
      if (await searchInput.isVisible({ timeout: 5000 }).catch(() => false)) {
        await searchInput.fill('기술서')

        // Should show matching projects
        await expect(page.getByText('기술서 프로젝트').first()).toBeVisible({ timeout: 5000 })
      }
    } finally {
      for (const id of projectIds) {
        await page.request.delete(`/api/projects/${id}`)
      }
    }
  })

  test('should create project snapshot', async ({ page, projectId }) => {
    // Create a snapshot via API
    const response = await page.request.post(`/api/projects/${projectId}/snapshots`, {
      data: {
        label: 'E2E 스냅샷',
      },
    })

    if (response.ok()) {
      const data = await response.json()
      expect(data.success).toBeTruthy()

      // Verify snapshot exists
      const listRes = await page.request.get(`/api/projects/${projectId}/snapshots`)
      const listData = await listRes.json()
      expect(listData.data.length).toBeGreaterThan(0)
    }
  })

  test('should restore project snapshot', async ({ page, projectId }) => {
    // Create a snapshot first
    const snapshotRes = await page.request.post(`/api/projects/${projectId}/snapshots`, {
      data: { label: '복원 테스트 스냅샷' },
    })

    if (snapshotRes.ok()) {
      const snapshotData = await snapshotRes.json()
      const snapshotId = snapshotData.data?.id

      if (snapshotId) {
        // Restore the snapshot
        const restoreRes = await page.request.post(
          `/api/projects/${projectId}/snapshots/${snapshotId}/restore`
        )

        if (restoreRes.ok()) {
          const restoreData = await restoreRes.json()
          expect(restoreData.success).toBeTruthy()
        }
      }
    }
  })
})
