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
} from '../api/projects'
import { fetchMentions } from '../api/mentions'
import type { PaginationInfo, MentionFilters } from '../api/mentions'
import { fetchAlerts, markAlertRead } from '../api/alerts'
import { downloadReport } from '../api/reports'
import type { ReportScope, ReportFormat } from '../api/reports'
import { useAuth } from '../contexts/AuthContext'
import type { AlertItem, ConnectorHealth, Mention, Project, ProjectMetrics } from '../types/app'
import MetricsCharts from '../components/dashboard/MetricsCharts'
import MentionsList from '../components/dashboard/MentionsList'
import AnalysisView from '../components/dashboard/AnalysisView'
import DashboardTopBar from '../components/dashboard/DashboardTopBar'
import DashboardSidebar from '../components/dashboard/DashboardSidebar'
import DashboardRightPanel from '../components/dashboard/DashboardRightPanel'
import ProjectDetailsPanel from '../components/dashboard/ProjectDetailsPanel'
import ProjectModal from '../components/dashboard/ProjectModal'
import ProjectList from '../components/dashboard/ProjectList'
import DashboardFigureSourceProbe from '../components/dashboard/DashboardFigureSourceProbe'
import DashboardOnboardingGuide from '../components/dashboard/DashboardOnboardingGuide'
import { INITIAL_PROJECT_FORM, SOURCE_LABELS, parseKeywords } from '../components/dashboard/dashboardUtils'
import { useDashboardFilters } from '../hooks/useDashboardFilters'
import { useDashboardSocket } from '../hooks/useDashboardSocket'
import type { ProjectFormState } from '../components/dashboard/ProjectForm'
import { useNavigate } from 'react-router-dom'

type DashboardMode = 'overview' | 'mentions' | 'analytics' | 'reports' | 'sources'
interface DashboardPageProps {
  mode?: DashboardMode
}

const ALERTS_LIMIT = 100

