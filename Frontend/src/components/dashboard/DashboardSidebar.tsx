import type { Project } from '../../types/app'
import { Link } from 'react-router-dom'
import ProjectList from './ProjectList'

type DashboardMode = 'overview' | 'mentions' | 'analytics' | 'reports' | 'sources'

interface DashboardSidebarProps {
  projects: Project[]
  activeProjectId: string
  activeProject: Project | null
  loadingProjects: boolean
  actionLoading?: string | null
  socketConnected: boolean
  mode: DashboardMode
  mentionsTotal?: number
  className?: string
  onSelectProject: (projectId: string) => void
  onRunIngestion: () => void
  onDownloadReport: (scope: 'summary' | 'all' | 'mentions' | 'last_run', format?: 'pdf' | 'excel') => void
  onToggleStatus: () => void
  onDeleteProject: (projectId: string) => void
  onCreateProject: () => void
}

const NAV_ITEMS: Array<{ to: string; label: string; mode: DashboardMode }> = [
  { to: '/app', label: 'Overview', mode: 'overview' },
  { to: '/app/mentions', label: 'Mentions', mode: 'mentions' },
  { to: '/app/analytics', label: 'Analytics', mode: 'analytics' },
  { to: '/app/reports', label: 'Reports', mode: 'reports' },
  { to: '/app/sources', label: 'Sources', mode: 'sources' },
]

export default function DashboardSidebar({
  projects,
  activeProjectId,
  activeProject,
  loadingProjects,
  actionLoading,
  socketConnected,
  mode,
  mentionsTotal,
  className,
  onSelectProject,
  onRunIngestion,
  onDownloadReport,
  onToggleStatus,
  onDeleteProject,
  onCreateProject,
}: DashboardSidebarProps) {
  return (
    <aside
      className={`flex flex-col gap-4 bg-(--surface-background) px-4 py-6 text-(--text-primary) lg:sticky lg:top-0 lg:h-screen lg:overflow-y-auto lg:border-r lg:border-(--sidebar-divider) lg:pl-6 ${
        className ?? ''
      }`}
    >
      <button
        onClick={onCreateProject}
        className='order-1 hidden w-full items-center justify-center gap-2 rounded-xl border border-dashed border-(--sidebar-divider) py-3 text-xs font-semibold uppercase tracking-[0.2em] text-(--sidebar-muted) transition-colors hover:border-(--sidebar-active) hover:text-(--sidebar-active) lg:order-3 lg:flex'
      >
        Create new project
      </button>

      <div className='order-2 hidden rounded-2xl border border-(--border) bg-(--surface-base) p-4 text-xs shadow-sm lg:order-4 lg:block'>
        <p className='text-[11px] font-semibold uppercase tracking-[0.2em] text-(--text-muted)'>Navigate</p>
        <div className='mt-3 grid gap-2'>
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={`rounded-lg border px-3 py-2 text-xs font-semibold transition-colors ${
                mode === item.mode
                  ? 'border-(--brand-accent) text-(--brand-accent)'
                  : 'border-(--border) text-(--text-muted) hover:text-(--text-primary)'
              }`}
            >
              <span>{item.label}</span>
              {item.mode === 'mentions' && mentionsTotal !== undefined && (
                <span className='ml-2 text-[10px] text-(--text-muted)'>({mentionsTotal.toLocaleString()})</span>
              )}
            </Link>
          ))}
        </div>
      </div>

      <div className='hidden lg:block'>
        <ProjectList
          projects={projects}
          activeProjectId={activeProjectId}
          activeProject={activeProject}
          loading={loadingProjects}
          actionLoading={actionLoading}
          socketConnected={socketConnected}
          onSelectProject={onSelectProject}
          onRunIngestion={onRunIngestion}
          onDownloadReport={(scope) => onDownloadReport(scope)}
          onToggleStatus={onToggleStatus}
          onDeleteProject={onDeleteProject}
          compact
        />
      </div>
    </aside>
  )
}
