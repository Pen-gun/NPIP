import type { FigureNewsResponse } from '../types/figure'

type EventsCardProps = {
  data: FigureNewsResponse
  formatDate: (value?: string) => string
  isLoading?: boolean
  errorMessage?: string
}

export default function EventsCard({ data, formatDate, isLoading, errorMessage }: EventsCardProps) {
  return (
    <article className='card'>
      <div className='card__header'>
        <h3>Key events</h3>
        <span className='chip'>Grouped</span>
      </div>
      {isLoading && <p>Loading events...</p>}
      {errorMessage && <p className='warning'>{errorMessage}</p>}
      {data.events.length === 0 && <p>No grouped events yet.</p>}
      <ul className='timeline'>
        {data.events.map((event) => (
          <li key={event.url}>
            <span>{formatDate(event.latestPublishedAt)}</span>
            <a href={event.url} target='_blank' rel='noreferrer'>
              {event.title}
            </a>
            <small>
              {event.sources.join(', ')} • {event.count} source{event.count > 1 ? 's' : ''}
            </small>
          </li>
        ))}
      </ul>
    </article>
  )
}
