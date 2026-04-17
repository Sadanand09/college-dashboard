'use client'

import { useEffect, useId } from 'react'
import { Button } from './Button'

interface ConfirmModalProps {
  open: boolean
  title?: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'danger' | 'primary'
  loading?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmModal({
  open,
  title = 'Are you sure?',
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger',
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  const titleId = useId()

  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape' && !loading) onCancel() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onCancel, loading])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => !loading && onCancel()} />
      <div
        className="relative w-full max-w-sm rounded-2xl bg-white dark:bg-slate-800 shadow-2xl p-6"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <div className="flex items-start gap-4 mb-5">
          {variant === 'danger' && (
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
              <svg className="h-5 w-5 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              </svg>
            </div>
          )}
          <div className="min-w-0">
            <h2 id={titleId} className="text-base font-semibold text-gray-900 dark:text-white">{title}</h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">{message}</p>
          </div>
        </div>
        <div className="flex justify-end gap-3">
          <Button variant="outline" size="sm" onClick={onCancel} disabled={loading}>{cancelLabel}</Button>
          <Button variant={variant} size="sm" loading={loading} onClick={onConfirm}>{confirmLabel}</Button>
        </div>
      </div>
    </div>
  )
}
