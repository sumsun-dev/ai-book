'use client'

import { useCallback, useContext } from 'react'
import { ToastContext } from '@/components/ui/ToastProvider'

export type ToastType = 'success' | 'error' | 'warning' | 'info'

export interface ToastAction {
  label: string
  onClick: () => void
}

export interface Toast {
  id: string
  type: ToastType
  message: string
  action?: ToastAction
  duration?: number
}

export interface ToastOptions {
  type: ToastType
  message: string
  action?: ToastAction
  duration?: number
}

export function useToast() {
  const context = useContext(ToastContext)

  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }

  const { addToast, removeToast, toasts } = context

  const showToast = useCallback(
    (options: ToastOptions) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
      const toast: Toast = {
        id,
        ...options,
        duration: options.duration ?? (options.type === 'error' ? 5000 : 3000),
      }
      addToast(toast)
      return id
    },
    [addToast]
  )

  const dismissToast = useCallback(
    (id: string) => {
      removeToast(id)
    },
    [removeToast]
  )

  return {
    toasts,
    showToast,
    dismissToast,
  }
}
