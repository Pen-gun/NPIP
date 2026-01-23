import type { AlertItem } from '../../types/app'

interface AlertsPanelProps {
  alerts: AlertItem[]
  loading: boolean
  onMarkRead: (alertId: string) => void
}

const SKELETON_COUNT = 2
const DATE_FORMAT_OPTIONS: Intl.DateTimeFormatOptions = Object.freeze({
  month: 'short',
  day: 'numeric',
  year: 'numeric',
})

const formatDate = (value?: string | Date | null): string => {
  if (!value) return 'Unknown'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Unknown'
  return date.toLocaleDateString('en-US', DATE_FORMAT_OPTIONS)
}

const createSkeletonElement = (className: string) => (
  <div className={`animate-pulse rounded-full bg-(--surface-muted) ${className}`} />
)

function AlertSkeleton() {
  return (
    <div className='rounded-xl border border-(--border) bg-(--surface-muted) p-3'>
      {createSkeletonElement('h-3 w-20')}
      <div className='mt-2 space-y-2'>
        {createSkeletonElement('h-3 w-3/4')}
        {createSkeletonElement('h-3 w-1/3')}
      </div>
    </div>
  )
}

function AlertCard({ alert, onMarkRead }: { alert: AlertItem; onMarkRead: (id: string) => void }) {
  return (
    <div className='rounded-xl border border-(--border) bg-(--surface-muted) p-3'>
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
            onClick={() => onMarkRead(alert._id)}
          >
            Mark read
          </button>
        )}
      </div>
    </div>
  )
}

export default function AlertsPanel({ alerts, loading, onMarkRead }: AlertsPanelProps) {
  return (
    <div className='rounded-[20px] border border-(--border) bg-(--surface-base) p-4 shadow-(--shadow) sm:rounded-[28px] sm:p-6'>
      <h3 className='text-base font-semibold sm:text-lg'>Alerts</h3>
      <div className='mt-3 max-h-[520px] space-y-2 overflow-y-auto sm:mt-4 sm:space-y-3'>
        {loading &&
          Array.from({ length: SKELETON_COUNT }).map((_, index) => (
            <AlertSkeleton key={`alert-skeleton-${index}`} />
          ))}
        {!loading && alerts.length === 0 && (
          <p className='text-sm text-(--text-muted)'>No alerts yet.</p>
        )}
        {!loading &&
          alerts.map((alert) => (
            <AlertCard key={alert._id} alert={alert} onMarkRead={onMarkRead} />
          ))}
      </div>
    </div>
  )
}
