import type { FigureNewsResponse } from '../types/figure'

interface EventsCardProps {
  data: FigureNewsResponse
  formatDate: (value?: string) => string
  isLoading?: boolean
  errorMessage?: string
}

const formatSourceCount = (count: number) => `${count} source${count > 1 ? 's' : ''}`

export default function EventsCard({ data, formatDate, isLoading, errorMessage }: EventsCardProps) {
  return (
    <article className='rounded-2xl border border-(--border) bg-(--surface-base) p-6 shadow-(--shadow) max-h-130 overflow-y-auto'>
      <div className='flex items-center justify-between'>
        <h3 className='text-lg font-semibold'>Key events</h3>
        <span className='rounded-full border border-(--border) bg-(--surface-muted) px-3 py-1 text-xs font-semibold'>
          Grouped
        </span>
      </div>

      {isLoading && <p className='mt-3 text-sm text-(--text-muted)'>Loading events...</p>}
      {errorMessage && <p className='mt-3 text-sm text-(--state-error)'>{errorMessage}</p>}

      {data.events.length === 0 && (
        <p className='mt-3 text-sm text-(--text-muted)'>No grouped events yet.</p>
      )}

      <ul className='mt-4 space-y-4 text-sm'>
        {data.events.map((event) => (
          <li key={event.url} className='space-y-1'>
            <span className='text-xs text-(--text-muted)'>{formatDate(event.latestPublishedAt)}</span>
            <a
              href={event.url}
              target='_blank'
              rel='noreferrer'
              className='block font-semibold text-(--text-primary) hover:text-(--brand-accent)'
            >
              {event.title}
            </a>
            <small className='text-xs text-(--text-muted)'>
              {event.sources.join(', ')} • {formatSourceCount(event.count)}
            </small>
          </li>
        ))}
      </ul>
    </article>
  )
}


