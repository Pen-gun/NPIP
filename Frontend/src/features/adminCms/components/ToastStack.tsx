import type { Toast } from '../uiTypes'

type ToastStackProps = {
  toasts: Toast[]
}

export default function ToastStack({ toasts }: ToastStackProps) {
  return (
    <div className='fixed bottom-6 right-6 z-50 space-y-3'>
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`w-72 rounded-2xl border border-(--border) bg-(--surface-base) p-4 shadow-lg ${
            toast.tone === 'success'
              ? 'border-emerald-200'
              : toast.tone === 'error'
                ? 'border-rose-200'
                : 'border-blue-200'
          }`}
          role='alert'
        >
          <p className='text-sm font-semibold text-(--text-primary)'>{toast.title}</p>
          {toast.message && <p className='mt-1 text-xs text-(--text-muted)'>{toast.message}</p>}
        </div>
      ))}
    </div>
  )
}
