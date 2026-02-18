import { useEffect, useMemo, useState } from 'react'
import { useFigureIdentity, useFigureNews, useFigureVideos } from '../../../hooks/useFigureSearch'
import type { Project } from '../../../types/app'
import ProfileCard from '../../../components/ProfileCard'
import NewsCard from '../../../components/NewsCard'
import VideosCard from '../../../components/VideosCard'
import type { FigureIdentityResponse, FigureNewsResponse, FigureVideosResponse } from '../../../types/figure'

interface DashboardFigureSourceProbeProps {
  activeProject: Project | null
}

type SourceId = 'wiki' | 'chatgpt' | 'local_news' | 'reddit' | 'youtube'
type SourceStatus = 'idle' | 'loading' | 'ok' | 'no_data' | 'unavailable'

interface SourceRow {
  id: SourceId
  label: string
  status: SourceStatus
  detail: string
}

const RSS_SOURCE_NAMES = new Set([
  'The Kathmandu Post',
  'The Himalayan Times',
  'Republica',
  'Onlinekhabar',
  'Nepali Times',
  'Setopati',
])

const STATUS_STYLES: Record<SourceStatus, string> = {
  idle: 'bg-slate-100 text-slate-700',
  loading: 'bg-blue-100 text-blue-700',
  ok: 'bg-emerald-100 text-emerald-700',
  no_data: 'bg-amber-100 text-amber-700',
  unavailable: 'bg-rose-100 text-rose-700',
}

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

