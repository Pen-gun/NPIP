import { useMemo, useState } from 'react'
import './App.css'

type PersonProfile = {
  name: string
  description: string
  wikipediaUrl: string
  thumbnail: string
  extract: string
  pageId?: number | null
}

type NewsArticle = {
  title: string
  description: string
  url: string
  source: string
  publishedAt: string
  image: string
}

type FigureResponse = {
  query: string
  person: PersonProfile | null
  recentActivities: Array<Pick<NewsArticle, 'title' | 'publishedAt' | 'source' | 'url'>>
  news: NewsArticle[]
  metadata: {
    newsProvider: string
    warning: string | null
  }
}

const quickSearches = ['KP Oli', 'Balen Shah', 'Sher Bahadur Deuba', 'Pradeep Gyawali']

const formatDate = (value?: string) => {
  if (!value) return 'Unknown date'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Unknown date'
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export default function App() {
  const [query, setQuery] = useState('')
  const [result, setResult] = useState<FigureResponse | null>(null)
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle')
  const [error, setError] = useState<string | null>(null)

  const runSearch = async (value: string) => {
    const trimmed = value.trim()
    if (!trimmed) return
    setStatus('loading')
    setError(null)
    setResult(null)

    try {
      const response = await fetch(`/api/v1/figures/search?query=${encodeURIComponent(trimmed)}`)
      if (!response.ok) {
        throw new Error('Search failed. Try again in a moment.')
      }
      const data = (await response.json()) as FigureResponse
      setResult(data)
      setStatus('idle')
    } catch (err) {
      setStatus('error')
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    }
  }

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    runSearch(query)
  }

  const personTitle = useMemo(() => result?.person?.name || result?.query || query, [result, query])

  return (
    <div className='app'>
      <div className='hero'>
        <div className='hero__copy'>
          <p className='eyebrow'>Nepal Public Figure Intelligence Platform</p>
          <h1>Real-time clarity on Nepal&apos;s public figures.</h1>
          <p className='subtitle'>
            Search any leader or public voice and get verified identity, context, and the latest
            activity highlights in one scan.
          </p>
        </div>
        <div className='hero__panel'>
          <div className='signal-card'>
            <p className='signal-title'>Live Signal</p>
            <p className='signal-value'>Verified news + public data</p>
            <p className='signal-meta'>Built for journalists, researchers, and policy teams.</p>
          </div>
        </div>
      </div>

      <section className='search'>
        <form className='search__form' onSubmit={handleSubmit}>
          <label className='search__label' htmlFor='query'>
            Search a public figure
          </label>
          <div className='search__input'>
            <input
              id='query'
              type='text'
              value={query}
              placeholder='e.g. KP Oli Nepali politician'
              onChange={(event) => setQuery(event.target.value)}
            />
            <button type='submit'>Analyze</button>
          </div>
        </form>
        <div className='search__quick'>
          {quickSearches.map((item) => (
            <button key={item} type='button' onClick={() => runSearch(item)}>
              {item}
            </button>
          ))}
        </div>
      </section>

      <section className='results'>
        {status === 'loading' && (
          <div className='card card--loading'>
            <div className='spinner' />
            <p>Collecting verified signals for {query || 'your search'}...</p>
          </div>
        )}

        {status === 'error' && (
          <div className='card card--error'>
            <h3>We hit a snag</h3>
            <p>{error}</p>
          </div>
        )}

        {result && (
          <div className='results__grid'>
            <article className='card profile'>
              <div className='profile__header'>
                {result.person?.thumbnail ? (
                  <img src={result.person.thumbnail} alt={personTitle} />
                ) : (
                  <div className='profile__placeholder'>{personTitle?.slice(0, 2) || 'NP'}</div>
                )}
                <div>
                  <p className='eyebrow'>Identity</p>
                  <h2>{personTitle || 'Unknown figure'}</h2>
                  <p className='description'>{result.person?.description || 'No description found.'}</p>
                </div>
              </div>
              <p className='summary'>{result.person?.extract || 'No verified biography available yet.'}</p>
              {result.person?.wikipediaUrl && (
                <a className='link' href={result.person.wikipediaUrl} target='_blank' rel='noreferrer'>
                  View Wikipedia profile
                </a>
              )}
            </article>

            <article className='card'>
              <div className='card__header'>
                <h3>Recent activities</h3>
                <span className='chip'>Timeline</span>
              </div>
              {result.recentActivities.length === 0 && <p>No recent activity found.</p>}
              <ul className='timeline'>
                {result.recentActivities.map((activity) => (
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

            <article className='card news'>
              <div className='card__header'>
                <h3>Verified news</h3>
                <span className='chip'>Top sources</span>
              </div>
              {result.metadata.warning && (
                <p className='warning'>News feed is limited: {result.metadata.warning}</p>
              )}
              {result.news.length === 0 && <p>No headlines found yet.</p>}
              <div className='news__list'>
                {result.news.map((article) => (
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
          </div>
        )}
      </section>

      <footer className='footer'>
        <p>
          Data sources: Wikipedia + GNews. NPIP surfaces public information only and flags missing
          sources.
        </p>
      </footer>
    </div>
  )
}
