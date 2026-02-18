import type { ReportScope } from '../../api/reports'

interface DashboardReportsSectionProps {
  activeProjectId: string
  actionLoading: string | null
  onDownloadReport: (scope: ReportScope) => void
}

const reportItems: Array<{ scope: ReportScope; label: string }> = [
  { scope: 'summary', label: 'Summary Report' },
  { scope: 'all', label: 'Full Report' },
  { scope: 'mentions', label: 'Mentions Export' },
  { scope: 'last_run', label: 'Last Run Report' },
]

export default function DashboardReportsSection({
  activeProjectId,
  actionLoading,
  onDownloadReport,
}: DashboardReportsSectionProps) {
  return (
    <section className='rounded-2xl border border-(--border) bg-(--surface-base) p-4 shadow-sm sm:p-6'>
      <h3 className='text-base font-semibold sm:text-lg'>Reports</h3>
      <p className='mt-2 text-sm text-(--text-muted)'>
        Download report exports for the active project.
      </p>
      <div className='mt-4 grid gap-3 sm:grid-cols-2'>
        {reportItems.map((item) => (
          <button
            key={item.scope}
            type='button'
            onClick={() => onDownloadReport(item.scope)}
            disabled={actionLoading === 'report' || !activeProjectId}
            className='rounded-xl border border-(--border) bg-(--surface-muted) px-4 py-3 text-left text-sm font-semibold text-(--text-primary) hover:border-(--brand-accent) disabled:opacity-60'
          >
            {item.label}
          </button>
        ))}
      </div>
    </section>
  )
}
