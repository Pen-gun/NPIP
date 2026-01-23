import { useEffect, useMemo, useState } from 'react'
import { Download, Pause, Play, Trash2 } from 'lucide-react'
import type { Project } from '../../types/app'

type ReportScope = 'summary' | 'all' | 'mentions' | 'last_run'

interface ProjectListProps {
  projects: Project[]
  activeProjectId: string
  activeProject: Project | null
  loading: boolean
  actionLoading?: string | null
  socketConnected: boolean
  onSelectProject: (projectId: string) => void
  onRunIngestion: () => void
  onDownloadReport: (scope: ReportScope) => void
  onToggleStatus: () => void
  onDeleteProject: (projectId: string) => void
}

const SKELETON_COUNT = 3
const ACTION_BTN_CLASS = 'inline-flex items-center gap-2 rounded-full border border-(--border) px-3 py-1.5 text-xs font-semibold transition hover:bg-(--surface-muted) active:scale-95'

export default function ProjectList({
  projects,
  activeProjectId,
  activeProject,
  loading,
  actionLoading,
  socketConnected,
  onSelectProject,
  onRunIngestion,
  onDownloadReport,
  onToggleStatus,
  onDeleteProject,
}: ProjectListProps) {
  const [now, setNow] = useState(() => Date.now())
  const [reportScope, setReportScope] = useState<ReportScope>('summary')

  const formatCountdown = (diffMs: number) => {
    const totalSeconds = Math.max(0, Math.floor(diffMs / 1000))
    const hours = Math.floor(totalSeconds / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    const seconds = totalSeconds % 60
    if (hours > 0) {
      return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
    }
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
  }

  const scheduleMinutes = useMemo(
    () => (activeProject ? Number(activeProject.scheduleMinutes) : 0),
    [activeProject]
  )

  const lastRunAtMs = useMemo(() => {
    if (!activeProject?.lastRunAt) return null
    const lastRunAt = new Date(activeProject.lastRunAt).getTime()
    return Number.isNaN(lastRunAt) ? null : lastRunAt
  }, [activeProject])

  const timeLeftMs = useMemo(() => {
    if (!scheduleMinutes || !lastRunAtMs) return null
    const nextRunAt = lastRunAtMs + scheduleMinutes * 60 * 1000
    return nextRunAt - now
  }, [scheduleMinutes, lastRunAtMs, now])

  const isPaused = activeProject?.status === 'paused'
  const isOverdue = isPaused && typeof timeLeftMs === 'number' && timeLeftMs <= 0

  useEffect(() => {
    if (isPaused) return
    const interval = window.setInterval(() => {
      setNow(Date.now())
    }, 1000)
    return () => window.clearInterval(interval)
  }, [isPaused])

  const displayTimeLeftMs = timeLeftMs

  const handleToggleStatus = () => {
    if (!activeProject) return
    if (activeProject.status === 'paused') {
      setNow(Date.now())
    }
    onToggleStatus()
  }

  const handleRunNow = () => {
    setNow(Date.now())
    onRunIngestion()
  }

  const nextRunLabel = useMemo(() => {
    if (!activeProject) return ''
    if (!scheduleMinutes) return 'Time left: unknown'
    if (!lastRunAtMs) return isPaused ? 'Time left: paused' : 'Time left: pending'
    if (displayTimeLeftMs !== null && displayTimeLeftMs <= 0) return 'Time left: due now'
    if (displayTimeLeftMs !== null) return `Time left: ${formatCountdown(displayTimeLeftMs)}`
    return 'Time left: unknown'
  }, [activeProject, displayTimeLeftMs, isPaused, lastRunAtMs, scheduleMinutes])

  return (
    <div className='rounded-[20px] border border-(--border) bg-(--surface-base) p-4 shadow-(--shadow) sm:rounded-[28px] sm:p-6'>
      <h2 className='text-base font-semibold sm:text-lg'>Projects</h2>
      <p className='text-xs text-(--text-muted) sm:text-sm'>Select a project to monitor.</p>
      <div className='mt-3 flex flex-wrap gap-2 sm:mt-4'>
        {loading &&
          Array.from({ length: SKELETON_COUNT }).map((_, index) => (
            <div
              key={`project-skeleton-${index}`}
              className='h-8 w-20 rounded-full bg-(--surface-muted) animate-pulse sm:w-24'
            />
          ))}
        {!loading &&
          projects.map((project) => (
            <button
              key={project._id}
              onClick={() => onSelectProject(project._id)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition sm:px-4 sm:py-2 ${
                activeProjectId === project._id
                  ? 'bg-(--brand-primary) text-(--text-inverse)'
                  : 'border border-(--border) hover:bg-(--surface-muted)'
              }`}
            >
              {project.name}
            </button>
          ))}
      </div>
      {activeProject && (
        <div className='mt-3 space-y-2 sm:mt-4 sm:space-y-0'>
          <div className='flex flex-wrap items-center gap-2 text-xs text-(--text-muted) sm:gap-3 sm:text-sm'>
            <span className='w-full sm:w-auto'>Keywords: {activeProject.keywords.join(', ') || 'None'}</span>
            <span>Schedule: {activeProject.scheduleMinutes} min</span>
            <span>{nextRunLabel}</span>
            <span>Timer: {isPaused ? 'paused' : 'running'}</span>
            <span className='uppercase tracking-[0.12em] text-xs'>
              Status: {activeProject.status || 'active'}
            </span>
            <span className={socketConnected ? 'text-(--state-success)' : 'text-(--state-warning)'}>
              Realtime: {socketConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
          <div className='flex flex-wrap gap-2 pt-2'>
            <button
              className={`${ACTION_BTN_CLASS} disabled:cursor-not-allowed disabled:opacity-60`}
              onClick={handleRunNow}
              type='button'
              disabled={!!actionLoading || (isPaused && !isOverdue)}
            >
              <Play className='h-4 w-4' aria-hidden='true' />
              {actionLoading === 'ingestion' ? 'Running...' : 'Run now'}
            </button>
            <button
              className={`${ACTION_BTN_CLASS} disabled:cursor-not-allowed disabled:opacity-60`}
              onClick={handleToggleStatus}
              type='button'
              disabled={!!actionLoading || isOverdue}
            >
              {activeProject.status === 'paused' ? (
                <Play className='h-4 w-4' aria-hidden='true' />
              ) : (
                <Pause className='h-4 w-4' aria-hidden='true' />
              )}
              {actionLoading === 'status'
                ? 'Updating...'
                : activeProject.status === 'paused'
                  ? 'Resume'
                  : 'Pause'}
            </button>
            <label className='sr-only' htmlFor='report-scope'>Report scope</label>
            <select
              id='report-scope'
              className='rounded-full border border-(--border) bg-(--surface-base) px-3 py-1.5 text-xs font-semibold text-(--text-primary) shadow-(--shadow) focus:outline-none focus:ring-2 focus:ring-(--brand-primary)'
              value={reportScope}
              onChange={(event) => setReportScope(event.target.value as ReportScope)}
              disabled={!!actionLoading}
            >
              <option value='summary'>Summary</option>
              <option value='all'>All data</option>
              <option value='mentions'>Mentions list</option>
              <option value='last_run'>Last run only</option>
            </select>
            <button
              className={`${ACTION_BTN_CLASS} disabled:cursor-not-allowed disabled:opacity-60`}
              onClick={() => onDownloadReport(reportScope)}
              type='button'
              disabled={!!actionLoading}
            >
              <Download className='h-4 w-4' aria-hidden='true' />
              {actionLoading === 'report' ? 'Downloading...' : 'Download PDF'}
            </button>
            <button
              className={`${ACTION_BTN_CLASS} text-(--state-error) disabled:cursor-not-allowed disabled:opacity-60`}
              onClick={() => onDeleteProject(activeProject._id)}
              type='button'
              disabled={!!actionLoading}
            >
              <Trash2 className='h-4 w-4' aria-hidden='true' />
              {actionLoading === `delete-${activeProject._id}` ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
