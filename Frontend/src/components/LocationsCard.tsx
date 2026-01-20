import type { FigureNewsResponse } from '../types/figure'

type LocationsCardProps = {
  data: FigureNewsResponse
  formatDate: (value?: string) => string
  isLoading?: boolean
  errorMessage?: string
}

export default function LocationsCard({
  data,
  formatDate,
  isLoading,
  errorMessage,
}: LocationsCardProps) {
  return (
    <article className='card'>
      <div className='card__header'>
        <h3>Last 24h locations</h3>
        <span className='chip'>Signals</span>
      </div>
      {isLoading && <p>Loading locations...</p>}
      {errorMessage && <p className='warning'>{errorMessage}</p>}
      {data.recentLocations.length === 0 && <p>No location signals in the last 24 hours.</p>}
      <ul className='timeline'>
        {data.recentLocations.map((location) => (
          <li key={`${location.name}-${location.publishedAt}`}>
            <span>{formatDate(location.publishedAt)}</span>
            <a href={location.url} target='_blank' rel='noreferrer'>
              {location.name}
            </a>
            <small>{location.source}</small>
          </li>
        ))}
      </ul>
    </article>
  )
}
