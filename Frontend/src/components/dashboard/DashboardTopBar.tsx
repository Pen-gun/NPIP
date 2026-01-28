import HelpCircle from 'lucide-react/dist/esm/icons/help-circle'
import Search from 'lucide-react/dist/esm/icons/search'
import SlidersHorizontal from 'lucide-react/dist/esm/icons/sliders-horizontal'
import { useState } from 'react'

interface DashboardTopBarProps {
  mentionSearch: string
  onMentionSearchChange: (value: string) => void
  appliedFilters: Array<{ id: string; label: string }>
  mentionsBySource: Record<string, number>
  sourceFilters: Record<string, boolean>
  sourceLabels: Record<string, string>
  onSourceFilterToggle: (sourceId: string) => void
  sentimentFilters: Record<string, boolean>
  onSentimentToggle: (key: 'negative' | 'neutral' | 'positive') => void
  onClearFilters: () => void
  onSaveFilters: () => void
}

export default function DashboardTopBar({
  mentionSearch,
  onMentionSearchChange,
  appliedFilters,
  mentionsBySource,
  sourceFilters,
  sourceLabels,
  onSourceFilterToggle,
  sentimentFilters,
  onSentimentToggle,
  onClearFilters,
  onSaveFilters,
}: DashboardTopBarProps) {
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'sources' | 'sentiment'>('sources')

  return (
    <>
      <div className='border-b border-(--topbar-border) bg-(--surface-base)'>
        <div className='mx-auto flex w-full max-w-[1500px] flex-wrap items-center gap-3 px-4 py-4 sm:px-6 lg:flex-nowrap lg:gap-6'>
          <div className='flex min-w-[240px] flex-1 items-center gap-2 rounded-full border border-(--border) bg-(--surface-muted) px-4 py-2 text-sm'>
            <Search className='h-4 w-4 text-(--text-muted)' />
            <input
              value={mentionSearch}
              onChange={(event) => onMentionSearchChange(event.target.value)}
              placeholder='Search mentions, authors, domains...'
              className='w-full bg-transparent text-sm outline-none'
            />
          </div>
          <button
            type='button'
            onClick={() => setFiltersOpen((prev) => !prev)}
            className='inline-flex items-center gap-2 rounded-full border border-(--border) px-4 py-2 text-xs font-semibold text-(--text-primary)'
          >
            <SlidersHorizontal className='h-4 w-4' />
            Filters
          </button>
          <div className='ml-auto flex items-center gap-2 text-xs font-semibold'>
            <button className='rounded-full border border-(--border) p-2'>
              <HelpCircle className='h-4 w-4' />
            </button>
          </div>
        </div>
        <div className='mx-auto w-full max-w-[1500px] px-4 pb-2 text-xs font-semibold text-(--text-muted) sm:px-6'>
          {appliedFilters.length === 0 ? (
            <span>No filters applied</span>
          ) : (
            <div className='flex flex-wrap items-center gap-2'>
              <span className='text-[11px] font-semibold uppercase tracking-[0.2em] text-(--text-muted)'>Active filters</span>
              {appliedFilters.map((filter) => (
                <span
                  key={filter.id}
                  className='rounded-full border border-(--border) bg-(--surface-muted) px-3 py-1 text-(--text-primary)'
                >
                  {filter.label}
                </span>
              ))}
            </div>
          )}
        </div>
        {filtersOpen && (
          <div className='mx-auto w-full max-w-[1500px] px-4 pb-4 sm:px-6'>
            <div className='rounded-2xl border border-(--border) bg-(--surface-base) p-4 text-xs shadow-sm'>
              <div className='flex flex-wrap items-center justify-between gap-3'>
                <div className='flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-(--text-muted)'>
                  <button
                    type='button'
                    onClick={() => setActiveTab('sources')}
                    className={`rounded-full border px-3 py-1 ${
                      activeTab === 'sources'
                        ? 'border-(--brand-accent) text-(--brand-accent)'
                        : 'border-(--border) text-(--text-muted)'
                    }`}
                  >
                    Sources
                  </button>
                  <button
                    type='button'
                    onClick={() => setActiveTab('sentiment')}
                    className={`rounded-full border px-3 py-1 ${
                      activeTab === 'sentiment'
                        ? 'border-(--brand-accent) text-(--brand-accent)'
                        : 'border-(--border) text-(--text-muted)'
                    }`}
                  >
                    Sentiment
                  </button>
                </div>
                <div className='flex items-center gap-3 text-xs font-semibold text-(--text-muted)'>
                  <button
                    onClick={onClearFilters}
                    className='inline-flex items-center gap-1 text-(--brand-primary) hover:underline'
                  >
                    Clear filters
                  </button>
                  <button
                    onClick={onSaveFilters}
                    className='inline-flex items-center gap-1 text-(--brand-primary) hover:underline'
                  >
                    Save filters
                  </button>
                </div>
              </div>

              {activeTab === 'sources' && (
                <div className='mt-4 grid gap-2 text-(--text-primary) sm:grid-cols-2 lg:grid-cols-3'>
                  {Object.entries(mentionsBySource)
                    .sort((a, b) => b[1] - a[1])
                    .map(([sourceId, count]) => (
                      <label key={sourceId} className='flex items-center gap-2 rounded-lg border border-(--border) px-3 py-2'>
                        <input
                          type='checkbox'
                          checked={!!sourceFilters[sourceId]}
                          onChange={() => onSourceFilterToggle(sourceId)}
                          className='h-4 w-4 rounded border-(--border)'
                        />
                        <span className='font-semibold'>{sourceLabels[sourceId] || sourceId}</span>
                        <span className='text-[11px] text-(--text-muted)'>({count})</span>
                      </label>
                    ))}
                  {Object.keys(mentionsBySource).length === 0 && (
                    <p className='text-(--text-muted)'>No sources yet</p>
                  )}
                </div>
              )}

              {activeTab === 'sentiment' && (
                <div className='mt-4 flex flex-wrap gap-3 text-(--text-primary)'>
                  {(['negative', 'neutral', 'positive'] as const).map((item) => (
                    <label key={item} className='flex items-center gap-2 rounded-full border border-(--border) px-3 py-2 font-semibold capitalize'>
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
              )}
            </div>
          </div>
        )}
      </div>
    </>
  )
}
