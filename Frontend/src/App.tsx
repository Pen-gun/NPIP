import { useMemo, useState } from 'react'
import { useFigureIdentity, useFigureNews, useFigureVideos } from './hooks/useFigureSearch'
import { useDebouncedValue } from './hooks/useDebouncedValue'
import SearchForm from './components/SearchForm'
import SkeletonGrid from './components/SkeletonGrid'
import DisambiguationList from './components/DisambiguationList'
import ProfileCard from './components/ProfileCard'
import ActivitiesCard from './components/ActivitiesCard'
import NewsCard from './components/NewsCard'
import VideosCard from './components/VideosCard'
import EventsCard from './components/EventsCard'
import TopicsCard from './components/TopicsCard'
import QuotesCard from './components/QuotesCard'

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

const mergeTopics = (
  primary: Array<{ topic: string; count: number }>,
  secondary: Array<{ topic: string; count: number }>,
) => {
  const map = new Map<string, number>()
  for (const item of [...primary, ...secondary]) {
    map.set(item.topic, (map.get(item.topic) || 0) + item.count)
  }
  return Array.from(map.entries())
    .map(([topic, count]) => ({ topic, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8)
}

export default function App() {
  const [query, setQuery] = useState('')
  const [activeQuery, setActiveQuery] = useState('')
  const debouncedQuery = useDebouncedValue(query, 400)

  const runSearch = (value: string) => {
    const trimmed = value.trim()
    if (!trimmed || trimmed.length < 2) {
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
      events: [],
      insights: {
        topics: [],
        quotes: [],
        locations: [],
      },
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
      insights: {
        topics: [],
        quotes: [],
        locations: [],
      },
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

  const combinedTopics = mergeTopics(newsData.insights.topics, videosData.insights.topics)
  const combinedQuotes = Array.from(
    new Set([...newsData.insights.quotes, ...videosData.insights.quotes]),
  ).slice(0, 6)

  return (
    <div className='min-h-screen text-[color:var(--text-primary)]'>
      <div className='mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 py-12'>
        <header className='grid items-center gap-8 lg:grid-cols-[1.2fr_0.8fr]'>
          <div>
            <p className='text-xs font-semibold uppercase tracking-[0.3em] text-[color:var(--brand-accent)]'>
              Nepal Public Figure Intelligence Platform
            </p>
            <h1 className='mt-3 font-[var(--font-display)] text-3xl font-semibold leading-tight sm:text-4xl lg:text-5xl'>
              Real-time clarity on Nepal&apos;s public figures.
            </h1>
            <p className='mt-4 max-w-xl text-base text-[color:var(--text-muted)] sm:text-lg'>
              Search any leader or public voice and get verified identity, context, and the latest
              activity highlights in one scan.
            </p>
          </div>
          <div className='w-full max-w-sm justify-self-start lg:justify-self-end'>
            <div className='rounded-2xl border border-[color:var(--border)] bg-[color:var(--info-bg)] p-6 shadow-[var(--shadow)]'>
              <p className='text-sm font-semibold text-[color:var(--info-text)]'>Live Signal</p>
              <p className='mt-2 text-lg font-semibold text-[color:var(--text-primary)]'>
                Verified news + public data
              </p>
              <p className='mt-3 text-sm text-[color:var(--info-text)]'>
                Built for journalists, researchers, and policy teams.
              </p>
            </div>
          </div>
        </header>

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

        <section className='flex flex-col gap-6'>
          {activeQuery && identityStatus === 'pending' && <SkeletonGrid />}

          {identityStatus === 'error' && (
            <div className='rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface-base)] p-6 shadow-[var(--shadow)]'>
              <h3 className='text-lg font-semibold'>We hit a snag</h3>
              <p className='mt-2 text-sm text-[color:var(--text-muted)]'>
                {identityError instanceof Error ? identityError.message : 'Something went wrong.'}
              </p>
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
            <div className='flex flex-col gap-6'>
              <div className='grid gap-6 lg:grid-cols-[1.3fr_0.7fr]'>
                <ProfileCard data={identityData} title={personTitle} />
                <div className='rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface-base)] p-6 shadow-[var(--shadow)]'>
                  <p className='text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--brand-accent)]'>
                    Quick signals
                  </p>
                  <h3 className='mt-2 text-lg font-semibold'>Snapshot</h3>
                  <div className='mt-4 flex flex-wrap gap-2'>
                    <span className='rounded-full border border-[color:var(--border)] bg-[color:var(--surface-muted)] px-3 py-1 text-xs font-semibold'>
                      News: {newsData.news.length}
                    </span>
                    <span className='rounded-full border border-[color:var(--border)] bg-[color:var(--surface-muted)] px-3 py-1 text-xs font-semibold'>
                      Activities: {newsData.recentActivities.length}
                    </span>
                    <span className='rounded-full border border-[color:var(--border)] bg-[color:var(--surface-muted)] px-3 py-1 text-xs font-semibold'>
                      Videos: {videosData.videos.length}
                    </span>
                  </div>
                  <p className='mt-4 text-sm text-[color:var(--text-muted)]'>
                    Sources: {newsData.metadata.newsProvider}. Updated on search.
                  </p>
                </div>
              </div>

              <div className='grid gap-6 lg:grid-cols-2'>
                <TopicsCard topics={combinedTopics} />
                <QuotesCard quotes={combinedQuotes} />
              </div>

              <div className='grid gap-6 lg:grid-cols-2'>
                <EventsCard
                  data={newsData}
                  formatDate={formatDate}
                  isLoading={newsQuery.isFetching}
                  errorMessage={newsQuery.error ? 'Events failed to load.' : undefined}
                />
                <ActivitiesCard
                  data={newsData}
                  formatDate={formatDate}
                  isLoading={newsQuery.isFetching}
                  errorMessage={newsQuery.error ? 'Activities failed to load.' : undefined}
                />
              </div>

              <div className='grid gap-6'>
                <NewsCard
                  data={newsData}
                  formatDate={formatDate}
                  isLoading={newsQuery.isFetching}
                  errorMessage={newsQuery.error ? 'News failed to load.' : undefined}
                />
                <details className='rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface-base)] p-6 shadow-[var(--shadow)]'>
                  <summary className='cursor-pointer text-lg font-semibold text-[color:var(--text-primary)]'>
                    Interviews & speeches
                  </summary>
                  <div className='mt-4'>
                    <VideosCard
                      data={videosData}
                      formatDate={formatDate}
                      isLoading={videosQuery.isFetching}
                      errorMessage={videosQuery.error ? 'Videos failed to load.' : undefined}
                    />
                  </div>
                </details>
              </div>
            </div>
          )}
        </section>

        <footer className='text-center text-xs text-[color:var(--text-muted)]'>
          Data sources: Wikipedia + GNews + RSS + YouTube. NPIP surfaces public information only and
          flags missing sources.
        </footer>
      </div>
    </div>
  )
}
