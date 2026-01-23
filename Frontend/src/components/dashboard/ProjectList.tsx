import { useEffect, useMemo, useState } from 'react'
import type { Project } from '../../types/app'

interface ProjectListProps {
  projects: Project[]
  activeProjectId: string
  activeProject: Project | null
  loading: boolean
  actionLoading?: string | null
  socketConnected: boolean
  onSelectProject: (projectId: string) => void
  onRunIngestion: () => void
  onDownloadReport: () => void
  onToggleStatus: () => void
  onDeleteProject: (projectId: string) => void
}

const SKELETON_COUNT = 3
const ACTION_BTN_CLASS = 'rounded-full border border-(--border) px-3 py-1.5 text-xs font-semibold transition hover:bg-(--surface-muted) active:scale-95'

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

  useEffect(() => {
    const interval = window.setInterval(() => {
      setNow(Date.now())
    }, 1000)
    return () => window.clearInterval(interval)
  }, [])

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

  const nextRunLabel = useMemo(() => {
    if (!activeProject) return ''
    if (activeProject.status === 'paused') return 'Time left: paused'
    const scheduleMinutes = Number(activeProject.scheduleMinutes)
    if (!scheduleMinutes) return 'Time left: unknown'
    if (!activeProject.lastRunAt) return 'Time left: pending'
    const lastRunAt = new Date(activeProject.lastRunAt).getTime()
    if (Number.isNaN(lastRunAt)) return 'Time left: unknown'
    const nextRunAt = lastRunAt + scheduleMinutes * 60 * 1000
    const diffMs = nextRunAt - now
    if (diffMs <= 0) return 'Time left: due now'
    return `Time left: ${formatCountdown(diffMs)}`
  }, [activeProject, now])

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
              onClick={onRunIngestion}
              type='button'
              disabled={!!actionLoading || activeProject.status === 'paused'}
            >
              {actionLoading === 'ingestion' ? 'Running...' : 'Run now'}
            </button>
            <button
              className={`${ACTION_BTN_CLASS} disabled:cursor-not-allowed disabled:opacity-60`}
              onClick={onToggleStatus}
              type='button'
              disabled={!!actionLoading}
            >
              {actionLoading === 'status'
                ? 'Updating...'
                : activeProject.status === 'paused'
                  ? 'Resume'
                  : 'Pause'}
            </button>
            <button
              className={`${ACTION_BTN_CLASS} disabled:cursor-not-allowed disabled:opacity-60`}
              onClick={onDownloadReport}
              type='button'
              disabled={!!actionLoading}
            >
              {actionLoading === 'report' ? 'Downloading...' : 'Download PDF'}
            </button>
            <button
              className={`${ACTION_BTN_CLASS} text-(--state-error) disabled:cursor-not-allowed disabled:opacity-60`}
              onClick={() => onDeleteProject(activeProject._id)}
              type='button'
              disabled={!!actionLoading}
            >
              {actionLoading === `delete-${activeProject._id}` ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
