import type { FigureNewsResponse } from '../types/figure'

type EventsCardProps = {
  data: FigureNewsResponse
  formatDate: (value?: string) => string
  isLoading?: boolean
  errorMessage?: string
}

export default function EventsCard({ data, formatDate, isLoading, errorMessage }: EventsCardProps) {
  return (
    <article className='rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-6 shadow-[var(--shadow)]'>
      <div className='flex items-center justify-between'>
        <h3 className='text-lg font-semibold'>Key events</h3>
        <span className='rounded-full border border-[color:var(--border)] bg-[color:var(--background)] px-3 py-1 text-xs font-semibold'>
          Grouped
        </span>
      </div>
      {isLoading && <p className='mt-3 text-sm text-[color:var(--muted)]'>Loading events...</p>}
      {errorMessage && <p className='mt-3 text-sm text-[color:var(--accent)]'>{errorMessage}</p>}
      {data.events.length === 0 && (
        <p className='mt-3 text-sm text-[color:var(--muted)]'>No grouped events yet.</p>
      )}
      <ul className='mt-4 space-y-4 text-sm'>
        {data.events.map((event) => (
          <li key={event.url} className='space-y-1'>
            <span className='text-xs text-[color:var(--muted)]'>
              {formatDate(event.latestPublishedAt)}
            </span>
            <a
              href={event.url}
              target='_blank'
              rel='noreferrer'
              className='block font-semibold text-[color:var(--text)] hover:text-[color:var(--accent)]'
            >
              {event.title}
            </a>
            <small className='text-xs text-[color:var(--muted)]'>
              {event.sources.join(', ')} • {event.count} source{event.count > 1 ? 's' : ''}
            </small>
          </li>
        ))}
      </ul>
    </article>
  )
}
