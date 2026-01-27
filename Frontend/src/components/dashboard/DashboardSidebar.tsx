import type { PaginationInfo } from '../../api/mentions'
import type { Project } from '../../types/app'
import BrandLogo from '../BrandLogo'
import ProjectList from './ProjectList'

type DashboardView = 'mentions' | 'analysis'

interface DashboardSidebarProps {
  projects: Project[]
  activeProjectId: string
  activeProject: Project | null
  loadingProjects: boolean
  actionLoading?: string | null
  socketConnected: boolean
  pagination: PaginationInfo | null
  currentView: DashboardView
  onSelectProject: (projectId: string) => void
  onRunIngestion: () => void
  onDownloadReport: (scope: 'summary' | 'all' | 'mentions' | 'last_run', format?: 'pdf' | 'excel') => void
  onToggleStatus: () => void
  onDeleteProject: (projectId: string) => void
  onCreateProject: () => void
  onViewChange: (view: DashboardView) => void
}

const VIEW_OPTIONS: Array<{ label: string; value: DashboardView }> = [
  { label: 'News (Mentions)', value: 'mentions' },
  { label: 'Analysis', value: 'analysis' },
]

export default function DashboardSidebar({
  projects,
  activeProjectId,
  activeProject,
  loadingProjects,
  actionLoading,
  socketConnected,
  pagination,
  currentView,
  onSelectProject,
  onRunIngestion,
  onDownloadReport,
  onToggleStatus,
  onDeleteProject,
  onCreateProject,
  onViewChange,
}: DashboardSidebarProps) {
  return (
    <aside className='space-y-4 border-r border-(--sidebar-divider) bg-(--surface-background) px-4 py-6 text-(--text-primary) lg:sticky lg:top-0 lg:h-screen lg:overflow-y-auto lg:pl-6'>
      <div className='pb-2'>
        <BrandLogo />
      </div>

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

      <button
        onClick={onCreateProject}
        className='flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-(--sidebar-divider) py-3 text-xs font-semibold uppercase tracking-[0.2em] text-(--sidebar-muted) transition-colors hover:border-(--sidebar-active) hover:text-(--sidebar-active)'
      >
        Create new project
      </button>

      <div className='rounded-2xl border border-(--border) bg-(--surface-base) p-4 text-xs shadow-sm'>
        <div className='flex items-center justify-between'>
          <p className='text-[11px] font-semibold uppercase tracking-[0.2em] text-(--text-muted)'>View</p>
          {pagination && currentView === 'mentions' && (
            <span className='rounded-full border border-(--border) px-2 py-0.5 text-[10px] text-(--text-muted)'>
              {pagination.totalCount.toLocaleString()}
            </span>
          )}
        </div>
        <select
          value={currentView}
          onChange={(event) => onViewChange(event.target.value as DashboardView)}
          className='mt-3 w-full rounded-xl border border-(--border) bg-(--surface-muted) px-3 py-2 text-xs font-semibold text-(--text-primary)'
        >
          {VIEW_OPTIONS.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>
      </div>
    </aside>
  )
}
