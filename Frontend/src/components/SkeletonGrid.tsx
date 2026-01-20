export default function SkeletonGrid() {
  return (
    <div
      className='grid gap-6 md:grid-cols-2 xl:grid-cols-3'
      aria-live='polite'
      aria-busy='true'
    >
      {[0, 1, 2].map((item) => (
        <div
          key={item}
          className='animate-pulse rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-6 shadow-[var(--shadow)]'
        >
          <div className='h-3 w-2/5 rounded-full bg-[color:var(--background)]' />
          <div className='mt-5 flex items-center gap-3'>
            <div className='h-12 w-12 rounded-2xl bg-[color:var(--background)]' />
            <div className='flex-1 space-y-2'>
              <div className='h-3 w-full rounded-full bg-[color:var(--background)]' />
              <div className='h-3 w-3/5 rounded-full bg-[color:var(--background)]' />
            </div>
          </div>
          <div className='mt-4 space-y-2'>
            <div className='h-3 w-full rounded-full bg-[color:var(--background)]' />
            <div className='h-3 w-full rounded-full bg-[color:var(--background)]' />
            <div className='h-3 w-2/3 rounded-full bg-[color:var(--background)]' />
          </div>
        </div>
      ))}
    </div>
  )
}
