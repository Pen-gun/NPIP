import type { FigureNewsResponse } from '../types/figure'

type NewsCardProps = {
  data: FigureNewsResponse
  formatDate: (value?: string) => string
  isLoading?: boolean
  errorMessage?: string
}

export default function NewsCard({ data, formatDate, isLoading, errorMessage }: NewsCardProps) {
  const sourceIssues = [
    data.metadata.sources.gnews.warning,
    data.metadata.sources.rss.warning,
  ].filter(Boolean)
  const allSourcesDown = !data.metadata.sources.gnews.ok && !data.metadata.sources.rss.ok

  return (
    <article className='rounded-2xl border border-(--border) bg-(--surface-base) p-6 shadow-(--shadow) max-h-130 overflow-y-auto'>
      <div className='flex items-center justify-between'>
        <h3 className='text-lg font-semibold'>Verified news</h3>
        <span className='rounded-full border border-(--border) bg-(--surface-muted) px-3 py-1 text-xs font-semibold'>
          Top sources
        </span>
      </div>
      {isLoading && <p className='mt-3 text-sm text-(--text-muted)'>Loading news...</p>}
      {errorMessage && <p className='mt-3 text-sm text-(--state-error)'>{errorMessage}</p>}
      {data.metadata.warning && (
        <p className='mt-3 text-sm text-(--state-warning)'>
          News feed is limited: {data.metadata.warning}
        </p>
      )}
      {data.news.length === 0 && (
        <p className='mt-3 text-sm text-(--text-muted)'>
          {allSourcesDown && sourceIssues.length
            ? `News unavailable: ${sourceIssues.join(' | ')}`
            : 'No headlines found yet.'}
        </p>
      )}
      <div className='mt-4 grid gap-3'>
        {data.news.map((article) => (
          <a
            key={article.url}
            className='rounded-xl border border-transparent p-3 transition hover:border-(--brand-accent) hover:bg-(--surface-muted)'
            href={article.url}
            target='_blank'
            rel='noreferrer'
          >
            <p className='text-sm font-semibold text-(--text-primary)'>{article.title}</p>
            <span className='mt-2 block text-xs text-(--text-muted)'>
              {article.source} • {formatDate(article.publishedAt)}
            </span>
          </a>
        ))}
      </div>
    </article>
  )
}