export default function DashboardPage({ mode = 'overview' }: DashboardPageProps) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [projects, setProjects] = useState<Project[]>([])
  const [activeProjectId, setActiveProjectId] = useState<string>('')
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

  const {
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
    currentPage,
    setCurrentPage,
    mentionsBySource,
    filteredMentions,
    appliedFilters,
    handleDateRangeChange,
    handleSourceFilterToggle,
    handleSentimentToggle,
    handleSaveFilters,
    handleClearFilters,
  } = useDashboardFilters({ activeProjectId, mentions })

  const handleSocketAlert = useCallback((alert: AlertItem) => {
    setAlerts((prev) => {
      if (prev.some((item) => item._id === alert._id)) {
        return prev
      }
      return [alert, ...prev].slice(0, ALERTS_LIMIT)
    })
  }, [])

  const { socketConnected } = useDashboardSocket({
    userId: user?._id,
    activeProjectId,
    onAlert: handleSocketAlert,
  })

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
      .catch((err) => {
        if (!cancelled) setError(err.message || 'Failed to load dashboard data')
      })
      .finally(() => {
        if (!cancelled) {
          setLoadingDashboard(false)
          setLoadingMore(false)
        }
      })
    return () => { cancelled = true }
  }, [user, activeProjectId, filters, currentPage, sortOrder, refreshTick])

  useEffect(() => {
    setMentions([])
    setPagination(null)
  }, [activeProjectId])

  useEffect(() => {
    if (!user || !activeProjectId) return
    let cancelled = false
    setLoadingPanels(true)
    Promise.all([
      fetchAlerts(),
      fetchProjectHealth(activeProjectId),
    ])
      .then(([alertData, healthData]) => {
        if (cancelled) return
        setAlerts(alertData)
        setHealth(healthData)
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || 'Failed to load panel data')
      })
      .finally(() => {
        if (!cancelled) setLoadingPanels(false)
      })
    return () => { cancelled = true }
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
      setCurrentPage(1)
      setRefreshTick((prev) => prev + 1)
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

  const handleLoadMoreMentions = () => {
    if (loadingMore || loadingDashboard || !pagination?.hasNextPage) return
    setCurrentPage((prev) => prev + 1)
  }

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
      {(mode === 'overview' || mode === 'mentions' || mode === 'analytics') && (
        <DashboardTopBar
          mentionSearch={mentionSearch}
          onMentionSearchChange={setMentionSearch}
          appliedFilters={appliedFilters}
          mentionsBySource={mentionsBySource}
          sourceFilters={sourceFilters}
          sourceLabels={SOURCE_LABELS}
          onSourceFilterToggle={handleSourceFilterToggle}
          sentimentFilters={sentimentFilters}
          onSentimentToggle={handleSentimentToggle}
          onClearFilters={handleClearFilters}
          onSaveFilters={handleSaveFilters}
        />
      )}
      <div className='mx-auto w-full max-w-[1500px] px-4 pb-2 sm:px-6 lg:hidden'>
        <div className='space-y-4'>
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
            compact
          />

          <button
            onClick={() => setShowProjectModal(true)}
            className='flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-(--sidebar-divider) py-3 text-xs font-semibold uppercase tracking-[0.2em] text-(--sidebar-muted) transition-colors hover:border-(--sidebar-active) hover:text-(--sidebar-active)'
          >
            Create new project
          </button>

          <div className='grid grid-cols-2 gap-2 rounded-2xl border border-(--border) bg-(--surface-base) p-4 text-xs shadow-sm'>
            {[
              { label: 'Overview', path: '/app', key: 'overview' as DashboardMode },
              { label: 'Mentions', path: '/app/mentions', key: 'mentions' as DashboardMode },
              { label: 'Analytics', path: '/app/analytics', key: 'analytics' as DashboardMode },
              { label: 'Reports', path: '/app/reports', key: 'reports' as DashboardMode },
            ].map((item) => (
              <button
                key={item.path}
                type='button'
                onClick={() => navigate(item.path)}
                className={`rounded-lg border px-3 py-2 text-xs font-semibold ${
                  mode === item.key
                    ? 'border-(--brand-accent) text-(--brand-accent)'
                    : 'border-(--border) text-(--text-muted)'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className='mx-auto w-full max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8'>
        <div className='grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)] lg:gap-0'>
          <DashboardSidebar
            projects={projects}
            activeProjectId={activeProjectId}
            activeProject={activeProject}
            loadingProjects={loadingProjects}
            actionLoading={actionLoading}
            socketConnected={socketConnected}
            mode={mode}
            mentionsTotal={pagination?.totalCount}
            onSelectProject={setActiveProjectId}
            onRunIngestion={handleRunIngestion}
            onDownloadReport={handleDownloadReport}
            onToggleStatus={handleToggleProjectStatus}
            onDeleteProject={handleDeleteProject}
            onCreateProject={() => setShowProjectModal(true)}
            className='order-2 lg:order-1'
          />

          <main className='order-1 min-w-0 bg-(--surface-background) px-0 py-0 sm:px-4 sm:py-4 lg:order-2 lg:px-8 lg:py-6'>
            <div className={`grid min-w-0 gap-6 ${mode === 'overview' || mode === 'mentions' || mode === 'analytics' ? 'xl:grid-cols-[minmax(0,1fr)_320px]' : ''}`}>
              <div className='min-w-0 space-y-6'>
                {(mode === 'overview' || mode === 'mentions' || mode === 'analytics' || mode === 'reports') && (
                  <ProjectDetailsPanel
                    activeProject={activeProject}
                    actionLoading={actionLoading}
                    socketConnected={socketConnected}
                    onRunIngestion={handleRunIngestion}
                    onDownloadReport={(scope) => handleDownloadReport(scope, 'pdf')}
                    onToggleStatus={handleToggleProjectStatus}
                    onDeleteProject={handleDeleteProject}
                  />
                )}

                {(mode === 'overview' || mode === 'analytics') && (
                  <section className='rounded-2xl border border-(--border) bg-(--surface-base) p-4 shadow-sm sm:p-6'>
                    <div className='flex flex-wrap items-center justify-between gap-4 text-xs font-semibold text-(--text-muted)'>
                      <span>Volume analysis</span>
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
                    <MetricsCharts metrics={metrics} loading={loadingDashboard} granularity={chartGranularity} />
                  </section>
                )}

                {mode === 'mentions' && (
                  <MentionsList
                    mentions={filteredMentions}
                    loading={loadingDashboard}
                    pagination={pagination ?? undefined}
                    sortOrder={sortOrder}
                    onSortChange={(sort) => {
                      setSortOrder(sort)
                      setCurrentPage(1)
                    }}
                    onLoadMore={handleLoadMoreMentions}
                    loadingMore={loadingMore}
                  />
                )}

                {mode === 'analytics' && (
                  <AnalysisView
                    mentions={mentions}
                    loading={loadingDashboard}
                  />
                )}

                {mode === 'reports' && (
                  <section className='rounded-2xl border border-(--border) bg-(--surface-base) p-4 shadow-sm sm:p-6'>
                    <h3 className='text-base font-semibold sm:text-lg'>Reports</h3>
                    <p className='mt-2 text-sm text-(--text-muted)'>
                      Download report exports for the active project.
                    </p>
                    <div className='mt-4 grid gap-3 sm:grid-cols-2'>
                      {([
                        { scope: 'summary', label: 'Summary Report' },
                        { scope: 'all', label: 'Full Report' },
                        { scope: 'mentions', label: 'Mentions Export' },
                        { scope: 'last_run', label: 'Last Run Report' },
                      ] as const).map((item) => (
                        <button
                          key={item.scope}
                          type='button'
                          onClick={() => handleDownloadReport(item.scope, 'pdf')}
                          disabled={actionLoading === 'report' || !activeProjectId}
                          className='rounded-xl border border-(--border) bg-(--surface-muted) px-4 py-3 text-left text-sm font-semibold text-(--text-primary) hover:border-(--brand-accent) disabled:opacity-60'
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </section>
                )}

                {mode === 'sources' && <DashboardFigureSourceProbe activeProject={activeProject} />}
              </div>

              {(mode === 'overview' || mode === 'mentions' || mode === 'analytics') && (
                <div className='min-w-0 space-y-6'>
                  <DashboardRightPanel
                    dateRange={dateRange}
                    onDateRangeChange={handleDateRangeChange}
                    mentionsCount={pagination?.totalCount ?? mentions.length}
                    mentionsBySource={mentionsBySource}
                    sourceFilters={sourceFilters}
                    sourceLabels={SOURCE_LABELS}
                    onSourceFilterToggle={handleSourceFilterToggle}
                    sentimentFilters={sentimentFilters}
                    onSentimentToggle={handleSentimentToggle}
                    alerts={filteredAlerts}
                    health={health}
                    loading={loadingPanels}
                    onMarkAlertRead={handleMarkAlertRead}
                  />
                </div>
              )}
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
      <DashboardOnboardingGuide userId={user?._id} />
    </div>
  )
}
