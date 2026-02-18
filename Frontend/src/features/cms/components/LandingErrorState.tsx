interface LandingErrorStateProps {
  status?: number
}

export default function LandingErrorState({ status }: LandingErrorStateProps) {
  if (status === 404) {
    return (
      <div className='min-h-screen bg-(--surface-background) px-4 py-10 text-(--text-primary)'>
        <div className='mx-auto w-full max-w-3xl rounded-3xl border border-(--border) bg-(--surface-base) p-8 text-center shadow-sm'>
          <p className='text-xs font-semibold uppercase tracking-[0.3em] text-(--text-muted)'>Unpublished</p>
          <h1 className='mt-3 text-2xl font-semibold'>Home page is not published.</h1>
        </div>
      </div>
    )
  }

  return (
    <div className='min-h-screen bg-(--surface-background) px-4 py-10 text-(--text-primary)'>
      <div className='mx-auto w-full max-w-3xl rounded-3xl border border-(--border) bg-(--surface-base) p-8 text-center shadow-sm'>
        <p className='text-xs font-semibold uppercase tracking-[0.3em] text-(--text-muted)'>Unavailable</p>
        <h1 className='mt-3 text-2xl font-semibold'>We couldn't load the home content.</h1>
        <p className='mt-2 text-sm text-(--text-muted)'>Please try again in a moment.</p>
      </div>
    </div>
  )
}

