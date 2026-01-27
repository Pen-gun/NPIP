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
  reportNavItems: string[]
  analyticsNavItems: string[]
  onSelectProject: (projectId: string) => void
  onRunIngestion: () => void
  onDownloadReport: (scope: 'summary' | 'all' | 'mentions' | 'last_run', format?: 'pdf' | 'excel') => void
  onToggleStatus: () => void
  onDeleteProject: (projectId: string) => void
  onCreateProject: () => void
  onViewChange: (view: DashboardView) => void
}

const REPORT_SCOPE_MAP: Record<string, { scope: 'summary' | 'all'; format: 'pdf' | 'excel' } | null> = {
  'PDF report': { scope: 'summary', format: 'pdf' },
  'Excel report': { scope: 'all', format: 'excel' },
}

const VIEW_ITEMS = ['Mentions', 'Analysis', 'Comparison', 'Influencers & Sources']

export default function DashboardSidebar({
  projects,
  activeProjectId,
  activeProject,
  loadingProjects,
  actionLoading,
  socketConnected,
  pagination,
  currentView,
  reportNavItems,
  analyticsNavItems,
  onSelectProject,
  onRunIngestion,
  onDownloadReport,
  onToggleStatus,
  onDeleteProject,
  onCreateProject,
  onViewChange,
}: DashboardSidebarProps) {
  return (
    <aside className='space-y-4 border-r border-(--sidebar-divider) bg-(--sidebar-bg) px-4 py-6 text-(--sidebar-text) lg:pl-6'>
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
      />

      <button
        onClick={onCreateProject}
        className='flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-(--sidebar-divider) py-3 text-xs font-semibold uppercase tracking-[0.2em] text-(--sidebar-muted) transition-colors hover:border-(--sidebar-active) hover:text-(--sidebar-active)'
      >
        Create new project
      </button>

      <div className='rounded-2xl border border-(--border) bg-(--surface-base) p-4 text-xs shadow-sm'>
        <p className='text-[11px] font-semibold uppercase tracking-[0.2em] text-(--text-muted)'>Mentions</p>
        <div className='mt-3 space-y-2'>
          {VIEW_ITEMS.map((label) => {
            const viewMap: Record<string, DashboardView | null> = {
              Mentions: 'mentions',
              Analysis: 'analysis',
              Comparison: null,
              'Influencers & Sources': null,
            }
            const targetView = viewMap[label]
            const isActive = targetView === currentView
            const isComingSoon = targetView === null

            const handleNavClick = () => {
              if (targetView) onViewChange(targetView)
            }

            return (
              <button
                key={label}
                disabled={isComingSoon}
                onClick={handleNavClick}
                title={isComingSoon ? 'Coming soon' : undefined}
                className={`flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-left font-semibold ${
                  isActive
                    ? 'bg-(--surface-muted) text-(--brand-accent)'
                    : isComingSoon
                      ? 'cursor-not-allowed text-(--text-muted) opacity-50'
                      : 'text-(--text-primary) hover:bg-(--surface-muted)'
                }`}
              >
                <span className='flex items-center gap-2'>
                  {label}
                  {isComingSoon && (
                    <span className='rounded bg-(--surface-muted) px-1.5 py-0.5 text-[9px] font-normal'>Soon</span>
                  )}
                </span>
                {label === 'Mentions' && pagination && (
                  <span className='rounded-full border border-(--border) px-2 py-0.5 text-[10px] text-(--text-muted)'>
                    {pagination.totalCount.toLocaleString()}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        <p className='mt-5 text-[11px] font-semibold uppercase tracking-[0.2em] text-(--text-muted)'>Reports</p>
        <div className='mt-2 space-y-1'>
          {reportNavItems.map((item) => {
            const reportConfig = REPORT_SCOPE_MAP[item] || null
            const isEnabled = Boolean(reportConfig)
            const isComingSoon = !isEnabled

            const handleClick = () => {
              if (!reportConfig) return
              onDownloadReport(reportConfig.scope, reportConfig.format)
            }

            return (
              <button
                key={item}
                disabled={isComingSoon || actionLoading === 'report'}
                title={isComingSoon ? 'Coming soon' : `Download ${item}`}
                onClick={handleClick}
                className={`flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-left font-semibold ${
                  isComingSoon
                    ? 'cursor-not-allowed text-(--text-muted) opacity-50'
                    : actionLoading === 'report'
                      ? 'cursor-wait opacity-70'
                      : 'text-(--text-primary) hover:bg-(--surface-muted)'
                }`}
              >
                <span className='flex items-center gap-2'>
                  {item}
                  {isComingSoon && (
                    <span className='rounded bg-(--surface-muted) px-1.5 py-0.5 text-[9px] font-normal'>Soon</span>
                  )}
                </span>
              </button>
            )
          })}
        </div>

        <p className='mt-5 text-[11px] font-semibold uppercase tracking-[0.2em] text-(--text-muted)'>Advanced analytics</p>
        <div className='mt-2 space-y-1'>
          {analyticsNavItems.map((item) => (
            <button
              key={item}
              disabled
              title='Coming soon'
              className='flex w-full cursor-not-allowed items-center justify-between rounded-lg px-2 py-1.5 text-left font-semibold text-(--text-muted) opacity-50'
            >
              <span className='flex items-center gap-2'>
                {item}
                <span className='rounded bg-(--surface-muted) px-1.5 py-0.5 text-[9px] font-normal'>Soon</span>
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className='rounded-2xl border border-(--sidebar-divider) bg-(--sidebar-panel) p-4 text-xs'>
        <div className='flex items-center gap-2 text-sm font-semibold text-(--sidebar-text)'>
          <span className='h-2 w-2 rounded-full bg-(--sidebar-active)' />
          Upcoming webinar
        </div>
        <p className='mt-2 text-(--sidebar-muted)'>Get a social listening certificate with NPIP.</p>
        <p className='mt-2 text-(--sidebar-muted)'>Date: Wednesday, Jan 28, 2026</p>
        <button
          disabled
          title='Coming soon'
          className='mt-3 inline-flex cursor-not-allowed items-center gap-2 rounded-full border border-(--sidebar-divider) px-3 py-1.5 text-xs font-semibold text-(--sidebar-muted) opacity-60'
        >
          Sign up (Coming soon)
        </button>
      </div>
    </aside>
  )
}
