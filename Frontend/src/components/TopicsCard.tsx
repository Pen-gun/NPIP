interface Topic {
  topic: string
  count: number
}

interface TopicsCardProps {
  topics: Topic[]
}

export default function TopicsCard({ topics }: TopicsCardProps) {
  return (
    <article className='rounded-2xl border border-(--border) bg-(--surface-base) p-6 shadow-(--shadow)'>
      <div className='flex items-center justify-between'>
        <h3 className='text-lg font-semibold'>Key topics</h3>
        <span className='rounded-full border border-(--border) bg-(--surface-muted) px-3 py-1 text-xs font-semibold'>
          Signals
        </span>
      </div>

      {topics.length === 0 && (
        <p className='mt-3 text-sm text-(--text-muted)'>No topics extracted yet.</p>
      )}

      <div className='mt-4 flex flex-wrap gap-2'>
        {topics.map((item) => (
          <span
            key={item.topic}
            className='rounded-full border border-(--border) bg-(--surface-muted) px-3 py-1 text-xs font-semibold'
          >
            {item.topic} ({item.count})
          </span>
        ))}
      </div>
    </article>
  )
}

