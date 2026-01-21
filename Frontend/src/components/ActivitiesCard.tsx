import type { FigureNewsResponse } from '../types/figure'

interface ActivitiesCardProps {
  data: FigureNewsResponse
  formatDate: (value?: string) => string
  isLoading?: boolean
  errorMessage?: string
}

const collectSourceWarnings = (sources: FigureNewsResponse['metadata']['sources']) =>
  [sources.gnews.warning, sources.rss.warning].filter(Boolean)

const areAllSourcesDown = (sources: FigureNewsResponse['metadata']['sources']) =>
  !sources.gnews.ok && !sources.rss.ok

export default function ActivitiesCard({
  data,
  formatDate,
  isLoading,
  errorMessage,
}: ActivitiesCardProps) {
  const sourceIssues = collectSourceWarnings(data.metadata.sources)
  const allSourcesDown = areAllSourcesDown(data.metadata.sources)

  return (
    <article className='rounded-2xl border border-(--border) bg-(--surface-base) p-6 shadow-(--shadow) max-h-130 overflow-y-auto'>
      <div className='flex items-center justify-between'>
        <h3 className='text-lg font-semibold'>Recent activities</h3>
        <span className='rounded-full border border-(--border) bg-(--surface-muted) px-3 py-1 text-xs font-semibold'>
          Timeline
        </span>
      </div>

      {isLoading && <p className='mt-3 text-sm text-(--text-muted)'>Loading activities...</p>}
      {errorMessage && <p className='mt-3 text-sm text-(--state-error)'>{errorMessage}</p>}

      {data.recentActivities.length === 0 && (
        <p className='mt-3 text-sm text-(--text-muted)'>
          {allSourcesDown && sourceIssues.length
            ? `Activities unavailable: ${sourceIssues.join(' | ')}`
            : 'No recent activity found.'}
        </p>
      )}

      <ul className='mt-4 space-y-4 text-sm'>
        {data.recentActivities.map((activity) => (
          <li key={activity.url} className='space-y-1'>
            <span className='text-xs text-(--text-muted)'>{formatDate(activity.publishedAt)}</span>
            <a
              href={activity.url}
              target='_blank'
              rel='noreferrer'
              className='block font-semibold text-(--text-primary) hover:text-(--brand-accent)'
            >
              {activity.title}
            </a>
            <small className='text-xs text-(--text-muted)'>{activity.source}</small>
          </li>
        ))}
      </ul>
    </article>
  )
}


