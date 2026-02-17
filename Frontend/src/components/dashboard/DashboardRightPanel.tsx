import type { AlertItem, ConnectorHealth } from '../../types/app'
import AlertsPanel from './AlertsPanel'
import ConnectorHealthPanel from './ConnectorHealthPanel'
import SourcePolicyPanel from './SourcePolicyPanel'

interface DashboardRightPanelProps {
  dateRange: string
  onDateRangeChange: (value: string) => void
  mentionsCount: number
  mentionsBySource: Record<string, number>
  sourceFilters: Record<string, boolean>
  sourceLabels: Record<string, string>
  onSourceFilterToggle: (sourceId: string) => void
  sentimentFilters: Record<string, boolean>
  onSentimentToggle: (key: 'negative' | 'neutral' | 'positive') => void
  alerts: AlertItem[]
  health: ConnectorHealth[]
  loading: boolean
  onMarkAlertRead: (alertId: string) => void
}

export default function DashboardRightPanel({
  dateRange,
  onDateRangeChange,
  mentionsCount,
  mentionsBySource,
  sourceFilters,
  sourceLabels,
  onSourceFilterToggle,
  sentimentFilters,
  onSentimentToggle,
  alerts,
  health,
  loading,
  onMarkAlertRead,
}: DashboardRightPanelProps) {
  return (
    <aside className='space-y-4'>
      <div className='rounded-2xl border border-(--border) bg-(--surface-base) p-4 text-xs shadow-sm'>
        <div className='flex items-center justify-between'>
          <span className='font-semibold'>
            {dateRange === 'last_7_days'
              ? 'Last 7 days'
              : dateRange === 'last_90_days'
                ? 'Last 90 days'
                : 'Last 30 days'}
          </span>
          <button className='rounded-full border border-(--border) px-2 py-1 text-[10px]'>
            {dateRange === 'last_30_days'
              ? 'Last 30 days'
              : dateRange === 'last_7_days'
                ? 'Last 7 days'
                : dateRange === 'last_90_days'
                  ? 'Last 90 days'
                  : 'Custom'}
          </button>
        </div>
        <div className='mt-3 grid gap-2'>
          <label className='text-[11px] text-(--text-muted)'>Date range</label>
          <select
            value={dateRange}
            onChange={(event) => onDateRangeChange(event.target.value)}
            className='rounded-xl border border-(--border) bg-(--surface-muted) px-3 py-2 text-xs font-semibold'
          >
            <option value='last_7_days'>Last 7 days</option>
            <option value='last_30_days'>Last 30 days</option>
            <option value='last_90_days'>Last 90 days</option>
          </select>
        </div>
      </div>

      <div className='rounded-2xl border border-(--border) bg-(--surface-base) p-4 text-xs shadow-sm'>
        <div className='flex items-center justify-between'>
          <span className='font-semibold'>Sources</span>
          <span className='text-(--text-muted)'>Total: {mentionsCount.toLocaleString()}</span>
        </div>
        <div className='mt-3 grid gap-3'>
          {Object.entries(mentionsBySource)
            .sort((a, b) => b[1] - a[1])
            .map(([sourceId, count]) => (
              <label key={sourceId} className='flex items-center justify-between gap-2'>
                <span className='flex items-center gap-2'>
                  <input
                    type='checkbox'
                    checked={!!sourceFilters[sourceId]}
                    onChange={() => onSourceFilterToggle(sourceId)}
                    className='h-4 w-4 rounded border-(--border)'
                  />
                  <span className='font-semibold'>{sourceLabels[sourceId] || sourceId}</span>
                  <span className='text-[11px] text-(--text-muted)'>({count})</span>
                </span>
              </label>
            ))}
          {Object.keys(mentionsBySource).length === 0 && (
            <p className='text-(--text-muted)'>No sources yet</p>
          )}
        </div>
      </div>

      <div className='rounded-2xl border border-(--border) bg-(--surface-base) p-4 text-xs shadow-sm'>
        <span className='font-semibold'>Sentiment</span>
        <div className='mt-3 flex flex-wrap gap-3'>
          {(['negative', 'neutral', 'positive'] as const).map((item) => (
            <label key={item} className='flex items-center gap-2 font-semibold capitalize'>
              <input
                type='checkbox'
                checked={!!sentimentFilters[item]}
                onChange={() => onSentimentToggle(item)}
                className='h-4 w-4 rounded border-(--border)'
              />
              {item}
            </label>
          ))}
        </div>
      </div>

      <div className='space-y-4'>
        <AlertsPanel alerts={alerts} loading={loading} onMarkRead={onMarkAlertRead} />
        <ConnectorHealthPanel health={health} loading={loading} />
        <SourcePolicyPanel />
      </div>
    </aside>
  )
}
