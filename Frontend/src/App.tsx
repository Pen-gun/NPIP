import { useEffect, useMemo, useState } from 'react'
import './App.css'
import { useFigureSearch } from './hooks/useFigureSearch'
import { useDebouncedValue } from './hooks/useDebouncedValue'
import SearchForm from './components/SearchForm'
import SkeletonGrid from './components/SkeletonGrid'
import DisambiguationList from './components/DisambiguationList'
import ProfileCard from './components/ProfileCard'
import ActivitiesCard from './components/ActivitiesCard'
import NewsCard from './components/NewsCard'
import VideosCard from './components/VideosCard'

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

      <SearchForm
        query={query}
        inputError={inputError}
        isFetching={isFetching}
        status={status}
        onQueryChange={setQuery}
        onSubmit={() => runSearch(query)}
        onQuickSearch={(value) => {
          setQuery(value)
          runSearch(value)
        }}
      />

      <section className='results'>
        {activeQuery && status === 'pending' && <SkeletonGrid />}

        {status === 'error' && (
          <div className='card card--error'>
            <h3>We hit a snag</h3>
            <p>{error instanceof Error ? error.message : 'Something went wrong.'}</p>
          </div>
        )}

        {data && data.isDisambiguation && data.candidates.length > 1 && (
          <DisambiguationList
            data={data}
            onSelect={(value) => {
              setQuery(value)
              runSearch(value)
            }}
          />
        )}

        {data && !data.isDisambiguation && (
          <div className='results__stack'>
            <div className='quick-info'>
              <div className='quick-info__main'>
                <ProfileCard data={data} title={personTitle} />
              </div>
              <div className='quick-info__meta'>
                <div className='card'>
                  <p className='eyebrow'>Quick signals</p>
                  <h3>Snapshot</h3>
                  <div className='quick-info__chips'>
                    <span className='chip'>News: {data.news.length}</span>
                    <span className='chip'>Activities: {data.recentActivities.length}</span>
                    <span className='chip'>Videos: {data.videos.length}</span>
                  </div>
                  <p className='description'>
                    Sources: {data.metadata.newsProvider}. Updated on search.
                  </p>
                </div>
              </div>
            </div>

            <div className='blog-flow'>
              <ActivitiesCard data={data} formatDate={formatDate} />
              <NewsCard data={data} formatDate={formatDate} />
              <VideosCard data={data} formatDate={formatDate} />
            </div>
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
