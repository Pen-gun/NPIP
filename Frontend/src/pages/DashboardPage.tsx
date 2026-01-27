import { useEffect, useMemo, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { io, Socket } from 'socket.io-client'
import { ChevronDown } from 'lucide-react'
import {
  createProject,
  deleteProject,
  fetchProjectHealth,
  fetchProjectMetrics,
  listProjects,
  runProjectIngestion,
  updateProjectStatus,
} from '../api/projects'
import { fetchMentions } from '../api/mentions'
import type { PaginationInfo, MentionFilters } from '../api/mentions'
import { fetchAlerts, markAlertRead } from '../api/alerts'
import { downloadReport } from '../api/reports'
import type { ReportScope, ReportFormat } from '../api/reports'
import { useAuth } from '../contexts/AuthContext'
import type { AlertItem, ConnectorHealth, Mention, Project, ProjectMetrics } from '../types/app'
import {
  MetricsCharts,
  MentionsList,
  AnalysisView,
  DashboardTopBar,
  DashboardSidebar,
  DashboardRightPanel,
  DashboardQuickNavGrid,
  ProjectDetailsPanel,
  ProjectModal,
} from '../components/dashboard'
import type { ProjectFormState, DashboardFilters } from '../components/dashboard'

type DashboardView = 'mentions' | 'analysis'

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || undefined
const ALERTS_LIMIT = 100

const INITIAL_FILTERS: DashboardFilters = Object.freeze({
  from: '',
  to: '',
  source: '',
  sentiment: '',
})

const INITIAL_PROJECT_FORM: ProjectFormState = Object.freeze({
  name: '',
  keywords: '',
  booleanQuery: '',
  scheduleMinutes: 30,
  geoFocus: 'Nepal',
  sources: {
    localNews: true,
    youtube: true,
    reddit: true,
    x: true,
    meta: true,
    tiktok: true,
    viber: true,
  },
})

const parseKeywords = (value: string): string[] =>
  value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)

// Map raw source values to normalized IDs (keep actual source names)
const SOURCE_MAP: Record<string, string> = Object.freeze({
  facebook: 'facebook',
  instagram: 'instagram',
  x: 'x',
  twitter: 'x',
  tiktok: 'tiktok',
  youtube: 'youtube',
  videos: 'youtube',
  local_news: 'local_news',
  news: 'local_news',
  reddit: 'reddit',
  podcasts: 'podcasts',
  blogs: 'blogs',
  web: 'web',
  viber: 'viber',
})

// Display labels for sources
const SOURCE_LABELS: Record<string, string> = Object.freeze({
  youtube: 'YouTube',
  reddit: 'Reddit',
  x: 'X (Twitter)',
  facebook: 'Facebook',
  instagram: 'Instagram',
  tiktok: 'TikTok',
  local_news: 'Local News',
  viber: 'Viber',
  podcasts: 'Podcasts',
  blogs: 'Blogs',
  web: 'Web',
})

const normalizeSentiment = (value?: string) => {
  const normalized = value?.toLowerCase() || ''
  if (['5 stars', '4 stars', 'positive'].includes(normalized)) return 'positive'
  if (['3 stars', 'neutral'].includes(normalized)) return 'neutral'
  if (['2 stars', '1 star', 'negative'].includes(normalized)) return 'negative'
  return ''
}

const normalizeSource = (value?: string) => {
  const normalized = value?.toLowerCase().trim() || ''
  return SOURCE_MAP[normalized] || ''
}

const formatDateInput = (value: Date) => value.toISOString().slice(0, 10)

const getDateRange = (range: string) => {
  const to = new Date()
  const from = new Date(to)
  if (range === 'last_7_days') {
    from.setDate(to.getDate() - 7)
  } else if (range === 'last_30_days') {
    from.setDate(to.getDate() - 30)
  } else if (range === 'last_90_days') {
    from.setDate(to.getDate() - 90)
  }
  return { from: formatDateInput(from), to: formatDateInput(to) }
}

