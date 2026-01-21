import type { ConnectorHealth } from '../../types/app'

interface ConnectorHealthPanelProps {
  health: ConnectorHealth[]
  loading: boolean
}

const SKELETON_COUNT = 3

const createSkeletonElement = (className: string) => (
  <div className={`animate-pulse rounded-full bg-(--surface-muted) ${className}`} />
)

const getHealthStatusStyles = (status: string): string => {
  const styles: Record<string, string> = {
    ok: 'bg-emerald-100 text-emerald-700',
    degraded: 'bg-amber-100 text-amber-700',
  }
  return styles[status] || 'bg-rose-100 text-rose-700'
}

function HealthSkeleton() {
  return (
    <div className='flex items-center justify-between'>
      {createSkeletonElement('h-3 w-20')}
      {createSkeletonElement('h-5 w-16')}
    </div>
  )
}

export default function ConnectorHealthPanel({ health, loading }: ConnectorHealthPanelProps) {
  return (
    <div className='rounded-[28px] border border-(--border) bg-(--surface-base) p-6 shadow-(--shadow)'>
      <h3 className='text-lg font-semibold'>Connector health</h3>
      <div className='mt-4 space-y-2 text-sm text-(--text-muted)'>
        {loading &&
          Array.from({ length: SKELETON_COUNT }).map((_, index) => (
            <HealthSkeleton key={`health-skeleton-${index}`} />
          ))}
        {!loading && health.length === 0 && <p>No connector checks yet.</p>}
        {!loading &&
          health.map((item) => (
            <div key={item._id} className='flex items-center justify-between'>
              <span>{item.connectorId}</span>
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ${getHealthStatusStyles(item.status)}`}
              >
                {item.status}
              </span>
            </div>
          ))}
      </div>
    </div>
  )
}