const EMPTY_NEWS_DATA: FigureNewsResponse = {
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

const EMPTY_VIDEOS_DATA: FigureVideosResponse = {
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

export default function DashboardFigureSourceProbe({ activeProject }: DashboardFigureSourceProbeProps) {
  const [selectedKeywords, setSelectedKeywords] = useState<string[]>([])
  const [selectedSources, setSelectedSources] = useState<Record<SourceId, boolean>>({
    wiki: true,
    chatgpt: true,
    local_news: true,
    reddit: true,
    youtube: true,
  })
  const [searchedQuery, setSearchedQuery] = useState('')
  const [error, setError] = useState('')
  const [selectedResultSource, setSelectedResultSource] = useState<SourceId | null>(null)

  useEffect(() => {
    setSelectedKeywords([])
    setSearchedQuery('')
    setError('')
    setSelectedResultSource(null)
  }, [activeProject?._id])

  useEffect(() => {
    if (!selectedResultSource) return
    if (!selectedSources[selectedResultSource]) {
      setSelectedResultSource(null)
    }
  }, [selectedSources, selectedResultSource])

  const {
    data: identityData,
    isLoading: identityLoading,
    isFetching: identityFetching,
  } = useFigureIdentity(searchedQuery)

  const personName = identityData?.person?.name || ''
  const aliases = identityData?.person?.aliases || []
  const hasValidPerson = Boolean(personName) && !identityData?.isDisambiguation

  const {
    data: newsData,
    isLoading: newsLoading,
    isFetching: newsFetching,
  } = useFigureNews({ name: personName, aliases, query: searchedQuery }, hasValidPerson)

  const {
    data: videosData,
    isLoading: videosLoading,
    isFetching: videosFetching,
  } = useFigureVideos(personName, hasValidPerson)

  const loading = identityLoading || identityFetching || newsLoading || newsFetching || videosLoading || videosFetching

  const localNewsItems = useMemo(
    () => (newsData?.news || []).filter((item) => RSS_SOURCE_NAMES.has(item.source || '')).slice(0, 8),
    [newsData?.news],
  )

  const youtubeItems = useMemo(() => (videosData?.videos || []).slice(0, 8), [videosData?.videos])
  const identityPayload: FigureIdentityResponse = useMemo(
    () => identityData ?? { query: searchedQuery, person: null, candidates: [], isDisambiguation: false },
    [identityData, searchedQuery],
  )
  const videosPayload: FigureVideosResponse = useMemo(
    () => videosData ?? { ...EMPTY_VIDEOS_DATA, name: personName || searchedQuery },
    [videosData, personName, searchedQuery],
  )
  const localNewsData: FigureNewsResponse = useMemo(() => {
    const base = newsData ?? { ...EMPTY_NEWS_DATA, name: personName || searchedQuery, query: searchedQuery }
    const filteredEvents = (base.events || []).filter((event) =>
      (event.sources || []).some((source) => RSS_SOURCE_NAMES.has(source)),
    )
    return {
      ...base,
      news: localNewsItems,
      events: filteredEvents,
    }
  }, [newsData, personName, searchedQuery, localNewsItems])

  const rows = useMemo<SourceRow[]>(() => {
    const localNewsCount = localNewsItems.length
    const youtubeCount = youtubeItems.length

    const allRows: SourceRow[] = [
      {
        id: 'wiki',
        label: 'Wikipedia',
        status: !searchedQuery ? 'idle' : loading ? 'loading' : identityData?.person ? 'ok' : 'no_data',
        detail: identityData?.person?.name || 'No profile found',
      },
      {
        id: 'local_news',
        label: 'Local News (RSS)',
        status: !searchedQuery ? 'idle' : loading ? 'loading' : localNewsCount > 0 ? 'ok' : 'no_data',
        detail: `${localNewsCount} local news items`,
      },
      {
        id: 'youtube',
        label: 'YouTube',
        status: !searchedQuery ? 'idle' : loading ? 'loading' : youtubeCount > 0 ? 'ok' : 'no_data',
        detail: `${youtubeCount} video results`,
      },
      {
        id: 'reddit',
        label: 'Reddit',
        status: 'unavailable',
        detail: 'Not exposed by figure endpoint',
      },
      {
        id: 'chatgpt',
        label: 'ChatGPT',
        status: 'unavailable',
        detail: 'Not exposed by figure endpoint',
      },
    ]

    return allRows.filter((row) => selectedSources[row.id])
  }, [searchedQuery, loading, identityData?.person, localNewsItems.length, youtubeItems.length, selectedSources])

  const handleRun = () => {
    if (!selectedKeywords.length) {
      setError('Select at least one keyword from this project.')
      return
    }
    setError('')
    setSearchedQuery(selectedKeywords.join(' '))
    const firstSelected = (Object.keys(selectedSources) as SourceId[]).find((sourceId) => selectedSources[sourceId]) || null
    setSelectedResultSource(firstSelected)
  }

  const projectKeywords = activeProject?.keywords || []

  if (!activeProject) return null

  return (
    <section className='rounded-2xl border border-(--border) bg-(--surface-base) p-4 shadow-sm sm:p-6'>
      <div className='flex flex-wrap items-center justify-between gap-3'>
        <h3 className='text-base font-semibold sm:text-lg'>Source Probe (Figure Endpoint)</h3>
        <span className='rounded-full border border-(--border) px-3 py-1 text-[11px] text-(--text-muted)'>
          Uses /figures endpoints
        </span>
      </div>

      <p className='mt-2 text-xs text-(--text-muted)'>
        Pick one or more project keywords and check source availability from the figure search API.
      </p>

      <div className='mt-4'>
        <p className='text-[11px] font-semibold uppercase tracking-[0.15em] text-(--text-muted)'>Keywords</p>
        <div className='mt-2 flex flex-wrap gap-2'>
          {projectKeywords.map((keyword) => {
            const selected = selectedKeywords.includes(keyword)
            return (
              <button
                key={keyword}
                type='button'
                onClick={() =>
                  setSelectedKeywords((prev) =>
                    prev.includes(keyword) ? prev.filter((item) => item !== keyword) : [...prev, keyword],
                  )
                }
                className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                  selected
                    ? 'border-(--brand-accent) bg-(--surface-muted) text-(--brand-accent)'
                    : 'border-(--border) text-(--text-muted)'
                }`}
              >
                {keyword}
              </button>
            )
          })}
          {projectKeywords.length === 0 && (
            <p className='text-xs text-(--text-muted)'>No keywords in this project.</p>
          )}
        </div>
      </div>

      <div className='mt-4'>
        <p className='text-[11px] font-semibold uppercase tracking-[0.15em] text-(--text-muted)'>Sources</p>
        <div className='mt-2 flex flex-wrap gap-3'>
          {(Object.keys(selectedSources) as SourceId[]).map((sourceId) => (
            <label key={sourceId} className='inline-flex items-center gap-2 text-xs font-semibold capitalize'>
              <input
                type='checkbox'
                checked={selectedSources[sourceId]}
                onChange={() =>
                  setSelectedSources((prev) => ({
                    ...prev,
                    [sourceId]: !prev[sourceId],
                  }))
                }
                className='h-4 w-4 rounded border-(--border)'
              />
              {sourceId.replace('_', ' ')}
            </label>
          ))}
        </div>
      </div>

      <div className='mt-4 flex flex-wrap items-center gap-3'>
        <button
          type='button'
          onClick={handleRun}
          className='rounded-lg bg-(--brand-accent) px-4 py-2 text-xs font-semibold text-white'
        >
          Check sources
        </button>
        {searchedQuery && (
          <span className='text-xs text-(--text-muted)'>
            Query: <strong>{searchedQuery}</strong>
          </span>
        )}
      </div>

      {error && <p className='mt-2 text-xs text-(--state-error)'>{error}</p>}

      <div className='mt-4 grid gap-2'>
        {rows.map((row) => (
          <button
            key={row.id}
            type='button'
            onClick={() => setSelectedResultSource(row.id)}
            className={`flex items-center justify-between rounded-xl border px-3 py-2 text-left text-xs ${
              selectedResultSource === row.id
                ? 'border-(--brand-accent) bg-(--surface-base)'
                : 'border-(--border) bg-(--surface-muted)'
            }`}
          >
            <div>
              <p className='font-semibold text-(--text-primary)'>{row.label}</p>
              <p className='text-(--text-muted)'>{row.detail}</p>
            </div>
            <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${STATUS_STYLES[row.status]}`}>
              {row.status.replace('_', ' ')}
            </span>
          </button>
        ))}
      </div>

      {selectedResultSource && (
        <div className='mt-4 rounded-xl border border-(--border) bg-(--surface-muted) p-4'>
          <p className='text-[11px] font-semibold uppercase tracking-[0.15em] text-(--text-muted)'>
            {rows.find((row) => row.id === selectedResultSource)?.label || selectedResultSource} results
          </p>

          {loading && <p className='mt-2 text-xs text-(--text-muted)'>Loading results...</p>}

          {!loading && selectedResultSource === 'wiki' && (
            <div className='mt-2'>
              <ProfileCard data={identityPayload} title={identityPayload.person?.name || searchedQuery} />
            </div>
          )}

          {!loading && selectedResultSource === 'local_news' && (
            <div className='mt-2'>
              <NewsCard data={localNewsData} formatDate={formatDate} isLoading={loading} />
            </div>
          )}

          {!loading && selectedResultSource === 'youtube' && (
            <div className='mt-2'>
              <VideosCard data={videosPayload} formatDate={formatDate} isLoading={loading} />
            </div>
          )}

          {!loading && (selectedResultSource === 'reddit' || selectedResultSource === 'chatgpt') && (
            <p className='mt-2 text-sm text-(--text-muted)'>
              This source is not available from current figure endpoints yet.
            </p>
          )}
        </div>
      )}
    </section>
  )
}

