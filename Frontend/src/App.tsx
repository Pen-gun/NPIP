import { useEffect, useMemo, useState } from 'react'
import './App.css'
import { useFigureSearch } from './hooks/useFigureSearch'
import { useDebouncedValue } from './hooks/useDebouncedValue'

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
  const [activeQuery, setActiveQuery] = useState('')
  const [inputError, setInputError] = useState('')
  const debouncedQuery = useDebouncedValue(query, 400)

  const runSearch = (value: string) => {
    const trimmed = value.trim()
    if (!trimmed) {
      setInputError('Enter a name to search.')
      return
    }
    if (trimmed.length < 2) {
      setInputError('Search term is too short.')
      return
    }
    setInputError('')
    setActiveQuery(trimmed)
  }

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    runSearch(query)
  }

  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setInputError('')
    }
  }, [debouncedQuery])

  const { data, status, error, isFetching } = useFigureSearch(activeQuery)

  const personTitle = useMemo(
    () => data?.person?.name || data?.query || activeQuery || query,
    [data, activeQuery, query],
  )

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
              aria-invalid={Boolean(inputError)}
              aria-describedby={inputError ? 'search-error' : undefined}
            />
            <button type='submit' disabled={!query.trim()}>
              Analyze
            </button>
          </div>
        </form>
        {inputError && (
          <p id='search-error' className='search__status' role='alert'>
            {inputError}
          </p>
        )}
        {isFetching && status !== 'pending' && (
          <p className='search__status' role='status' aria-live='polite'>
            Refreshing latest signals...
          </p>
        )}
        <div className='search__quick'>
          {quickSearches.map((item) => (
            <button
              key={item}
              type='button'
              onClick={() => {
                setQuery(item)
                runSearch(item)
              }}
            >
              {item}
            </button>
          ))}
        </div>
      </section>

      <section className='results'>
        {activeQuery && status === 'pending' && (
          <div className='card card--loading'>
            <div className='spinner' />
            <p>Collecting verified signals for {activeQuery || 'your search'}...</p>
          </div>
        )}

        {status === 'error' && (
          <div className='card card--error'>
            <h3>We hit a snag</h3>
            <p>{error instanceof Error ? error.message : 'Something went wrong.'}</p>
          </div>
        )}

        {data && (
          <div className='results__grid'>
            <article className='card profile'>
              <div className='profile__header'>
                {data.person?.thumbnail ? (
                  <img src={data.person.thumbnail} alt={personTitle} />
                ) : (
                  <div className='profile__placeholder'>{personTitle?.slice(0, 2) || 'NP'}</div>
                )}
                <div>
                  <p className='eyebrow'>Identity</p>
                  <h2>{personTitle || 'Unknown figure'}</h2>
                  <p className='description'>{data.person?.description || 'No description found.'}</p>
                </div>
              </div>
              <p className='summary'>{data.person?.extract || 'No verified biography available yet.'}</p>
              {data.person?.wikipediaUrl && (
                <a className='link' href={data.person.wikipediaUrl} target='_blank' rel='noreferrer'>
                  View Wikipedia profile
                </a>
              )}
            </article>

            <article className='card'>
              <div className='card__header'>
                <h3>Recent activities</h3>
                <span className='chip'>Timeline</span>
              </div>
              {data.recentActivities.length === 0 && <p>No recent activity found.</p>}
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
