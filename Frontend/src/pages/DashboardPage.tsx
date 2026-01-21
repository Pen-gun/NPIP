import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { io, Socket } from 'socket.io-client'
import { useNavigate } from 'react-router-dom'
import {
  createProject,
  deleteProject,
  fetchProjectHealth,
  fetchProjectMetrics,
  listProjects,
  runProjectIngestion,
} from '../api/projects'
import { fetchMentions } from '../api/mentions'
import { fetchAlerts, markAlertRead } from '../api/alerts'
import { downloadReport } from '../api/reports'
import { getCurrentUser, logoutUser } from '../api/auth'
import type { AlertItem, ConnectorHealth, Mention, Project, ProjectMetrics, User } from '../types/app'
import {
  DashboardHeader,
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
  const navigate = useNavigate()
  const [user, setUser] = useState<User | null>(null)
  const [projects, setProjects] = useState<Project[]>([])
  const [activeProjectId, setActiveProjectId] = useState<string>('')
  const [metrics, setMetrics] = useState<ProjectMetrics | null>(null)
  const [mentions, setMentions] = useState<Mention[]>([])
  const [alerts, setAlerts] = useState<AlertItem[]>([])
  const [health, setHealth] = useState<ConnectorHealth[]>([])
  const [loadingDashboard, setLoadingDashboard] = useState(false)
  const [loadingProjects, setLoadingProjects] = useState(false)
  const [filters, setFilters] = useState<DashboardFilters>({ ...INITIAL_FILTERS })
  const [projectForm, setProjectForm] = useState<ProjectFormState>({
    ...INITIAL_PROJECT_FORM,
    sources: { ...INITIAL_PROJECT_FORM.sources },
  })

  useEffect(() => {
    getCurrentUser()
      .then(setUser)
      .catch(() => navigate('/login'))
  }, [navigate])

  useEffect(() => {
    if (!user) return
    let cancelled = false
    setLoadingProjects(true)
    listProjects()
      .then((data) => {
        if (cancelled) return
        setProjects(data)
        if (data.length && !activeProjectId) {
          setActiveProjectId(data[0]._id)
        }
      })
      .catch(() => null)
      .finally(() => {
        if (!cancelled) setLoadingProjects(false)
      })
    return () => { cancelled = true }
  }, [user, activeProjectId])

  useEffect(() => {
    if (!user || !activeProjectId) return
    let cancelled = false
    setLoadingDashboard(true)
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
      .finally(() => {
        if (!cancelled) setLoadingDashboard(false)
      })
    return () => { cancelled = true }
  }, [user, activeProjectId, filters])

  useEffect(() => {
    if (!user) return
    const socket: Socket = io(SOCKET_URL || window.location.origin, {
      withCredentials: true,
    })
    socket.emit('join', { userId: user._id, projectId: activeProjectId })
    socket.on('alert', (alert: AlertItem) => {
      setAlerts((prev) => [alert, ...prev].slice(0, ALERTS_LIMIT))
    })
    return () => {
      socket.disconnect()
    }
  }, [user, activeProjectId])

  const activeProject = useMemo(
    () => projects.find((project) => project._id === activeProjectId) || null,
    [projects, activeProjectId],
  )

  const handleLogout = async () => {
    await logoutUser()
    navigate('/login')
  }

  const handleProjectSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!user) return
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
  }

  const handleRunIngestion = async () => {
    if (!activeProjectId) return
    await runProjectIngestion(activeProjectId)
  }

  const handleDownloadReport = async () => {
    if (!activeProjectId) return
    await downloadReport(activeProjectId)
  }

  const handleDeleteProject = async (projectId: string) => {
    await deleteProject(projectId)
    setProjects((prev) => prev.filter((project) => project._id !== projectId))
    if (activeProjectId === projectId) {
      setActiveProjectId('')
    }
  }

  const handleMarkAlertRead = async (alertId: string) => {
    const updated = await markAlertRead(alertId)
    setAlerts((prev) => prev.map((item) => (item._id === updated._id ? updated : item)))
  }

  return (
    <div className='min-h-screen text-(--text-primary)'>
      <div className='flex w-full flex-col gap-6 px-4 py-6 sm:gap-8 sm:px-6 sm:py-8 lg:gap-10 lg:px-10 lg:py-10'>
        <DashboardHeader userName={user?.fullName} onLogout={handleLogout} />

        <section className='grid gap-4 sm:gap-6 lg:grid-cols-[1.1fr_0.9fr]'>
          <ProjectForm
            formState={projectForm}
            onFormChange={setProjectForm}
            onSubmit={handleProjectSubmit}
          />
          <ProjectList
            projects={projects}
            activeProjectId={activeProjectId}
            activeProject={activeProject}
            loading={loadingProjects}
            onSelectProject={setActiveProjectId}
            onRunIngestion={handleRunIngestion}
            onDownloadReport={handleDownloadReport}
            onDeleteProject={handleDeleteProject}
          />
        </section>

        <section className='grid gap-4 sm:gap-6 xl:grid-cols-[2fr_1fr]'>
          <div className='space-y-4 sm:space-y-6'>
            <div className='rounded-[20px] border border-(--border) bg-(--surface-base) p-4 shadow-(--shadow) sm:rounded-[28px] sm:p-6'>
              <DashboardFiltersBar filters={filters} onFiltersChange={setFilters} />
              <MetricsCharts metrics={metrics} loading={loadingDashboard} />
            </div>
            <MentionsList mentions={mentions} loading={loadingDashboard} />
          </div>

          <aside className='space-y-4 sm:space-y-6'>
            <AlertsPanel
              alerts={alerts}
              loading={loadingDashboard}
              onMarkRead={handleMarkAlertRead}
            />
            <ConnectorHealthPanel health={health} loading={loadingDashboard} />
            <SourcePolicyPanel />
          </aside>
        </section>
      </div>
    </div>
  )
}
