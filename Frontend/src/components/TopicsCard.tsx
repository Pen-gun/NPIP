type TopicsCardProps = {
  topics: Array<{ topic: string; count: number }>
}

export default function TopicsCard({ topics }: TopicsCardProps) {
  return (
    <article className='rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface-base)] p-6 shadow-[var(--shadow)]'>
      <div className='flex items-center justify-between'>
        <h3 className='text-lg font-semibold'>Key topics</h3>
        <span className='rounded-full border border-[color:var(--border)] bg-[color:var(--surface-muted)] px-3 py-1 text-xs font-semibold'>
          Signals
        </span>
      </div>
      {topics.length === 0 && (
        <p className='mt-3 text-sm text-[color:var(--text-muted)]'>No topics extracted yet.</p>
      )}
      <div className='mt-4 flex flex-wrap gap-2'>
        {topics.map((item) => (
          <span
            key={item.topic}
            className='rounded-full border border-[color:var(--border)] bg-[color:var(--surface-muted)] px-3 py-1 text-xs font-semibold'
          >
            {item.topic} ({item.count})
          </span>
        ))}
      </div>
    </article>
  )
}
