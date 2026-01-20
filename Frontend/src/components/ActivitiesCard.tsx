import type { FigureResponse } from '../types/figure'

type ActivitiesCardProps = {
  data: FigureResponse
  formatDate: (value?: string) => string
}

export default function ActivitiesCard({ data, formatDate }: ActivitiesCardProps) {
  const sourceIssues = [
    data.metadata.sources.gnews.warning,
    data.metadata.sources.rss.warning,
  ].filter(Boolean)
  const allSourcesDown = !data.metadata.sources.gnews.ok && !data.metadata.sources.rss.ok

  return (
    <article className='card'>
      <div className='card__header'>
        <h3>Recent activities</h3>
        <span className='chip'>Timeline</span>
      </div>
      {data.recentActivities.length === 0 && (
        <p>
          {allSourcesDown && sourceIssues.length
            ? `Activities unavailable: ${sourceIssues.join(' | ')}`
            : 'No recent activity found.'}
        </p>
      )}
      <ul className='timeline'>
        {data.recentActivities.map((activity) => (
          <li key={activity.url}>
            <span>{formatDate(activity.publishedAt)}</span>
            <a href={activity.url} target='_blank' rel='noreferrer'>
              {activity.title}
            </a>
            <small>{activity.source}</small>
          </li>
        ))}
      </ul>
    </article>
  )
}
