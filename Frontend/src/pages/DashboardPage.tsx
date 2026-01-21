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
    setLoadingProjects(true)
    listProjects()
      .then((data) => {
        setProjects(data)
        if (data.length && !activeProjectId) {
          setActiveProjectId(data[0]._id)
        }
      })
      .catch(() => null)
      .finally(() => setLoadingProjects(false))
  }, [user, activeProjectId])

  useEffect(() => {
    if (!user || !activeProjectId) return
    setLoadingDashboard(true)
    Promise.all([
      fetchProjectMetrics(activeProjectId, filters.from, filters.to),
      fetchMentions(activeProjectId, filters),
      fetchAlerts(),
      fetchProjectHealth(activeProjectId),
    ])
      .then(([metricData, mentionData, alertData, healthData]) => {
        setMetrics(metricData)
        setMentions(mentionData)
        setAlerts(alertData)
        setHealth(healthData)
      })
      .finally(() => setLoadingDashboard(false))
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
      <div className='mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 py-10'>
        <DashboardHeader userName={user?.fullName} onLogout={handleLogout} />

        <section className='grid gap-6 lg:grid-cols-[1.1fr_0.9fr]'>
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

        <section className='grid gap-6 lg:grid-cols-[2fr_1fr]'>
          <div className='space-y-6'>
            <div className='rounded-[28px] border border-(--border) bg-(--surface-base) p-6 shadow-(--shadow)'>
              <DashboardFiltersBar filters={filters} onFiltersChange={setFilters} />
              <MetricsCharts metrics={metrics} loading={loadingDashboard} />
            </div>
            <MentionsList mentions={mentions} loading={loadingDashboard} />
          </div>

          <aside className='space-y-6'>
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
