interface DashboardStatusBannersProps {
  error: string | null
  showSocketWarning: boolean
  onDismissError: () => void
}

export default function DashboardStatusBanners({
  error,
  showSocketWarning,
  onDismissError,
}: DashboardStatusBannersProps) {
  return (
    <>
      {error && (
        <div className='flex items-center justify-between gap-4 bg-(--state-error) px-4 py-3 text-sm text-white'>
          <span>{error}</span>
          <button
            type='button'
            onClick={onDismissError}
            className='rounded-lg px-3 py-1 text-xs font-semibold hover:bg-white/20'
            aria-label='Dismiss error'
          >
            Dismiss
          </button>
        </div>
      )}
      {showSocketWarning && (
        <div className='bg-(--state-warning) px-4 py-2 text-center text-xs text-(--text-primary)'>
          Real-time updates disconnected. Reconnecting...
        </div>
      )}
    </>
  )
}
