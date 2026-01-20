import type { FigureNewsResponse } from '../types/figure'

type ActivitiesCardProps = {
  data: FigureNewsResponse
  formatDate: (value?: string) => string
  isLoading?: boolean
  errorMessage?: string
}

export default function ActivitiesCard({
  data,
  formatDate,
  isLoading,
  errorMessage,
}: ActivitiesCardProps) {
  const sourceIssues = [
    data.metadata.sources.gnews.warning,
    data.metadata.sources.rss.warning,
  ].filter(Boolean)
  const allSourcesDown = !data.metadata.sources.gnews.ok && !data.metadata.sources.rss.ok

  return (
    <article className='rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface-base)] p-6 shadow-[var(--shadow)]'>
      <div className='flex items-center justify-between'>
        <h3 className='text-lg font-semibold'>Recent activities</h3>
        <span className='rounded-full border border-[color:var(--border)] bg-[color:var(--surface-muted)] px-3 py-1 text-xs font-semibold'>
          Timeline
        </span>
      </div>
      {isLoading && (
        <p className='mt-3 text-sm text-[color:var(--text-muted)]'>Loading activities...</p>
      )}
      {errorMessage && (
        <p className='mt-3 text-sm text-[color:var(--state-error)]'>{errorMessage}</p>
      )}
      {data.recentActivities.length === 0 && (
        <p className='mt-3 text-sm text-[color:var(--text-muted)]'>
          {allSourcesDown && sourceIssues.length
            ? `Activities unavailable: ${sourceIssues.join(' | ')}`
            : 'No recent activity found.'}
        </p>
      )}
      <ul className='mt-4 space-y-4 text-sm'>
        {data.recentActivities.map((activity) => (
          <li key={activity.url} className='space-y-1'>
            <span className='text-xs text-[color:var(--text-muted)]'>
              {formatDate(activity.publishedAt)}
            </span>
            <a
              href={activity.url}
              target='_blank'
              rel='noreferrer'
              className='block font-semibold text-[color:var(--text-primary)] hover:text-[color:var(--brand-accent)]'
            >
              {activity.title}
            </a>
            <small className='text-xs text-[color:var(--text-muted)]'>{activity.source}</small>
          </li>
        ))}
      </ul>
    </article>
  )
}
