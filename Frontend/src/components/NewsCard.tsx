import type { FigureResponse } from '../types/figure'

type NewsCardProps = {
  data: FigureResponse
  formatDate: (value?: string) => string
}

export default function NewsCard({ data, formatDate }: NewsCardProps) {
  return (
    <article className='card news'>
      <div className='card__header'>
        <h3>Verified news</h3>
        <span className='chip'>Top sources</span>
      </div>
      {data.metadata.warning && (
        <p className='warning'>News feed is limited: {data.metadata.warning}</p>
      )}
      {data.news.length === 0 && <p>No headlines found yet.</p>}
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
