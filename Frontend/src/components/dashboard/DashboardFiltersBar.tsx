interface DashboardFilters {
  from: string
  to: string
  source: string
  sentiment: string
}

interface DashboardFiltersBarProps {
  filters: DashboardFilters
  onFiltersChange: (updater: (prev: DashboardFilters) => DashboardFilters) => void
}

const SOURCE_FILTER_OPTIONS = Object.freeze([
  { value: '', label: 'All sources' },
  { value: 'local_news', label: 'Local News' },
  { value: 'youtube', label: 'YouTube' },
  { value: 'reddit', label: 'Reddit' },
  { value: 'x', label: 'X' },
])

// Values match BERT model output stored in DB (lowercase)
const SENTIMENT_FILTER_OPTIONS = Object.freeze([
  { value: '', label: 'All ratings' },
  { value: '5 stars', label: 'Very Positive' },
  { value: '4 stars', label: 'Positive' },
  { value: '3 stars', label: 'Neutral' },
  { value: '2 stars', label: 'Negative' },
  { value: '1 star', label: 'Very Negative' },
])

const INPUT_CLASS = 'rounded-xl border border-(--border) bg-(--surface-muted) px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-(--brand-primary)/20'

export default function DashboardFiltersBar({ filters, onFiltersChange }: DashboardFiltersBarProps) {
  return (
    <div className='flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between'>
      <h2 className='text-lg font-semibold'>Dashboard</h2>
      <div className='flex flex-wrap items-center gap-2'>
        <div className='flex items-center gap-2'>
          <label className='text-xs text-(--text-muted)'>From</label>
          <input
            type='date'
            value={filters.from}
            onChange={(event) => onFiltersChange((prev) => ({ ...prev, from: event.target.value }))}
            className={INPUT_CLASS}
          />
        </div>
        <div className='flex items-center gap-2'>
          <label className='text-xs text-(--text-muted)'>To</label>
          <input
            type='date'
            value={filters.to}
            onChange={(event) => onFiltersChange((prev) => ({ ...prev, to: event.target.value }))}
            className={INPUT_CLASS}
          />
        </div>
        <select
          value={filters.source}
          onChange={(event) => onFiltersChange((prev) => ({ ...prev, source: event.target.value }))}
          className={INPUT_CLASS}
        >
          {SOURCE_FILTER_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <select
          value={filters.sentiment}
          onChange={(event) => onFiltersChange((prev) => ({ ...prev, sentiment: event.target.value }))}
          className={INPUT_CLASS}
        >
          {SENTIMENT_FILTER_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}

export type { DashboardFilters }
