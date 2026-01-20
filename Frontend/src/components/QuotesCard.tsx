type QuotesCardProps = {
  quotes: string[]
}

export default function QuotesCard({ quotes }: QuotesCardProps) {
  return (
    <article className='rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface-base)] p-6 shadow-[var(--shadow)]'>
      <div className='flex items-center justify-between'>
        <h3 className='text-lg font-semibold'>Notable quotes</h3>
        <span className='rounded-full border border-[color:var(--border)] bg-[color:var(--surface-muted)] px-3 py-1 text-xs font-semibold'>
          Extracted
        </span>
      </div>
      {quotes.length === 0 && (
        <p className='mt-3 text-sm text-[color:var(--text-muted)]'>No quotes found yet.</p>
      )}
      <ul className='mt-4 space-y-3 text-sm text-[color:var(--text-primary)]'>
        {quotes.map((quote) => (
          <li key={quote} className='rounded-xl border border-[color:var(--border)] p-3'>
            <p>"{quote}"</p>
          </li>
        ))}
      </ul>
    </article>
  )
}
