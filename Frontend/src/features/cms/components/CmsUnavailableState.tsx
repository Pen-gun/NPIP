interface CmsUnavailableStateProps {
  title?: string
  subtitle?: string
  actionLabel?: string
  onGoHome: () => void
}

export default function CmsUnavailableState({
  title = 'Not found',
  subtitle = 'This page is not published yet.',
  actionLabel = 'Homepage',
  onGoHome,
}: CmsUnavailableStateProps) {
  return (
    <div className='min-h-screen bg-(--surface-background) px-4 py-10 text-(--text-primary)'>
      <div className='mx-auto w-full max-w-3xl rounded-3xl border border-(--border) bg-(--surface-base) p-8 text-center shadow-sm'>
        <p className='text-xs font-semibold uppercase tracking-[0.3em] text-(--text-muted)'>{title}</p>
        <h1 className='mt-3 text-2xl font-semibold'>{subtitle}</h1>
        <button
          onClick={onGoHome}
          className='mt-6 inline-flex items-center justify-center rounded-full bg-(--brand-accent) px-5 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white shadow-sm'
        >
          {actionLabel}
        </button>
      </div>
    </div>
  )
}

