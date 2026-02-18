'use client'

import { useState, useCallback, useEffect } from 'react'
import type { ProjectSnapshot } from '@/types/book'

interface UseVersionHistoryProps {
  projectId: string
}

interface UseVersionHistoryReturn {
  snapshots: ProjectSnapshot[]
  isLoading: boolean
  createSnapshot: (label: string) => Promise<void>
  restoreSnapshot: (snapshotId: string) => Promise<void>
  deleteSnapshot: (snapshotId: string) => Promise<void>
  refreshSnapshots: () => Promise<void>
}

export function useVersionHistory({
  projectId,
}: UseVersionHistoryProps): UseVersionHistoryReturn {
  const [snapshots, setSnapshots] = useState<ProjectSnapshot[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const refreshSnapshots = useCallback(async () => {
    try {
      setIsLoading(true)
      const res = await fetch(`/api/projects/${projectId}/snapshots`)
      const data = await res.json()
      if (data.success) {
        setSnapshots(
          data.data.map((s: ProjectSnapshot & { createdAt: string }) => ({
            ...s,
            createdAt: new Date(s.createdAt),
          }))
        )
      }
    } catch {
      // silent fail
    } finally {
      setIsLoading(false)
    }
  }, [projectId])

  useEffect(() => {
    refreshSnapshots()
  }, [refreshSnapshots])

  const createSnapshot = useCallback(
    async (label: string) => {
      const res = await fetch(`/api/projects/${projectId}/snapshots`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label }),
      })
      const data = await res.json()
      if (data.success) {
        await refreshSnapshots()
      }
    },
    [projectId, refreshSnapshots]
  )

  const restoreSnapshot = useCallback(
    async (snapshotId: string) => {
      const res = await fetch(
        `/api/projects/${projectId}/snapshots/${snapshotId}/restore`,
        { method: 'POST' }
      )
      const data = await res.json()
      if (data.success) {
        await refreshSnapshots()
      }
    },
    [projectId, refreshSnapshots]
  )

  const deleteSnapshot = useCallback(
    async (snapshotId: string) => {
      const res = await fetch(`/api/projects/${projectId}/snapshots`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ snapshotId }),
      })
      const data = await res.json()
      if (data.success) {
        setSnapshots((prev) => prev.filter((s) => s.id !== snapshotId))
      }
    },
    [projectId]
  )

  return {
    snapshots,
    isLoading,
    createSnapshot,
    restoreSnapshot,
    deleteSnapshot,
    refreshSnapshots,
  }
}
