import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { io, Socket } from 'socket.io-client'
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
import { fetchAlerts, markAlertRead } from '../api/alerts'
import { downloadReport } from '../api/reports'
import { useAuth } from '../contexts/AuthContext'
import type { AlertItem, ConnectorHealth, Mention, Project, ProjectMetrics } from '../types/app'
import {
  ProjectForm,
  ProjectList,
  DashboardFiltersBar,
  MetricsCharts,
  MentionsList,
  AlertsPanel,
  ConnectorHealthPanel,
  SourcePolicyPanel,
} from '../components/dashboard'
import type { ProjectFormState, DashboardFilters } from '../components/dashboard'

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
    x: false,
    meta: false,
    tiktok: false,
    viber: false,
  },
})

const parseKeywords = (value: string): string[] =>
  value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)

export default function DashboardPage() {
  const { user } = useAuth()
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

  useEffect(() => {
    if (!user) return
    let cancelled = false
    setLoadingProjects(true)
    setError(null)
    listProjects()
      .then((data) => {
        if (cancelled) return
        setProjects(data)
        if (data.length && !activeProjectId) {
          setActiveProjectId(data[0]._id)
        }
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || 'Failed to load projects')
      })
      .finally(() => {
        if (!cancelled) setLoadingProjects(false)
      })
    return () => { cancelled = true }
  }, [user, activeProjectId])

  useEffect(() => {
    if (!user || !activeProjectId) return
    let cancelled = false
    setLoadingDashboard(true)
    setError(null)
    Promise.all([
      fetchProjectMetrics(activeProjectId, filters.from, filters.to),
      fetchMentions(activeProjectId, filters),
      fetchAlerts(),
      fetchProjectHealth(activeProjectId),
    ])
      .then(([metricData, mentionData, alertData, healthData]) => {
        if (cancelled) return
        setMetrics(metricData)
        setMentions(mentionData)
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
  }, [user, activeProjectId, filters])

  useEffect(() => {
    if (!user) return
    const socket: Socket = io(SOCKET_URL || window.location.origin, {
      withCredentials: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    })

    socket.on('connect', () => {
      setSocketConnected(true)
      socket.emit('join', { userId: user._id, projectId: activeProjectId })
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

  const handleDownloadReport = async () => {
    if (!activeProjectId || actionLoading) return
    setActionLoading('report')
    setError(null)
    try {
      await downloadReport(activeProjectId)
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
      <div className='mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:gap-8 sm:px-6 sm:py-8 lg:gap-10 lg:px-10 lg:py-10'>
        <section className='landing-reveal grid gap-4 sm:gap-6 lg:grid-cols-[1.1fr_0.9fr]'>
          <ProjectForm
            formState={projectForm}
            onFormChange={setProjectForm}
            onSubmit={handleProjectSubmit}
            submitting={actionLoading === 'create'}
          />
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
        </section>

        <section className='landing-reveal grid gap-4 sm:gap-6 xl:grid-cols-[2fr_1fr]'>
          <div className='space-y-4 sm:space-y-6'>
            <div className='landing-reveal-soft rounded-[20px] border border-(--border) bg-(--surface-base) p-4 shadow-(--shadow) sm:rounded-[28px] sm:p-6'>
              <DashboardFiltersBar filters={filters} onFiltersChange={setFilters} />
              <MetricsCharts metrics={metrics} loading={loadingDashboard} />
            </div>
            <div className='landing-reveal-soft'>
              <MentionsList mentions={mentions} loading={loadingDashboard} />
            </div>
          </div>

          <aside className='space-y-4 sm:space-y-6'>
            <div className='landing-reveal-soft'>
              <AlertsPanel
                alerts={alerts}
                loading={loadingDashboard}
                onMarkRead={handleMarkAlertRead}
              />
            </div>
            <div className='landing-reveal-soft'>
              <ConnectorHealthPanel health={health} loading={loadingDashboard} />
            </div>
            <div className='landing-reveal-soft'>
              <SourcePolicyPanel />
            </div>
          </aside>
        </section>
      </div>
    </>
  )
}
