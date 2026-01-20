import { useMemo, useState } from 'react'
import './App.css'
import { useFigureIdentity, useFigureNews, useFigureVideos } from './hooks/useFigureSearch'
import { useDebouncedValue } from './hooks/useDebouncedValue'
import SearchForm from './components/SearchForm'
import SkeletonGrid from './components/SkeletonGrid'
import DisambiguationList from './components/DisambiguationList'
import ProfileCard from './components/ProfileCard'
import ActivitiesCard from './components/ActivitiesCard'
import NewsCard from './components/NewsCard'
import VideosCard from './components/VideosCard'
import LocationsCard from './components/LocationsCard'

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
  const debouncedQuery = useDebouncedValue(query, 400)

  const runSearch = (value: string) => {
    const trimmed = value.trim()
    if (!trimmed) {
      return
    }
    if (trimmed.length < 2) {
      return
    }
    setActiveQuery(trimmed)
  }

  const inputError =
    !debouncedQuery.trim() || debouncedQuery.trim().length >= 2
      ? ''
      : 'Search term is too short.'

  const identityQuery = useFigureIdentity(activeQuery)
  const identityData = identityQuery.data
  const identityStatus = identityQuery.status
  const identityError = identityQuery.error

  const resolvedName = identityData?.person?.name || activeQuery
  const aliases = identityData?.person?.aliases || []

  const newsQuery = useFigureNews(
    { name: resolvedName, query: activeQuery, aliases },
    Boolean(identityData && !identityData.isDisambiguation && resolvedName),
  )
  const videosQuery = useFigureVideos(
    resolvedName,
    Boolean(identityData && !identityData.isDisambiguation && resolvedName),
  )

  const newsData =
    newsQuery.data ?? {
      query: activeQuery,
      name: resolvedName,
      recentActivities: [],
      recentLocations: [],
      news: [],
      metadata: {
        newsProvider: 'gnews+rss',
        warning: null,
        sources: {
          gnews: { ok: true, warning: null },
          rss: { ok: true, warning: null },
        },
      },
    }

  const videosData =
    videosQuery.data ?? {
      name: resolvedName,
      videos: [],
      metadata: {
        warning: null,
        sources: {
          youtube: { ok: true, warning: null },
        },
      },
    }

  const personTitle = useMemo(
    () => identityData?.person?.name || identityData?.query || activeQuery || query,
    [identityData, activeQuery, query],
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
        isFetching={identityQuery.isFetching}
        status={identityStatus}
        onQueryChange={setQuery}
        onSubmit={() => runSearch(query)}
        onQuickSearch={(value) => {
          setQuery(value)
          runSearch(value)
        }}
      />

      <section className='results'>
        {activeQuery && identityStatus === 'pending' && <SkeletonGrid />}

        {identityStatus === 'error' && (
          <div className='card card--error'>
            <h3>We hit a snag</h3>
            <p>{identityError instanceof Error ? identityError.message : 'Something went wrong.'}</p>
          </div>
        )}

        {identityData && identityData.isDisambiguation && identityData.candidates.length > 1 && (
          <DisambiguationList
            data={identityData}
            onSelect={(value) => {
              setQuery(value)
              runSearch(value)
            }}
          />
        )}

        {identityData && !identityData.isDisambiguation && (
          <div className='results__stack'>
            <div className='quick-info'>
              <div className='quick-info__main'>
                <ProfileCard data={identityData} title={personTitle} />
              </div>
              <div className='quick-info__meta'>
                <div className='card'>
                  <p className='eyebrow'>Quick signals</p>
                  <h3>Snapshot</h3>
                  <div className='quick-info__chips'>
                    <span className='chip'>News: {newsData.news.length}</span>
                    <span className='chip'>Activities: {newsData.recentActivities.length}</span>
                    <span className='chip'>Videos: {videosData.videos.length}</span>
                  </div>
                  <p className='description'>
                    Sources: {newsData.metadata.newsProvider}. Updated on search.
                  </p>
                </div>
              </div>
            </div>

            <div className='blog-flow'>
              <LocationsCard
                data={newsData}
                formatDate={formatDate}
                isLoading={newsQuery.isFetching}
                errorMessage={newsQuery.error ? 'Locations failed to load.' : undefined}
              />
              <ActivitiesCard
                data={newsData}
                formatDate={formatDate}
                isLoading={newsQuery.isFetching}
                errorMessage={newsQuery.error ? 'News failed to load.' : undefined}
              />
              <NewsCard
                data={newsData}
                formatDate={formatDate}
                isLoading={newsQuery.isFetching}
                errorMessage={newsQuery.error ? 'News failed to load.' : undefined}
              />
              <VideosCard
                data={videosData}
                formatDate={formatDate}
                isLoading={videosQuery.isFetching}
                errorMessage={videosQuery.error ? 'Videos failed to load.' : undefined}
              />
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
