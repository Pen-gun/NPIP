const SKELETON_COUNT = 3

export default function SkeletonGrid() {
  return (
    <div
      className='grid gap-6 md:grid-cols-2 xl:grid-cols-3'
      aria-live='polite'
      aria-busy='true'
    >
      {Array.from({ length: SKELETON_COUNT }, (_, index) => (
        <div
          key={index}
          className='animate-pulse rounded-2xl border border-(--border) bg-(--surface-base) p-6 shadow-(--shadow)'
        >
          <div className='h-3 w-2/5 rounded-full bg-(--surface-muted)' />
          <div className='mt-5 flex items-center gap-3'>
            <div className='h-12 w-12 rounded-2xl bg-(--surface-muted)' />
            <div className='flex-1 space-y-2'>
              <div className='h-3 w-full rounded-full bg-(--surface-muted)' />
              <div className='h-3 w-3/5 rounded-full bg-(--surface-muted)' />
            </div>
          </div>
          <div className='mt-4 space-y-2'>
            <div className='h-3 w-full rounded-full bg-(--surface-muted)' />
            <div className='h-3 w-full rounded-full bg-(--surface-muted)' />
            <div className='h-3 w-2/3 rounded-full bg-(--surface-muted)' />
          </div>
        </div>
      ))}
    </div>
  )
}

