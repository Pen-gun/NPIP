import { useEffect, useMemo, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { io, Socket } from 'socket.io-client'
import Bell from 'lucide-react/dist/esm/icons/bell'
import ChevronDown from 'lucide-react/dist/esm/icons/chevron-down'
import HelpCircle from 'lucide-react/dist/esm/icons/help-circle'
import Plus from 'lucide-react/dist/esm/icons/plus'
import Search from 'lucide-react/dist/esm/icons/search'
import SlidersHorizontal from 'lucide-react/dist/esm/icons/sliders-horizontal'
import Sparkles from 'lucide-react/dist/esm/icons/sparkles'
import X from 'lucide-react/dist/esm/icons/x'
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
  ProjectForm,
  ProjectList,
  MetricsCharts,
  MentionsList,
  AlertsPanel,
  ConnectorHealthPanel,
  SourcePolicyPanel,
  AnalysisView,
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

const REPORT_NAV_ITEMS = Object.freeze([
  'Email reports',
  'PDF report',
  'Excel report',
  'Infographic',
])

const ANALYTICS_NAV_ITEMS = Object.freeze([
  'Geo analysis',
  'Influencer analysis',
  'Emotion analysis',
])

const FILTER_CHIPS = Object.freeze([
  { id: 'x', label: 'X (Twitter)' },
  { id: 'tiktok', label: 'TikTok' },
])

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
  const [connectedSources, setConnectedSources] = useState<Record<string, boolean>>({})
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

  const handleConnectSource = (sourceId: string) => {
    setConnectedSources((prev) => ({ ...prev, [sourceId]: !prev[sourceId] }))
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

  return (
    <>
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
      <div className='bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.08),_transparent_55%)]'>
        <div className='mx-auto flex w-full max-w-[1400px] flex-col gap-4 px-4 py-4 sm:px-6 lg:px-8'>
          <div className='rounded-2xl border border-(--border) bg-[#1d4ed8] px-4 py-3 text-xs font-semibold text-white shadow-lg'>
            Trial view with limited data. Upgrade to unlock full public mentions. <button className='ml-2 underline'>Upgrade</button>
          </div>
        </div>
      </div>
      <div className='mx-auto w-full max-w-[1400px] px-4 py-6 sm:px-6 lg:px-8'>
        <div className='grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)_320px]'>
          <aside className='space-y-4'>
            <div className='rounded-[20px] border border-(--border) bg-(--surface-base) p-4 shadow-(--shadow)'>
              <div className='flex items-center justify-between'>
                <h3 className='text-sm font-semibold'>Projects</h3>
                <button className='rounded-full border border-(--border) p-1.5 text-(--text-muted) hover:text-(--text-primary)'>
                  <Plus className='h-4 w-4' />
                </button>
              </div>
              <div className='mt-3 space-y-2'>
                {projects.map((project) => (
                  <button
                    key={project._id}
                    onClick={() => setActiveProjectId(project._id)}
                    className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-xs font-semibold transition ${
                      activeProjectId === project._id
                        ? 'bg-(--brand-primary) text-(--text-inverse)'
                        : 'border border-(--border) text-(--text-primary) hover:bg-(--surface-muted)'
                    }`}
                  >
                    <span>{project.name}</span>
                    <span className='text-[10px] text-(--text-muted)'>
                      {filteredMentions.length} new
                    </span>
                  </button>
                ))}
                {!projects.length && (
                  <p className='text-xs text-(--text-muted)'>No projects yet.</p>
                )}
              </div>
            </div>

            <button
              onClick={() => setShowProjectModal(true)}
              className='flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-(--border) py-3 text-sm font-medium text-(--text-muted) transition-colors hover:border-(--brand-accent) hover:text-(--brand-accent)'
            >
              <Plus className='h-4 w-4' />
              Create New Project
            </button>

            <ProjectList
              projects={projects}
              activeProjectId={activeProjectId}
              activeProject={activeProject}
              loading={loadingProjects}
              actionLoading={actionLoading}
              socketConnected={socketConnected}
              onSelectProject={setActiveProjectId}
              onRunIngestion={handleRunIngestion}
              onDownloadReport={handleDownloadReport}
              onToggleStatus={handleToggleProjectStatus}
              onDeleteProject={handleDeleteProject}
            />

            <div className='rounded-[20px] border border-(--border) bg-(--surface-base) p-4 text-xs shadow-(--shadow)'>
              <p className='text-[11px] font-semibold uppercase tracking-[0.2em] text-(--text-muted)'>Mentions</p>
              <div className='mt-3 space-y-2'>
                {['Mentions', 'Analysis', 'Comparison', 'Influencers & Sources'].map((label) => {
                  const viewMap: Record<string, DashboardView | null> = {
                    'Mentions': 'mentions',
                    'Analysis': 'analysis',
                    'Comparison': null,
                    'Influencers & Sources': null,
                  }
                  const targetView = viewMap[label]
                  const isActive = targetView === currentView
                  const isComingSoon = targetView === null
                  
                  const handleNavClick = () => {
                    if (targetView) setCurrentView(targetView)
                  }
                  
                  return (
                    <button
                      key={label}
                      disabled={isComingSoon}
                      onClick={handleNavClick}
                      title={isComingSoon ? 'Coming soon' : undefined}
                      className={`flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-left font-semibold ${
                        isActive 
                          ? 'bg-(--surface-muted) text-(--brand-accent)' 
                          : isComingSoon
                            ? 'cursor-not-allowed text-(--text-muted) opacity-50'
                            : 'text-(--text-primary) hover:bg-(--surface-muted)'
                      }`}
                    >
                      <span className='flex items-center gap-2'>
                        {label}
                        {isComingSoon && (
                          <span className='rounded bg-(--surface-muted) px-1.5 py-0.5 text-[9px] font-normal'>Soon</span>
                        )}
                      </span>
                      {label === 'Mentions' && pagination && (
                        <span className='rounded-full border border-(--border) px-2 py-0.5 text-[10px] text-(--text-muted)'>
                          {pagination.totalCount.toLocaleString()}
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
              <p className='mt-5 text-[11px] font-semibold uppercase tracking-[0.2em] text-(--text-muted)'>Reports</p>
              <div className='mt-2 space-y-1'>
                {REPORT_NAV_ITEMS.map((item) => {
                  const isPDF = item === 'PDF report'
                  const isExcel = item === 'Excel report'
                  const isCSV = item === 'CSV export'
                  const isEnabled = isPDF || isExcel
                  const isComingSoon = !isEnabled
                  
                  const handleClick = () => {
                    if (!activeProjectId) return
                    if (isPDF) handleDownloadReport('summary', 'pdf')
                    else if (isExcel) handleDownloadReport('all', 'excel')
                  }
                  
                  return (
                    <button
                      key={item}
                      disabled={isComingSoon || actionLoading === 'report'}
                      title={isComingSoon ? 'Coming soon' : `Download ${item}`}
                      onClick={handleClick}
                      className={`flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-left font-semibold ${
                        isComingSoon
                          ? 'cursor-not-allowed text-(--text-muted) opacity-50'
                          : actionLoading === 'report'
                            ? 'cursor-wait opacity-70'
                            : 'text-(--text-primary) hover:bg-(--surface-muted)'
                      }`}
                    >
                      <span className='flex items-center gap-2'>
                        {item}
                        {isComingSoon && (
                          <span className='rounded bg-(--surface-muted) px-1.5 py-0.5 text-[9px] font-normal'>Soon</span>
                        )}
                      </span>
                    </button>
                  )
                })}
              </div>
              <p className='mt-5 text-[11px] font-semibold uppercase tracking-[0.2em] text-(--text-muted)'>Advanced analytics</p>
              <div className='mt-2 space-y-1'>
                {ANALYTICS_NAV_ITEMS.map((item) => (
                  <button
                    key={item}
                    disabled
                    title='Coming soon'
                    className='flex w-full cursor-not-allowed items-center justify-between rounded-lg px-2 py-1.5 text-left font-semibold text-(--text-muted) opacity-50'
                  >
                    <span className='flex items-center gap-2'>
                      {item}
                      <span className='rounded bg-(--surface-muted) px-1.5 py-0.5 text-[9px] font-normal'>Soon</span>
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className='rounded-[20px] border border-(--border) bg-(--surface-base) p-4 text-xs shadow-(--shadow)'>
              <div className='flex items-center gap-2 text-sm font-semibold'>
                <Sparkles className='h-4 w-4 text-(--brand-accent)' />
                Upcoming webinar
              </div>
              <p className='mt-2 text-(--text-muted)'>Get a social listening certificate with NPIP.</p>
              <p className='mt-2 text-(--text-muted)'>Date: Wednesday, Jan 28, 2026</p>
              <button 
                disabled
                title='Coming soon'
                className='mt-3 inline-flex cursor-not-allowed items-center gap-2 rounded-full border border-(--border) px-3 py-1.5 text-xs font-semibold opacity-50'
              >
                Sign up (Coming soon)
              </button>
            </div>
          </aside>

          <main className='space-y-6'>
            <div className='flex flex-wrap items-center justify-between gap-3 rounded-[20px] border border-(--border) bg-(--surface-base) p-4 shadow-(--shadow)'>
              <div className='flex flex-1 items-center gap-2 rounded-full border border-(--border) bg-(--surface-muted) px-3 py-2 text-sm'>
                <Search className='h-4 w-4 text-(--text-muted)' />
                <input
                  value={mentionSearch}
                  onChange={(event) => setMentionSearch(event.target.value)}
                  placeholder='Search through mentions, authors & domains...'
                  className='w-full bg-transparent text-sm outline-none'
                />
              </div>
              <div className='flex items-center gap-2 text-xs font-semibold'>
                <button className='inline-flex items-center gap-2 rounded-full border border-(--border) px-3 py-2'>
                  <SlidersHorizontal className='h-4 w-4' />
                  Filters
                </button>
                <button className='rounded-full border border-(--border) px-4 py-2 text-xs font-semibold text-(--text-primary)'>
                  Upgrade
                </button>
                <button className='rounded-full border border-(--border) p-2'>
                  <HelpCircle className='h-4 w-4' />
                </button>
                <button className='rounded-full border border-(--border) p-2'>
                  <Bell className='h-4 w-4' />
                </button>
              </div>
            </div>

            <div className='flex flex-wrap items-center gap-2 text-xs font-semibold text-(--text-muted)'>
              {FILTER_CHIPS.map((chip) => (
                <span
                  key={chip.id}
                  className='rounded-full border border-(--border) bg-(--surface-muted) px-3 py-1'
                >
                  {chip.label}
                </span>
              ))}
              <button 
                onClick={handleClearFilters}
                className='inline-flex items-center gap-1 text-(--brand-accent) hover:underline'
              >
                Clear filters
              </button>
              <button 
                onClick={handleSaveFilters}
                className='inline-flex items-center gap-1 text-(--brand-accent) hover:underline'
              >
                Save filters
              </button>
            </div>

            <section className='rounded-[20px] border border-(--border) bg-(--surface-base) p-4 shadow-(--shadow) sm:p-6'>
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

            <div className='flex flex-wrap items-center justify-between gap-3 rounded-[20px] border border-(--border) bg-(--surface-base) px-4 py-3 text-xs font-semibold shadow-(--shadow)'>
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
          </main>

          <aside className='space-y-4'>
            <div className='rounded-[20px] border border-(--border) bg-(--surface-base) p-4 text-xs shadow-(--shadow)'>
              <div className='flex items-center justify-between'>
                <span className='font-semibold'>Last 30 days</span>
                <button className='rounded-full border border-(--border) px-2 py-1 text-[10px]'>
                  {dateRange === 'last_30_days' ? 'Last 30 days' : 'Custom'}
                  <ChevronDown className='ml-1 inline h-3 w-3' />
                </button>
              </div>
              <div className='mt-3 grid gap-2'>
                <label className='text-[11px] text-(--text-muted)'>Date range</label>
                <select
                  value={dateRange}
                  onChange={(event) => handleDateRangeChange(event.target.value)}
                  className='rounded-xl border border-(--border) bg-(--surface-muted) px-3 py-2 text-xs font-semibold'
                >
                  <option value='last_7_days'>Last 7 days</option>
                  <option value='last_30_days'>Last 30 days</option>
                  <option value='last_90_days'>Last 90 days</option>
                </select>
              </div>
            </div>

            <div className='rounded-[20px] border border-(--border) bg-(--surface-base) p-4 text-xs shadow-(--shadow)'>
              <div className='flex items-center justify-between'>
                <span className='font-semibold'>Sources</span>
                <span className='text-(--text-muted)'>Total: {mentions.length.toLocaleString()}</span>
              </div>
              <div className='mt-3 grid gap-3'>
                {/* Dynamic sources from actual mentions */}
                {Object.entries(mentionsBySource)
                  .sort((a, b) => b[1] - a[1])
                  .map(([sourceId, count]) => (
                  <label key={sourceId} className='flex items-center justify-between gap-2'>
                    <span className='flex items-center gap-2'>
                      <input
                        type='checkbox'
                        checked={!!sourceFilters[sourceId]}
                        onChange={() => handleSourceFilterToggle(sourceId)}
                        className='h-4 w-4 rounded border-(--border)'
                      />
                      <span className='font-semibold'>{SOURCE_LABELS[sourceId] || sourceId}</span>
                      <span className='text-[11px] text-(--text-muted)'>({count})</span>
                    </span>
                  </label>
                ))}
                {Object.keys(mentionsBySource).length === 0 && (
                  <p className='text-(--text-muted)'>No sources yet</p>
                )}
              </div>
            </div>

            <div className='rounded-[20px] border border-(--border) bg-(--surface-base) p-4 text-xs shadow-(--shadow)'>
              <span className='font-semibold'>Sentiment</span>
              <div className='mt-3 flex flex-wrap gap-3'>
                {(['negative', 'neutral', 'positive'] as const).map((item) => (
                  <label key={item} className='flex items-center gap-2 font-semibold capitalize'>
                    <input
                      type='checkbox'
                      checked={!!sentimentFilters[item]}
                      onChange={() => handleSentimentToggle(item)}
                      className='h-4 w-4 rounded border-(--border)'
                    />
                    {item}
                  </label>
                ))}
              </div>
            </div>

            <div className='rounded-[20px] border border-(--border) bg-(--surface-base) p-4 text-xs shadow-(--shadow)'>
              <span className='font-semibold'>Influence score</span>
              <div className='mt-3'>
                <input
                  type='range'
                  min={1}
                  max={10}
                  value={influenceScore}
                  onChange={(event) => setInfluenceScore(Number(event.target.value))}
                  className='w-full'
                />
                <div className='mt-1 flex items-center justify-between text-[10px] text-(--text-muted)'>
                  <span>1</span>
                  <span>10</span>
                </div>
              </div>
            </div>

            <div className='rounded-[20px] border border-(--border) bg-(--surface-base) p-4 text-xs shadow-(--shadow)'>
              <div className='flex items-center justify-between'>
                <span className='font-semibold'>Geolocation</span>
                <button className='text-[11px] text-(--text-muted)'>Exclude countries</button>
              </div>
              <div className='mt-3 grid gap-2'>
                <select
                  value={continentFilter}
                  onChange={(event) => setContinentFilter(event.target.value)}
                  className='rounded-xl border border-(--border) bg-(--surface-muted) px-3 py-2 text-xs font-semibold'
                >
                  <option value=''>Choose continents</option>
                  <option value='asia'>Asia</option>
                  <option value='europe'>Europe</option>
                  <option value='north_america'>North America</option>
                </select>
                <select
                  value={countryFilter}
                  onChange={(event) => setCountryFilter(event.target.value)}
                  className='rounded-xl border border-(--border) bg-(--surface-muted) px-3 py-2 text-xs font-semibold'
                >
                  <option value=''>Choose countries</option>
                  <option value='nepal'>Nepal</option>
                  <option value='india'>India</option>
                  <option value='usa'>United States</option>
                </select>
              </div>
            </div>

            <div className='space-y-4'>
              <AlertsPanel
                alerts={alerts}
                loading={loadingDashboard}
                onMarkRead={handleMarkAlertRead}
              />
              <ConnectorHealthPanel health={health} loading={loadingDashboard} />
              <SourcePolicyPanel />
            </div>
          </aside>
        </div>
      </div>

      {/* Create Project Modal */}
      {showProjectModal && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4'>
          <div className='relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-(--border) bg-(--surface-base) p-6 shadow-xl'>
            <button
              onClick={() => setShowProjectModal(false)}
              className='absolute right-4 top-4 rounded-lg p-1 text-(--text-muted) hover:bg-(--surface-muted) hover:text-(--text-base)'
            >
              <X className='h-5 w-5' />
            </button>
            <h2 className='mb-4 text-lg font-semibold'>Create New Project</h2>
            <ProjectForm
              formState={projectForm}
              onFormChange={setProjectForm}
              onSubmit={(e) => {
                handleProjectSubmit(e)
                setShowProjectModal(false)
              }}
              submitting={actionLoading === 'create'}
            />
          </div>
        </div>
      )}
    </>
  )
}
