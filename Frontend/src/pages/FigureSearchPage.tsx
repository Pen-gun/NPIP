import { useState, useCallback } from 'react'
import { useFigureIdentity, useFigureNews, useFigureVideos } from '../hooks/useFigureSearch'
import SearchForm from '../components/SearchForm'
import ProfileCard from '../components/ProfileCard'
import DisambiguationList from '../components/DisambiguationList'
import NewsCard from '../components/NewsCard'
import VideosCard from '../components/VideosCard'
import ActivitiesCard from '../components/ActivitiesCard'
import EventsCard from '../components/EventsCard'
import TopicsCard from '../components/TopicsCard'
import QuotesCard from '../components/QuotesCard'
import SkeletonGrid from '../components/SkeletonGrid'
import { Search } from 'lucide-react'

const DATE_FORMAT_OPTIONS: Intl.DateTimeFormatOptions = Object.freeze({
  month: 'short',
  day: 'numeric',
  year: 'numeric',
})

const formatDate = (value?: string): string => {
  if (!value) return 'Unknown'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Unknown'
  return date.toLocaleDateString('en-US', DATE_FORMAT_OPTIONS)
}

const EMPTY_NEWS_DATA = {
  query: '',
  name: '',
  recentActivities: [],
  recentLocations: [],
  news: [],
  events: [],
  insights: { topics: [], quotes: [], locations: [] },
  metadata: {
    newsProvider: '',
    warning: null,
    sources: {
      gnews: { ok: false, warning: null },
      rss: { ok: false, warning: null },
    },
  },
}

const EMPTY_VIDEOS_DATA = {
  name: '',
  videos: [],
  insights: { topics: [], quotes: [], locations: [] },
  metadata: {
    warning: null,
    sources: {
      youtube: { ok: false, warning: null },
    },
  },
}

export default function FigureSearchPage() {
  const [query, setQuery] = useState('')
  const [searchedQuery, setSearchedQuery] = useState('')
  const [inputError, setInputError] = useState('')

  const {
    data: identityData,
    isLoading: identityLoading,
    isFetching: identityFetching,
    error: identityError,
    status: identityStatus,
  } = useFigureIdentity(searchedQuery)

  const personName = identityData?.person?.name || ''
  const aliases = identityData?.person?.aliases || []
  const hasValidPerson = Boolean(personName) && !identityData?.isDisambiguation

  const {
    data: newsData,
    isLoading: newsLoading,
    error: newsError,
  } = useFigureNews({ name: personName, aliases }, hasValidPerson)

  const {
    data: videosData,
    isLoading: videosLoading,
    error: videosError,
  } = useFigureVideos(personName, hasValidPerson)

  const handleQueryChange = useCallback((value: string) => {
    setQuery(value)
    setInputError('')
  }, [])

  const handleSubmit = useCallback(() => {
    const trimmed = query.trim()
    if (!trimmed) {
      setInputError('Please enter a name to search')
      return
    }
    if (trimmed.length < 2) {
      setInputError('Query must be at least 2 characters')
      return
    }
    setSearchedQuery(trimmed)
    setInputError('')
  }, [query])

  const handleQuickSearch = useCallback((value: string) => {
    setQuery(value)
    setSearchedQuery(value)
    setInputError('')
  }, [])

  const handleDisambiguationSelect = useCallback((value: string) => {
    setQuery(value)
    setSearchedQuery(value)
    setInputError('')
  }, [])

  const news = newsData || EMPTY_NEWS_DATA
  const videos = videosData || EMPTY_VIDEOS_DATA
  const isLoading = identityLoading || newsLoading || videosLoading
  const hasSearched = Boolean(searchedQuery)

  return (
    <div className='mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:gap-8 sm:px-6 sm:py-8'>
      {/* Hero Section */}
      <section className='text-center'>
        <h1 className='font-display text-3xl font-semibold sm:text-4xl'>
          Public Figure Intelligence
        </h1>
        <p className='mx-auto mt-2 max-w-xl text-sm text-(--text-muted) sm:text-base'>
            Search any public figure to instantly get news, videos, quotes, and sentiment analysis.
            No project setup required.
          </p>
        </section>

        {/* Search Form */}
        <SearchForm
          query={query}
          inputError={inputError}
          isFetching={identityFetching}
          status={identityStatus}
          onQueryChange={handleQueryChange}
          onSubmit={handleSubmit}
          onQuickSearch={handleQuickSearch}
        />

        {/* Error State */}
        {identityError && hasSearched && (
          <div className='rounded-2xl border border-(--state-error) bg-(--surface-base) p-6 text-center'>
            <p className='text-sm text-(--state-error)'>
              {identityError.message || 'Failed to search. Please try again.'}
            </p>
          </div>
        )}

        {/* Loading State */}
        {isLoading && hasSearched && <SkeletonGrid />}

        {/* Disambiguation */}
        {identityData?.isDisambiguation && !identityLoading && (
          <DisambiguationList data={identityData} onSelect={handleDisambiguationSelect} />
        )}

        {/* Results */}
        {hasValidPerson && identityData && !identityLoading && (
          <div className='space-y-6'>
            {/* Profile */}
            <ProfileCard data={identityData} title={personName} />

            {/* Main Grid */}
            <div className='grid gap-6 lg:grid-cols-2'>
              {/* News */}
              <NewsCard
                data={news}
                formatDate={formatDate}
                isLoading={newsLoading}
                errorMessage={newsError?.message}
              />

              {/* Videos */}
              <VideosCard
                data={videos}
                formatDate={formatDate}
                isLoading={videosLoading}
                errorMessage={videosError?.message}
              />
            </div>

            {/* Secondary Grid */}
            <div className='grid gap-6 lg:grid-cols-3'>
              {/* Activities */}
              <ActivitiesCard
                data={news}
                formatDate={formatDate}
                isLoading={newsLoading}
                errorMessage={newsError?.message}
              />

              {/* Events */}
              <EventsCard
                data={news}
                formatDate={formatDate}
                isLoading={newsLoading}
                errorMessage={newsError?.message}
              />

              {/* Topics */}
              <TopicsCard topics={news.insights.topics} />
            </div>

            {/* Quotes */}
            {news.insights.quotes.length > 0 && (
              <QuotesCard quotes={news.insights.quotes} />
            )}
          </div>
        )}

        {/* Empty State */}
        {!hasSearched && (
          <div className='flex flex-1 items-center justify-center'>
            <div className='text-center'>
              <Search className='mx-auto h-16 w-16 text-(--text-muted)' />
              <p className='mt-4 text-sm text-(--text-muted)'>
                Search for a public figure to see their intelligence report
              </p>
            </div>
          </div>
        )}

        {/* No Results */}
        {hasSearched && !identityLoading && !identityData?.person && !identityData?.isDisambiguation && !identityError && (
          <div className='rounded-2xl border border-(--border) bg-(--surface-base) p-6 text-center'>
            <p className='text-sm text-(--text-muted)'>
              No results found for "{searchedQuery}". Try a different search term.
            </p>
          </div>
        )}
      </div>
  )
}
