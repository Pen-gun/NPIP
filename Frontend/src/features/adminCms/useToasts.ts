import { useState } from 'react'
import type { Toast, ToastInput } from './uiTypes'
import { createId } from './utils'

export const useToasts = (timeoutMs = 3500) => {
  const [toasts, setToasts] = useState<Toast[]>([])

  const pushToast = (toast: ToastInput) => {
    const id = createId()
    setToasts((prev) => [...prev, { ...toast, id }])
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((item) => item.id !== id))
    }, timeoutMs)
  }

  return { toasts, pushToast }
}
