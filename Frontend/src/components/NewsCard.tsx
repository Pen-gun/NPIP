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
    <article className='card news'>
      <div className='card__header'>
        <h3>Verified news</h3>
        <span className='chip'>Top sources</span>
      </div>
      {isLoading && <p>Loading news...</p>}
      {errorMessage && <p className='warning'>{errorMessage}</p>}
      {data.metadata.warning && (
        <p className='warning'>News feed is limited: {data.metadata.warning}</p>
      )}
      {data.news.length === 0 && (
        <p>
          {allSourcesDown && sourceIssues.length
            ? `News unavailable: ${sourceIssues.join(' | ')}`
            : 'No headlines found yet.'}
        </p>
      )}
      <div className='news__list'>
        {data.news.map((article) => (
          <a key={article.url} className='news__item' href={article.url} target='_blank' rel='noreferrer'>
            <div>
              <p>{article.title}</p>
              <span>
                {article.source} • {formatDate(article.publishedAt)}
              </span>
            </div>
          </a>
        ))}
      </div>
    </article>
  )
}
