export type AdminSection = 'pages' | 'media' | 'seo' | 'settings' | 'analytics' | 'users'

export type ToastTone = 'success' | 'error' | 'info'

export type Toast = {
  id: string
  title: string
  message?: string
  tone: ToastTone
}

export type ToastInput = Omit<Toast, 'id'>
