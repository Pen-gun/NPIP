import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { io, Socket } from 'socket.io-client'
import { Link, useNavigate } from 'react-router-dom'
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
import ChartCard from '../components/ChartCard'
import BrandLogo from '../components/BrandLogo'

const SOURCES = [
  { id: 'localNews', label: 'Local News (RSS)' },
  { id: 'youtube', label: 'YouTube' },
  { id: 'reddit', label: 'Reddit' },
  { id: 'x', label: 'X (Twitter) - paid API' },
  { id: 'meta', label: 'Meta (owned assets)' },
  { id: 'tiktok', label: 'TikTok (experimental)' },
  { id: 'viber', label: 'Viber (bot-only)' },
]

const socketUrl = import.meta.env.VITE_SOCKET_URL || undefined

const formatDate = (value?: string | Date | null) => {
  if (!value) return 'Unknown'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Unknown'
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

const parseKeywords = (value: string) =>
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
  const [filters, setFilters] = useState({
    from: '',
    to: '',
    source: '',
    sentiment: '',
  })
  const [projectForm, setProjectForm] = useState({
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

  useEffect(() => {
    getCurrentUser()
      .then((data) => {
        setUser(data)
      })
      .catch(() => {
        navigate('/login')
      })
  }, [navigate])

  useEffect(() => {
    if (!user) return
    listProjects()
      .then((data) => {
        setProjects(data)
        if (data.length && !activeProjectId) {
          setActiveProjectId(data[0]._id)
        }
      })
      .catch(() => null)
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
    const socket: Socket = io(socketUrl || window.location.origin, {
      withCredentials: true,
    })
    socket.emit('join', { userId: user._id, projectId: activeProjectId })
    socket.on('alert', (alert: AlertItem) => {
      setAlerts((prev) => [alert, ...prev].slice(0, 100))
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
    setProjectForm((prev) => ({ ...prev, name: '', keywords: '', booleanQuery: '' }))
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

  const volumeLabels = metrics?.volume.map((item) => `${item._id.month}/${item._id.day}`) || []
  const volumeData = metrics?.volume.map((item) => item.count) || []
  const sentimentLabels = metrics?.sentimentShare.map((item) => item._id || 'unknown') || []
  const sentimentData = metrics?.sentimentShare.map((item) => item.count) || []
  const sourceLabels = metrics?.topSources.map((item) => item._id) || []
  const sourceData = metrics?.topSources.map((item) => item.count) || []

  return (
    <div className='min-h-screen text-(--text-primary)'>
      <div className='mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 py-10'>
        <header className='flex flex-wrap items-center justify-between gap-6'>
          <BrandLogo />
          <div className='flex items-center gap-4 text-xs font-semibold uppercase tracking-[0.2em] text-(--text-muted)'>
            <span>{user?.fullName}</span>
            <button
              type='button'
              className='rounded-full border border-(--border) px-4 py-2'
              onClick={handleLogout}
            >
              Log out
            </button>
            <Link to='/' className='rounded-full border border-(--border) px-4 py-2'>
              Back to site
            </Link>
          </div>
        </header>

        <section className='grid gap-6 lg:grid-cols-[1.1fr_0.9fr]'>
          <div className='rounded-[28px] border border-(--border) bg-(--surface-base) p-6 shadow-(--shadow)'>
            <h2 className='text-lg font-semibold'>Create project</h2>
            <p className='mt-2 text-sm text-(--text-muted)'>
              Define keywords and sources. Boolean query supports AND/OR/NOT + parentheses.
            </p>
            <form className='mt-4 space-y-3' onSubmit={handleProjectSubmit}>
              <input
                value={projectForm.name}
                onChange={(event) => setProjectForm((prev) => ({ ...prev, name: event.target.value }))}
                placeholder='Project name'
                className='w-full rounded-xl border border-(--border) bg-(--surface-muted) px-4 py-2 text-sm'
                required
              />
              <input
                value={projectForm.keywords}
                onChange={(event) => setProjectForm((prev) => ({ ...prev, keywords: event.target.value }))}
                placeholder='Keywords (comma separated)'
                className='w-full rounded-xl border border-(--border) bg-(--surface-muted) px-4 py-2 text-sm'
              />
              <input
                value={projectForm.booleanQuery}
                onChange={(event) => setProjectForm((prev) => ({ ...prev, booleanQuery: event.target.value }))}
                placeholder='Boolean query (optional)'
                className='w-full rounded-xl border border-(--border) bg-(--surface-muted) px-4 py-2 text-sm'
              />
              <div className='grid gap-3 md:grid-cols-2'>
                <input
                  type='number'
                  min={5}
                  max={60}
                  value={projectForm.scheduleMinutes}
                  onChange={(event) =>
                    setProjectForm((prev) => ({ ...prev, scheduleMinutes: Number(event.target.value) }))
                  }
                  className='w-full rounded-xl border border-(--border) bg-(--surface-muted) px-4 py-2 text-sm'
                />
                <input
                  value={projectForm.geoFocus}
                  onChange={(event) => setProjectForm((prev) => ({ ...prev, geoFocus: event.target.value }))}
                  className='w-full rounded-xl border border-(--border) bg-(--surface-muted) px-4 py-2 text-sm'
                />
              </div>
              <div className='grid gap-2 text-sm text-(--text-muted) md:grid-cols-2'>
                {SOURCES.map((source) => (
                  <label key={source.id} className='flex items-center gap-2'>
                    <input
                      type='checkbox'
                      checked={projectForm.sources[source.id as keyof typeof projectForm.sources]}
                      onChange={(event) =>
                        setProjectForm((prev) => ({
                          ...prev,
                          sources: {
                            ...prev.sources,
                            [source.id]: event.target.checked,
                          },
                        }))
                      }
                    />
                    {source.label}
                  </label>
                ))}
              </div>
              <button
                className='w-full rounded-xl bg-(--brand-primary) px-4 py-2 text-sm font-semibold text-(--text-inverse)'
                type='submit'
              >
                Create project
              </button>
            </form>
          </div>

          <div className='rounded-[28px] border border-(--border) bg-(--surface-base) p-6 shadow-(--shadow)'>
            <h2 className='text-lg font-semibold'>Projects</h2>
            <p className='text-sm text-(--text-muted)'>Select a project to monitor.</p>
            <div className='mt-4 flex flex-wrap gap-2'>
              {projects.map((project) => (
                <button
                  key={project._id}
                  onClick={() => setActiveProjectId(project._id)}
                  className={`rounded-full px-4 py-2 text-xs font-semibold ${
                    activeProjectId === project._id
                      ? 'bg-(--brand-primary) text-(--text-inverse)'
                      : 'border border-(--border)'
                  }`}
                >
                  {project.name}
                </button>
              ))}
            </div>
            {activeProject && (
              <div className='mt-4 flex flex-wrap items-center gap-3 text-sm text-(--text-muted)'>
                <span>Keywords: {activeProject.keywords.join(', ') || 'None'}</span>
                <span>Schedule: {activeProject.scheduleMinutes} min</span>
                <button
                  className='rounded-full border border-(--border) px-3 py-1 text-xs font-semibold'
                  onClick={handleRunIngestion}
                  type='button'
                >
                  Run now
                </button>
                <button
                  className='rounded-full border border-(--border) px-3 py-1 text-xs font-semibold'
                  onClick={handleDownloadReport}
                  type='button'
                >
                  Download PDF
                </button>
                <button
                  className='rounded-full border border-(--border) px-3 py-1 text-xs font-semibold text-(--state-error)'
                  onClick={() => handleDeleteProject(activeProject._id)}
                  type='button'
                >
                  Delete
                </button>
              </div>
            )}
          </div>
        </section>

        <section className='grid gap-6 lg:grid-cols-[2fr_1fr]'>
          <div className='space-y-6'>
            <div className='rounded-[28px] border border-(--border) bg-(--surface-base) p-6 shadow-(--shadow)'>
              <div className='flex flex-wrap items-center justify-between gap-4'>
                <h2 className='text-lg font-semibold'>Dashboard</h2>
                <div className='flex flex-wrap gap-2'>
                  <input
                    type='date'
                    value={filters.from}
                    onChange={(event) => setFilters((prev) => ({ ...prev, from: event.target.value }))}
                    className='rounded-xl border border-(--border) bg-(--surface-muted) px-3 py-1 text-xs'
                  />
                  <input
                    type='date'
                    value={filters.to}
                    onChange={(event) => setFilters((prev) => ({ ...prev, to: event.target.value }))}
                    className='rounded-xl border border-(--border) bg-(--surface-muted) px-3 py-1 text-xs'
                  />
                  <select
                    value={filters.source}
                    onChange={(event) => setFilters((prev) => ({ ...prev, source: event.target.value }))}
                    className='rounded-xl border border-(--border) bg-(--surface-muted) px-3 py-1 text-xs'
                  >
                    <option value=''>All sources</option>
                    <option value='local_news'>Local News</option>
                    <option value='youtube'>YouTube</option>
                    <option value='reddit'>Reddit</option>
                    <option value='x'>X</option>
                  </select>
                  <select
                    value={filters.sentiment}
                    onChange={(event) => setFilters((prev) => ({ ...prev, sentiment: event.target.value }))}
                    className='rounded-xl border border-(--border) bg-(--surface-muted) px-3 py-1 text-xs'
                  >
                    <option value=''>All sentiment</option>
                    <option value='positive'>Positive</option>
                    <option value='neutral'>Neutral</option>
                    <option value='negative'>Negative</option>
                  </select>
                </div>
              </div>

              {loadingDashboard ? (
                <p className='mt-4 text-sm text-(--text-muted)'>Loading dashboard...</p>
              ) : (
                <div className='mt-6 grid gap-4 lg:grid-cols-3'>
                  <ChartCard
                    title='Volume'
                    description='Mentions per day'
                    type='line'
                    labels={volumeLabels}
                    data={volumeData}
                  />
                  <ChartCard
                    title='Sentiment'
                    description='Share of sentiment'
                    type='doughnut'
                    labels={sentimentLabels}
                    data={sentimentData}
                  />
                  <ChartCard
                    title='Sources'
                    description='Top mention sources'
                    type='bar'
                    labels={sourceLabels}
                    data={sourceData}
                  />
                </div>
              )}
            </div>

            <div className='rounded-[28px] border border-(--border) bg-(--surface-base) p-6 shadow-(--shadow)'>
              <h3 className='text-lg font-semibold'>Mentions</h3>
              <div className='mt-4 grid gap-4'>
                {mentions.length === 0 && (
                  <p className='text-sm text-(--text-muted)'>No mentions yet.</p>
                )}
                {mentions.map((mention) => (
                  <article
                    key={mention._id}
                    className='rounded-xl border border-(--border) bg-(--surface-muted) p-4'
                  >
                    <div className='flex items-center justify-between text-xs text-(--text-muted)'>
                      <span>{mention.source}</span>
                      <span>{formatDate(mention.publishedAt)}</span>
                    </div>
                    <h4 className='mt-2 text-sm font-semibold'>{mention.title || mention.text}</h4>
                    {mention.url && (
                      <a
                        href={mention.url}
                        target='_blank'
                        rel='noreferrer'
                        className='mt-2 inline-block text-xs font-semibold text-(--brand-accent)'
                      >
                        View source
                      </a>
                    )}
                    <div className='mt-3 flex flex-wrap gap-2 text-xs text-(--text-muted)'>
                      <span>Sentiment: {mention.sentiment?.label}</span>
                      <span>Reach: {mention.reachEstimate || 0}</span>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </div>

          <aside className='space-y-6'>
            <div className='rounded-[28px] border border-(--border) bg-(--surface-base) p-6 shadow-(--shadow)'>
              <h3 className='text-lg font-semibold'>Alerts</h3>
              <div className='mt-4 space-y-3'>
                {alerts.length === 0 && (
                  <p className='text-sm text-(--text-muted)'>No alerts yet.</p>
                )}
                {alerts.map((alert) => (
                  <div
                    key={alert._id}
                    className='rounded-xl border border-(--border) bg-(--surface-muted) p-3'
                  >
                    <p className='text-xs font-semibold uppercase tracking-[0.2em] text-(--brand-accent)'>
                      {alert.type}
                    </p>
                    <p className='mt-1 text-sm'>{alert.message}</p>
                    <div className='mt-2 flex items-center justify-between text-xs text-(--text-muted)'>
                      <span>{formatDate(alert.createdAt)}</span>
                      {!alert.readAt && (
                        <button
                          className='text-xs font-semibold text-(--brand-accent)'
                          type='button'
                          onClick={() =>
                            markAlertRead(alert._id).then((updated) => {
                              setAlerts((prev) =>
                                prev.map((item) => (item._id === updated._id ? updated : item)),
                              )
                            })
                          }
                        >
                          Mark read
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className='rounded-[28px] border border-(--border) bg-(--surface-base) p-6 shadow-(--shadow)'>
              <h3 className='text-lg font-semibold'>Connector health</h3>
              <div className='mt-4 space-y-2 text-sm text-(--text-muted)'>
                {health.length === 0 && <p>No connector checks yet.</p>}
                {health.map((item) => (
                  <div key={item._id} className='flex items-center justify-between'>
                    <span>{item.connectorId}</span>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        item.status === 'ok'
                          ? 'bg-emerald-100 text-emerald-700'
                          : item.status === 'degraded'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-rose-100 text-rose-700'
                      }`}
                    >
                      {item.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className='rounded-[28px] border border-(--border) bg-(--surface-base) p-6 shadow-(--shadow)'>
              <h3 className='text-lg font-semibold'>Source policy</h3>
              <ul className='mt-3 space-y-2 text-sm text-(--text-muted)'>
                <li>Public sources only. Bots must be authorized for Viber.</li>
                <li>Meta monitoring is limited to owned assets.</li>
                <li>TikTok search is experimental; expect gaps.</li>
              </ul>
            </div>
          </aside>
        </section>
      </div>
    </div>
  )
}
