import { useCallback, useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import {
  createProject,
  deleteProject,
  fetchProjectHealth,
  fetchProjectMetrics,
  listProjects,
  runProjectIngestion,
  updateProjectStatus,
} from '../../../api/projects'
import { fetchMentions } from '../../../api/mentions'
import type { MentionFilters, PaginationInfo } from '../../../api/mentions'
import { fetchAlerts, markAlertRead } from '../../../api/alerts'
import { downloadReport } from '../../../api/reports'
import type { ReportFormat, ReportScope } from '../../../api/reports'
import type { AlertItem, ConnectorHealth, Mention, Project, ProjectMetrics, User } from '../../../types/app'
import {
  INITIAL_FILTERS,
  INITIAL_PROJECT_FORM,
  SOURCE_LABELS,
  getDateRange,
  normalizeSentiment,
  normalizeSource,
  parseKeywords,
} from '../utils/dashboardUtils'
import type { ProjectFormState } from '../components/ProjectForm'
import type { DashboardFilters } from '../types/dashboard'

const ALERTS_LIMIT = 100

type SentimentKey = 'negative' | 'neutral' | 'positive'

interface UseDashboardDataParams {
  user: User | null
}

export function useDashboardData({ user }: UseDashboardDataParams) {
  const [projects, setProjects] = useState<Project[]>([])
  const [activeProjectId, setActiveProjectId] = useState('')
  const [metrics, setMetrics] = useState<ProjectMetrics | null>(null)
  const [mentions, setMentions] = useState<Mention[]>([])
  const [alerts, setAlerts] = useState<AlertItem[]>([])
  const [health, setHealth] = useState<ConnectorHealth[]>([])

  const [loadingDashboard, setLoadingDashboard] = useState(false)
  const [loadingPanels, setLoadingPanels] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [loadingProjects, setLoadingProjects] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const [projectForm, setProjectForm] = useState<ProjectFormState>({
    ...INITIAL_PROJECT_FORM,
    sources: { ...INITIAL_PROJECT_FORM.sources },
  })
  const [showProjectModal, setShowProjectModal] = useState(false)
  const [pagination, setPagination] = useState<PaginationInfo | null>(null)
  const [refreshTick, setRefreshTick] = useState(0)

  const [filters, setFilters] = useState<DashboardFilters>({ ...INITIAL_FILTERS })
  const [mentionSearch, setMentionSearch] = useState('')
  const [chartGranularity, setChartGranularity] = useState<'days' | 'weeks' | 'months'>('days')
  const [dateRange, setDateRange] = useState('last_30_days')
  const [sourceFilters, setSourceFilters] = useState<Record<string, boolean>>({})
  const [sentimentFilters, setSentimentFilters] = useState<Record<string, boolean>>({})
  const [sortOrder, setSortOrder] = useState<'recent' | 'oldest' | 'reach'>('recent')
  const [currentPage, setCurrentPage] = useState(1)

  const filtersStorageKey = useMemo(() => `npip_filters_v1_${activeProjectId}`, [activeProjectId])

  const handleDateRangeChange = (value: string) => {
    setDateRange(value)
    const range = getDateRange(value)
    setFilters((prev) => ({ ...prev, from: range.from, to: range.to }))
    setCurrentPage(1)
  }

  const handleSourceFilterToggle = (sourceId: string) => {
    setSourceFilters((prev) => ({ ...prev, [sourceId]: !prev[sourceId] }))
    setCurrentPage(1)
  }

  const handleSentimentToggle = (key: SentimentKey) => {
    setSentimentFilters((prev) => ({ ...prev, [key]: !prev[key] }))
    setCurrentPage(1)
  }

  const handleSaveFilters = () => {
    if (!activeProjectId) return
    const savedFilters = {
      dateRange,
      sourceFilters,
      sentimentFilters,
    }
    localStorage.setItem(filtersStorageKey, JSON.stringify(savedFilters))
    alert('Filters saved!')
  }

  const handleClearFilters = () => {
    setDateRange('last_30_days')
    const range = getDateRange('last_30_days')
    setFilters((prev) => ({ ...prev, from: range.from, to: range.to }))
    setSourceFilters({})
    setSentimentFilters({})
    setMentionSearch('')
    setCurrentPage(1)
    if (activeProjectId) {
      localStorage.removeItem(filtersStorageKey)
    }
  }

  useEffect(() => {
    if (!activeProjectId) return
    const saved = localStorage.getItem(filtersStorageKey)
    if (!saved) return

    try {
      const parsed = JSON.parse(saved) as {
        dateRange?: string
        sourceFilters?: Record<string, boolean>
        sentimentFilters?: Record<string, boolean>
      }

      if (parsed.dateRange) {
        setDateRange(parsed.dateRange)
        const range = getDateRange(parsed.dateRange)
        setFilters((prev) => ({ ...prev, from: range.from, to: range.to }))
      }
      if (parsed.sourceFilters) {
        setSourceFilters(parsed.sourceFilters)
      }
      if (parsed.sentimentFilters) {
        setSentimentFilters(parsed.sentimentFilters)
      }
    } catch {
      // Ignore malformed filters.
    }
  }, [activeProjectId, filtersStorageKey])

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
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load projects')
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoadingProjects(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [user])

  useEffect(() => {
    if (!user || !activeProjectId) return
    let cancelled = false
    const isLoadMore = currentPage > 1

    if (isLoadMore) {
      setLoadingMore(true)
    } else {
      setLoadingDashboard(true)
    }

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
    ])
      .then(([metricData, mentionData]) => {
        if (cancelled) return

        setMetrics(metricData)
        setMentions((prev) => {
          if (currentPage === 1) return mentionData.mentions

          const seen = new Set(prev.map((item) => item._id))
          const next = [...prev]
          mentionData.mentions.forEach((item) => {
            if (!seen.has(item._id)) {
              seen.add(item._id)
              next.push(item)
            }
          })
          return next
        })
        setPagination(mentionData.pagination)
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load dashboard data')
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoadingDashboard(false)
          setLoadingMore(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [user, activeProjectId, filters, currentPage, sortOrder, refreshTick])

  useEffect(() => {
    setMentions([])
    setPagination(null)
    setCurrentPage(1)
  }, [activeProjectId])

  useEffect(() => {
    if (!user || !activeProjectId) return
    let cancelled = false

    setLoadingPanels(true)
    Promise.all([fetchAlerts(), fetchProjectHealth(activeProjectId)])
      .then(([alertData, healthData]) => {
        if (cancelled) return
        setAlerts(alertData)
        setHealth(healthData)
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load panel data')
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoadingPanels(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [user, activeProjectId])

  const activeProject = useMemo(
    () => projects.find((project) => project._id === activeProjectId) || null,
    [projects, activeProjectId],
  )

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
    const activeSources = Object.entries(sourceFilters)
      .filter(([, enabled]) => enabled)
      .map(([key]) => key)
    const activeSentiments = Object.entries(sentimentFilters)
      .filter(([, enabled]) => enabled)
      .map(([key]) => key)

    const filtered = mentions.filter((mention) => {
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

    const getTimestamp = (value?: string | Date | null) => {
      if (!value) return 0
      const date = new Date(value)
      return Number.isNaN(date.getTime()) ? 0 : date.getTime()
    }

    const sorted = [...filtered]
    if (sortOrder === 'recent') {
      sorted.sort((a, b) => getTimestamp(b.publishedAt) - getTimestamp(a.publishedAt))
    } else if (sortOrder === 'oldest') {
      sorted.sort((a, b) => getTimestamp(a.publishedAt) - getTimestamp(b.publishedAt))
    } else if (sortOrder === 'reach') {
      sorted.sort((a, b) => (b.reachEstimate || 0) - (a.reachEstimate || 0))
    }

    return sorted
  }, [mentionSearch, mentions, sentimentFilters, sourceFilters, sortOrder])

  const appliedFilters = useMemo(() => {
    const chips: Array<{ id: string; label: string }> = []

    if (mentionSearch.trim()) {
      chips.push({ id: 'search', label: `Search: ${mentionSearch.trim()}` })
    }

    if (dateRange !== 'last_30_days') {
      const labelMap: Record<string, string> = {
        last_7_days: 'Last 7 days',
        last_30_days: 'Last 30 days',
        last_90_days: 'Last 90 days',
      }
      chips.push({ id: 'date', label: `Date: ${labelMap[dateRange] || 'Custom'}` })
    }

    Object.entries(sourceFilters)
      .filter(([, enabled]) => enabled)
      .forEach(([sourceId]) => {
        chips.push({
          id: `source-${sourceId}`,
          label: `Source: ${SOURCE_LABELS[sourceId] || sourceId}`,
        })
      })

    Object.entries(sentimentFilters)
      .filter(([, enabled]) => enabled)
      .forEach(([sentiment]) => {
        const label = sentiment.charAt(0).toUpperCase() + sentiment.slice(1)
        chips.push({ id: `sentiment-${sentiment}`, label: `Sentiment: ${label}` })
      })

    return chips
  }, [mentionSearch, dateRange, sourceFilters, sentimentFilters])

  const filteredAlerts = useMemo(() => {
    if (!filters.from || !filters.to) return alerts
    const fromMs = new Date(filters.from).getTime()
    const toMs = new Date(filters.to).getTime() + 24 * 60 * 60 * 1000 - 1
    if (Number.isNaN(fromMs) || Number.isNaN(toMs)) return alerts

    return alerts.filter((alert) => {
      const createdAtMs = new Date(alert.createdAt).getTime()
      if (Number.isNaN(createdAtMs)) return true
      return createdAtMs >= fromMs && createdAtMs <= toMs
    })
  }, [alerts, filters.from, filters.to])

  const pushSocketAlert = useCallback((alert: AlertItem) => {
    setAlerts((prev) => {
      if (prev.some((item) => item._id === alert._id)) {
        return prev
      }
      return [alert, ...prev].slice(0, ALERTS_LIMIT)
    })
  }, [])

  const handleProjectSubmit = async (event: FormEvent<HTMLFormElement>): Promise<boolean> => {
    event.preventDefault()
    if (!user || actionLoading) return false

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
      return true
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create project')
      return false
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
          project._id === activeProjectId ? { ...project, lastRunAt: nowIso } : project,
        ),
      )
      setCurrentPage(1)
      setRefreshTick((prev) => prev + 1)
    } catch (err: unknown) {
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
    } catch (err: unknown) {
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
    } catch (err: unknown) {
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
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to delete project')
    } finally {
      setActionLoading(null)
    }
  }

  const handleMarkAlertRead = async (alertId: string) => {
    try {
      const updated = await markAlertRead(alertId)
      setAlerts((prev) => prev.map((item) => (item._id === updated._id ? updated : item)))
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to mark alert as read')
    }
  }

  const handleLoadMoreMentions = () => {
    if (loadingMore || loadingDashboard || !pagination?.hasNextPage) return
    setCurrentPage((prev) => prev + 1)
  }

  return {
    projects,
    activeProjectId,
    setActiveProjectId,
    activeProject,
    metrics,
    mentions,
    health,
    loadingDashboard,
    loadingPanels,
    loadingMore,
    loadingProjects,
    actionLoading,
    error,
    setError,
    projectForm,
    setProjectForm,
    showProjectModal,
    setShowProjectModal,
    pagination,
    filteredAlerts,
    pushSocketAlert,
    handleProjectSubmit,
    handleRunIngestion,
    handleToggleProjectStatus,
    handleDownloadReport,
    handleDeleteProject,
    handleMarkAlertRead,
    handleLoadMoreMentions,
    filters,
    mentionSearch,
    setMentionSearch,
    chartGranularity,
    setChartGranularity,
    dateRange,
    sourceFilters,
    sentimentFilters,
    sortOrder,
    setSortOrder,
    setCurrentPage,
    mentionsBySource,
    filteredMentions,
    appliedFilters,
    handleDateRangeChange,
    handleSourceFilterToggle,
    handleSentimentToggle,
    handleSaveFilters,
    handleClearFilters,
  }
}

