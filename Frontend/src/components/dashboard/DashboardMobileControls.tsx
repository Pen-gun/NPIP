import type { Project } from '../../types/app'
import type { ReportScope } from '../../api/reports'
import ProjectList from './ProjectList'

type DashboardMode = 'overview' | 'mentions' | 'analytics' | 'reports' | 'sources'

interface DashboardMobileControlsProps {
  mode: DashboardMode
  projects: Project[]
  activeProjectId: string
  activeProject: Project | null
  loadingProjects: boolean
  actionLoading: string | null
  socketConnected: boolean
  onSelectProject: (projectId: string) => void
  onRunIngestion: () => void
  onDownloadReport: (scope: ReportScope) => void
  onToggleStatus: () => void
  onDeleteProject: (projectId: string) => void
  onCreateProject: () => void
  onNavigate: (path: string) => void
}

const mobileNavItems: Array<{ label: string; path: string; key: DashboardMode }> = [
  { label: 'Overview', path: '/app', key: 'overview' },
  { label: 'Mentions', path: '/app/mentions', key: 'mentions' },
  { label: 'Analytics', path: '/app/analytics', key: 'analytics' },
  { label: 'Reports', path: '/app/reports', key: 'reports' },
]

export default function DashboardMobileControls({
  mode,
  projects,
  activeProjectId,
  activeProject,
  loadingProjects,
  actionLoading,
  socketConnected,
  onSelectProject,
  onRunIngestion,
  onDownloadReport,
  onToggleStatus,
  onDeleteProject,
  onCreateProject,
  onNavigate,
}: DashboardMobileControlsProps) {
  return (
    <div className='mx-auto w-full max-w-[1500px] px-4 pb-2 sm:px-6 lg:hidden'>
      <div className='space-y-4'>
        <ProjectList
          projects={projects}
          activeProjectId={activeProjectId}
          activeProject={activeProject}
          loading={loadingProjects}
          actionLoading={actionLoading}
          socketConnected={socketConnected}
          onSelectProject={onSelectProject}
          onRunIngestion={onRunIngestion}
          onDownloadReport={onDownloadReport}
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

        <div className='grid grid-cols-2 gap-2 rounded-2xl border border-(--border) bg-(--surface-base) p-4 text-xs shadow-sm'>
          {mobileNavItems.map((item) => (
            <button
              key={item.path}
              type='button'
              onClick={() => onNavigate(item.path)}
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
  )
}