export default function DashboardPage() {
  const { user } = useAuth()
  const socketRef = useRef<Socket | null>(null)
  const [projects, setProjects] = useState<Project[]>([])
  const [activeProjectId, setActiveProjectId] = useState<string>('')
  const [metrics, setMetrics] = useState<ProjectMetrics | null>(null)
  const [mentions, setMentions] = useState<Mention[]>([])
  const [alerts, setAlerts] = useState<AlertItem[]>([])
  const [health, setHealth] = useState<ConnectorHealth[]>([])
  const [loadingDashboard, setLoadingDashboard] = useState(false)
  const [loadingProjects, setLoadingProjects] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [socketConnected, setSocketConnected] = useState(false)
  const [filters, setFilters] = useState<DashboardFilters>({ ...INITIAL_FILTERS })
  const [projectForm, setProjectForm] = useState<ProjectFormState>({
    ...INITIAL_PROJECT_FORM,
    sources: { ...INITIAL_PROJECT_FORM.sources },
  })
  const [showProjectModal, setShowProjectModal] = useState(false)
  const [mentionSearch, setMentionSearch] = useState('')
  const [chartView, setChartView] = useState<'mentions' | 'sentiment'>('mentions')
  const [chartGranularity, setChartGranularity] = useState<'days' | 'weeks' | 'months'>('days')
  const [dateRange, setDateRange] = useState('last_30_days')
  const [sourceFilters, setSourceFilters] = useState<Record<string, boolean>>({})
  const [sentimentFilters, setSentimentFilters] = useState<Record<string, boolean>>({})
  const [influenceScore, setInfluenceScore] = useState(6)
  const [continentFilter, setContinentFilter] = useState('')
  const [countryFilter, setCountryFilter] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [pagination, setPagination] = useState<PaginationInfo | null>(null)
  const [sortOrder, setSortOrder] = useState<'recent' | 'oldest' | 'reach'>('recent')
  const [currentView, setCurrentView] = useState<DashboardView>('mentions')

  useEffect(() => {
    if (!user) return
    let cancelled = false
    setLoadingProjects(true)
    setError(null)
    listProjects()
      .then((data) => {
        if (cancelled) return
        setProjects(data)
        if (data.length) {
          setActiveProjectId((prev) => (prev ? prev : data[0]._id))
        }
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || 'Failed to load projects')
      })
      .finally(() => {
        if (!cancelled) setLoadingProjects(false)
      })
    return () => { cancelled = true }
  }, [user])

  useEffect(() => {
    if (!user || !activeProjectId) return
    let cancelled = false
    setLoadingDashboard(true)
    setError(null)
    const mentionFilters: MentionFilters = {
      ...filters,
      page: currentPage,
      limit: 20,
      sort: sortOrder,
    }
    Promise.all([
      fetchProjectMetrics(activeProjectId, filters.from, filters.to),
      fetchMentions(activeProjectId, mentionFilters),
      fetchAlerts(),
      fetchProjectHealth(activeProjectId),
    ])
      .then(([metricData, mentionData, alertData, healthData]) => {
        if (cancelled) return
        setMetrics(metricData)
        setMentions(mentionData.mentions)
        setPagination(mentionData.pagination)
        setAlerts(alertData)
        setHealth(healthData)
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || 'Failed to load dashboard data')
      })
      .finally(() => {
        if (!cancelled) setLoadingDashboard(false)
      })
    return () => { cancelled = true }
  }, [user, activeProjectId, filters, currentPage, sortOrder])

  useEffect(() => {
    if (!user) {
      socketRef.current?.disconnect()
      socketRef.current = null
      return
    }
    const socket: Socket = io(SOCKET_URL || window.location.origin, {
      withCredentials: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    })
    socketRef.current = socket

    socket.on('connect', () => {
      setSocketConnected(true)
    })

    socket.on('disconnect', () => {
      setSocketConnected(false)
    })

    socket.on('connect_error', () => {
      setSocketConnected(false)
    })

    socket.on('alert', (alert: AlertItem) => {
      setAlerts((prev) => [alert, ...prev].slice(0, ALERTS_LIMIT))
    })

    return () => {
      socket.off('connect')
      socket.off('disconnect')
      socket.off('connect_error')
      socket.off('alert')
      socket.disconnect()
      socketRef.current = null
    }
  }, [user])

  useEffect(() => {
    if (!user || !activeProjectId) return
    const socket = socketRef.current
    if (!socket) return
    if (socket.connected) {
      socket.emit('join', { userId: user._id, projectId: activeProjectId })
      return
    }
    const handleConnect = () => {
      socket.emit('join', { userId: user._id, projectId: activeProjectId })
    }
    socket.on('connect', handleConnect)
    return () => {
      socket.off('connect', handleConnect)
    }
  }, [user, activeProjectId])

  const activeProject = useMemo(
    () => projects.find((project) => project._id === activeProjectId) || null,
    [projects, activeProjectId],
  )

  const handleProjectSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!user || actionLoading) return
    setActionLoading('create')
    setError(null)
    try {
      const payload = {
        name: projectForm.name,
        keywords: parseKeywords(projectForm.keywords),
        booleanQuery: projectForm.booleanQuery,
        scheduleMinutes: Number(projectForm.scheduleMinutes),
        geoFocus: projectForm.geoFocus,
        sources: projectForm.sources,
      }
      const created = await createProject(payload)
      setProjects((prev) => [created, ...prev])
      setActiveProjectId(created._id)
      setProjectForm((prev) => ({
        ...prev,
        name: '',
        keywords: '',
        booleanQuery: '',
      }))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create project')
    } finally {
      setActionLoading(null)
    }
  }

  const handleRunIngestion = async () => {
    if (!activeProjectId || actionLoading) return
    setActionLoading('ingestion')
    setError(null)
    try {
      await runProjectIngestion(activeProjectId)
      const nowIso = new Date().toISOString()
      setProjects((prev) =>
        prev.map((project) =>
          project._id === activeProjectId
            ? { ...project, lastRunAt: nowIso }
            : project
        )
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to run ingestion')
    } finally {
      setActionLoading(null)
    }
  }

  const handleToggleProjectStatus = async () => {
    if (!activeProject || actionLoading) return
    const nextStatus = activeProject.status === 'paused' ? 'active' : 'paused'
    setActionLoading('status')
    setError(null)
    try {
      const updated = await updateProjectStatus(activeProject._id, nextStatus)
      setProjects((prev) => prev.map((project) => (project._id === updated._id ? updated : project)))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update project status')
    } finally {
      setActionLoading(null)
    }
  }

  const handleDownloadReport = async (scope: ReportScope, format: ReportFormat = 'pdf') => {
    if (!activeProjectId || actionLoading) return
    setActionLoading('report')
    setError(null)
    try {
      await downloadReport(activeProjectId, scope, format)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to download report')
    } finally {
      setActionLoading(null)
    }
  }

  const handleDeleteProject = async (projectId: string) => {
    if (actionLoading) return
    setActionLoading(`delete-${projectId}`)
    setError(null)
    try {
      await deleteProject(projectId)
      setProjects((prev) => prev.filter((project) => project._id !== projectId))
      if (activeProjectId === projectId) {
        setActiveProjectId('')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete project')
    } finally {
      setActionLoading(null)
    }
  }

  const handleMarkAlertRead = async (alertId: string) => {
    try {
      const updated = await markAlertRead(alertId)
      setAlerts((prev) => prev.map((item) => (item._id === updated._id ? updated : item)))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to mark alert as read')
    }
  }

  const dismissError = () => setError(null)

  const handleDateRangeChange = (value: string) => {
    setDateRange(value)
    const range = getDateRange(value)
    setFilters((prev) => ({ ...prev, from: range.from, to: range.to }))
    setCurrentPage(1) // Reset to first page on filter change
  }

  const handleSourceFilterToggle = (sourceId: string) => {
    setSourceFilters((prev) => ({ ...prev, [sourceId]: !prev[sourceId] }))
    setCurrentPage(1) // Reset to first page on filter change
  }

  const handleSentimentToggle = (key: 'negative' | 'neutral' | 'positive') => {
    setSentimentFilters((prev) => ({ ...prev, [key]: !prev[key] }))
    setCurrentPage(1) // Reset to first page on filter change
  }

  // Filter persistence
  const FILTERS_STORAGE_KEY = `npip_filters_${activeProjectId}`
  
  const handleSaveFilters = () => {
    if (!activeProjectId) return
    const savedFilters = {
      dateRange,
      sourceFilters,
      sentimentFilters,
      influenceScore,
      continentFilter,
      countryFilter,
    }
    localStorage.setItem(FILTERS_STORAGE_KEY, JSON.stringify(savedFilters))
    // Show success feedback (could add a toast here)
    alert('Filters saved!')
  }

  const handleClearFilters = () => {
    setDateRange('last_30_days')
    setSourceFilters({})
    setSentimentFilters({})
    setInfluenceScore(6)
    setContinentFilter('')
    setCountryFilter('')
    setMentionSearch('')
    setCurrentPage(1)
    if (activeProjectId) {
      localStorage.removeItem(FILTERS_STORAGE_KEY)
    }
  }

  // Load saved filters when project changes
  useEffect(() => {
    if (!activeProjectId) return
    const saved = localStorage.getItem(FILTERS_STORAGE_KEY)
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        if (parsed.dateRange) setDateRange(parsed.dateRange)
        if (parsed.sourceFilters) setSourceFilters(parsed.sourceFilters)
        if (parsed.sentimentFilters) setSentimentFilters(parsed.sentimentFilters)
        if (parsed.influenceScore) setInfluenceScore(parsed.influenceScore)
        if (parsed.continentFilter) setContinentFilter(parsed.continentFilter)
        if (parsed.countryFilter) setCountryFilter(parsed.countryFilter)
      } catch {
        // Ignore invalid JSON
      }
    }
  }, [activeProjectId])

  const mentionsBySource = useMemo(() => {
    const counts: Record<string, number> = {}
    mentions.forEach((mention) => {
      const sourceId = normalizeSource(mention.source)
      if (!sourceId) return
      counts[sourceId] = (counts[sourceId] || 0) + 1
    })
    return counts
  }, [mentions])

  const filteredMentions = useMemo(() => {
    const query = mentionSearch.trim().toLowerCase()
    const activeSources = Object.entries(sourceFilters).filter(([, enabled]) => enabled).map(([key]) => key)
    const activeSentiments = Object.entries(sentimentFilters).filter(([, enabled]) => enabled).map(([key]) => key)

    return mentions.filter((mention) => {
      if (query) {
        const haystack = `${mention.title || ''} ${mention.text || ''} ${mention.author || ''} ${mention.url || ''}`.toLowerCase()
        if (!haystack.includes(query)) return false
      }

      if (activeSources.length) {
        const sourceId = normalizeSource(mention.source)
        if (!sourceId || !activeSources.includes(sourceId)) return false
      }

      if (activeSentiments.length) {
        const sentiment = normalizeSentiment(mention.sentiment?.label)
        if (!sentiment || !activeSentiments.includes(sentiment)) return false
      }

      return true
    })
  }, [mentionSearch, mentions, sentimentFilters, sourceFilters])

  const quickNavTiles = [
    {
      id: 'mentions',
      title: 'Mentions',
      description: 'Browse all public mentions and activity.',
      onClick: () => setCurrentView('mentions'),
      badge: pagination ? `${pagination.totalCount.toLocaleString()} total` : undefined,
    },
    {
      id: 'analysis',
      title: 'Analysis',
      description: 'Switch to analytics and sentiment insights.',
      onClick: () => setCurrentView('analysis'),
    },
    {
      id: 'reports',
      title: 'Email reports',
      description: 'Schedule and download PDF/Excel reports.',
      onClick: () => handleDownloadReport('summary', 'pdf'),
      badge: 'PDF/Excel',
    },
    {
      id: 'influencers',
      title: 'Influencers & Sources',
      description: 'Top voices and sources tracking.',
      disabled: true,
    },
  ]

  return (
    <div className='dashboard-shell min-h-screen bg-(--surface-background) text-(--text-primary)'>
      {error && (
        <div className='flex items-center justify-between gap-4 bg-(--state-error) px-4 py-3 text-sm text-white'>
          <span>{error}</span>
          <button
            type='button'
            onClick={dismissError}
            className='rounded-lg px-3 py-1 text-xs font-semibold hover:bg-white/20'
            aria-label='Dismiss error'
          >
            Dismiss
          </button>
        </div>
      )}
      {!socketConnected && user && (
        <div className='bg-(--state-warning) px-4 py-2 text-center text-xs text-(--text-primary)'>
          Real-time updates disconnected. Reconnecting...
        </div>
      )}
      <DashboardTopBar
        mentionSearch={mentionSearch}
        onMentionSearchChange={setMentionSearch}
        mentionsBySource={mentionsBySource}
        sourceFilters={sourceFilters}
        sourceLabels={SOURCE_LABELS}
        onSourceFilterToggle={handleSourceFilterToggle}
        sentimentFilters={sentimentFilters}
        onSentimentToggle={handleSentimentToggle}
        onClearFilters={handleClearFilters}
        onSaveFilters={handleSaveFilters}
      />
      <div className='mx-auto w-full max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8'>
        <div className='grid gap-0 lg:grid-cols-[260px_minmax(0,1fr)]'>
          <DashboardSidebar
            projects={projects}
            activeProjectId={activeProjectId}
            activeProject={activeProject}
            loadingProjects={loadingProjects}
            actionLoading={actionLoading}
            socketConnected={socketConnected}
            pagination={pagination}
            currentView={currentView}
            onSelectProject={setActiveProjectId}
            onRunIngestion={handleRunIngestion}
            onDownloadReport={handleDownloadReport}
            onToggleStatus={handleToggleProjectStatus}
            onDeleteProject={handleDeleteProject}
            onCreateProject={() => setShowProjectModal(true)}
            onViewChange={setCurrentView}
          />

          <main className='bg-(--surface-background) px-6 py-6 lg:px-8'>
            <div className='grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]'>
              <div className='space-y-6'>
                <DashboardQuickNavGrid tiles={quickNavTiles} />

                <ProjectDetailsPanel
                  activeProject={activeProject}
                  actionLoading={actionLoading}
                  socketConnected={socketConnected}
                  onRunIngestion={handleRunIngestion}
                  onDownloadReport={(scope) => handleDownloadReport(scope, 'pdf')}
                  onToggleStatus={handleToggleProjectStatus}
                  onDeleteProject={handleDeleteProject}
                />

                <section className='rounded-2xl border border-(--border) bg-(--surface-base) p-4 shadow-sm sm:p-6'>
                  <div className='flex flex-wrap items-center justify-between gap-4 text-xs font-semibold text-(--text-muted)'>
                    <div className='flex items-center gap-2'>
                      <button
                        type='button'
                        onClick={() => setChartView('mentions')}
                        className={`rounded-full border px-3 py-1 ${
                          chartView === 'mentions'
                            ? 'border-(--brand-accent) text-(--brand-accent)'
                            : 'border-(--border) text-(--text-muted)'
                        }`}
                      >
                        Mentions & Reach
                      </button>
                      <button
                        type='button'
                        onClick={() => setChartView('sentiment')}
                        className={`rounded-full border px-3 py-1 ${
                          chartView === 'sentiment'
                            ? 'border-(--brand-accent) text-(--brand-accent)'
                            : 'border-(--border) text-(--text-muted)'
                        }`}
                      >
                        Sentiment
                      </button>
                    </div>
                    <span>Click on the chart to filter by date</span>
                    <div className='flex items-center gap-2'>
                      {(['days', 'weeks', 'months'] as const).map((item) => (
                        <button
                          key={item}
                          type='button'
                          onClick={() => setChartGranularity(item)}
                          className={`rounded-full border px-3 py-1 ${
                            chartGranularity === item
                              ? 'border-(--brand-accent) text-(--brand-accent)'
                              : 'border-(--border) text-(--text-muted)'
                          }`}
                        >
                          {item.charAt(0).toUpperCase() + item.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>
                  <MetricsCharts metrics={metrics} loading={loadingDashboard} />
                </section>

                <div className='flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-(--border) bg-(--surface-base) px-4 py-3 text-xs font-semibold shadow-sm'>
                  <div className='flex items-center gap-2'>
                    <button className='rounded-full border border-(--border) px-3 py-1.5'>
                      Recent first
                      <ChevronDown className='ml-2 inline h-3 w-3' />
                    </button>
                    <button className='rounded-full border border-(--border) px-3 py-1.5 text-(--text-muted)'>
                      Tags
                    </button>
                  </div>
                  <div className='flex items-center gap-2'>
                    {/* Pagination is now handled by MentionsList component */}
                  </div>
                </div>

                {currentView === 'mentions' && (
                  <MentionsList
                    mentions={filteredMentions}
                    loading={loadingDashboard}
                    pagination={pagination ?? undefined}
                    sortOrder={sortOrder}
                    onSortChange={(sort) => {
                      setSortOrder(sort)
                      setCurrentPage(1)
                    }}
                    onPageChange={setCurrentPage}
                  />
                )}

                {currentView === 'analysis' && (
                  <AnalysisView
                    mentions={mentions}
                    loading={loadingDashboard}
                  />
                )}
              </div>

              <div className='space-y-6'>
                <DashboardRightPanel
                  dateRange={dateRange}
                  onDateRangeChange={handleDateRangeChange}
                  mentionsCount={mentions.length}
                  mentionsBySource={mentionsBySource}
                  sourceFilters={sourceFilters}
                  sourceLabels={SOURCE_LABELS}
                  onSourceFilterToggle={handleSourceFilterToggle}
                  sentimentFilters={sentimentFilters}
                  onSentimentToggle={handleSentimentToggle}
                  influenceScore={influenceScore}
                  onInfluenceScoreChange={setInfluenceScore}
                  continentFilter={continentFilter}
                  onContinentFilterChange={setContinentFilter}
                  countryFilter={countryFilter}
                  onCountryFilterChange={setCountryFilter}
                  alerts={alerts}
                  health={health}
                  loading={loadingDashboard}
                  onMarkAlertRead={handleMarkAlertRead}
                />
              </div>
            </div>
          </main>
        </div>
      </div>

      <ProjectModal
        isOpen={showProjectModal}
        formState={projectForm}
        submitting={actionLoading === 'create'}
        onClose={() => setShowProjectModal(false)}
        onFormChange={setProjectForm}
        onSubmit={(event) => {
          handleProjectSubmit(event)
          setShowProjectModal(false)
        }}
      />
    </div>
  )
}
