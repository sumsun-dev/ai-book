'use client'

import { useState } from 'react'
import { useVersionHistory } from '@/hooks/useVersionHistory'
import { getStageLabel } from '@/lib/utils/project-stats'

interface VersionHistoryProps {
  projectId: string
  onRestore?: () => void
}

export function VersionHistory({
  projectId,
  onRestore,
}: VersionHistoryProps) {
  const {
    snapshots,
    isLoading,
    createSnapshot,
    restoreSnapshot,
    deleteSnapshot,
  } = useVersionHistory({ projectId })

  const [newLabel, setNewLabel] = useState('')
  const [isCreating, setIsCreating] = useState(false)

  const handleCreate = async () => {
    if (!newLabel.trim()) return
    setIsCreating(true)
    await createSnapshot(newLabel.trim())
    setNewLabel('')
    setIsCreating(false)
  }

  const handleRestore = async (snapshotId: string) => {
    if (!confirm('이 버전으로 복원하시겠습니까? 현재 상태는 자동으로 백업됩니다.'))
      return
    await restoreSnapshot(snapshotId)
    onRestore?.()
  }

  const handleDelete = async (snapshotId: string) => {
    if (!confirm('이 스냅샷을 삭제하시겠습니까?')) return
    await deleteSnapshot(snapshotId)
  }

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
        버전 관리
      </h3>

      {/* Create snapshot */}
      <div className="flex gap-2">
        <input
          type="text"
          value={newLabel}
          onChange={(e) => setNewLabel(e.target.value)}
          placeholder="스냅샷 레이블..."
          className="flex-1 px-3 py-2 text-sm bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-500 rounded focus:outline-none focus:border-neutral-400 dark:focus:border-neutral-600 transition-colors"
          onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
          aria-label="스냅샷 레이블"
        />
        <button
          onClick={handleCreate}
          disabled={isCreating || !newLabel.trim()}
          className="px-4 py-2 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-sm font-medium rounded transition-all hover:bg-neutral-700 dark:hover:bg-neutral-200 disabled:opacity-50"
        >
          저장
        </button>
      </div>

      {/* Snapshot list */}
      {isLoading ? (
        <div className="text-center py-4 text-sm text-neutral-500 dark:text-neutral-400">
          로딩 중...
        </div>
      ) : snapshots.length === 0 ? (
        <div className="text-center py-4 text-sm text-neutral-500 dark:text-neutral-400">
          저장된 버전이 없습니다
        </div>
      ) : (
        <div className="space-y-2 max-h-80 overflow-y-auto">
          {snapshots.map((snapshot) => (
            <div
              key={snapshot.id}
              className="p-3 rounded border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-neutral-900 dark:text-white">
                  {snapshot.label}
                </span>
                <span className="text-xs text-neutral-400 dark:text-neutral-500">
                  {getStageLabel(snapshot.stage)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-neutral-400 dark:text-neutral-500">
                  {new Date(snapshot.createdAt).toLocaleString('ko-KR')}
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleRestore(snapshot.id)}
                    className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    복원
                  </button>
                  <button
                    onClick={() => handleDelete(snapshot.id)}
                    className="text-xs text-red-500 dark:text-red-400 hover:underline"
                  >
                    삭제
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
