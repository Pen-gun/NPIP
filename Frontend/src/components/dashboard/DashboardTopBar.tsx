import Bell from 'lucide-react/dist/esm/icons/bell'
import HelpCircle from 'lucide-react/dist/esm/icons/help-circle'
import Search from 'lucide-react/dist/esm/icons/search'
import SlidersHorizontal from 'lucide-react/dist/esm/icons/sliders-horizontal'

interface FilterChip {
  id: string
  label: string
}

interface DashboardTopBarProps {
  mentionSearch: string
  onMentionSearchChange: (value: string) => void
  filterChips: FilterChip[]
  onClearFilters: () => void
  onSaveFilters: () => void
}

export default function DashboardTopBar({
  mentionSearch,
  onMentionSearchChange,
  filterChips,
  onClearFilters,
  onSaveFilters,
}: DashboardTopBarProps) {
  return (
    <>
      <div className='bg-(--banner-bg) px-4 py-2 text-center text-xs font-semibold text-white sm:px-6'>
        Trial version with limited data, including X (Twitter) mentions.{' '}
        <button className='ml-2 underline underline-offset-2'>Upgrade</button>
      </div>
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
          <button className='inline-flex items-center gap-2 rounded-full border border-(--border) px-4 py-2 text-xs font-semibold text-(--text-primary)'>
            <SlidersHorizontal className='h-4 w-4' />
            Filters
          </button>
          <div className='ml-auto flex items-center gap-2 text-xs font-semibold'>
            <button className='rounded-full bg-(--brand-accent) px-4 py-2 text-xs font-semibold text-(--text-inverse)'>
              Upgrade
            </button>
            <button className='rounded-full border border-(--border) p-2'>
              <HelpCircle className='h-4 w-4' />
            </button>
            <button className='rounded-full border border-(--border) p-2'>
              <Bell className='h-4 w-4' />
            </button>
          </div>
        </div>
        <div className='mx-auto flex w-full max-w-[1500px] flex-wrap items-center gap-2 px-4 pb-4 text-xs font-semibold text-(--text-muted) sm:px-6'>
          {filterChips.map((chip) => (
            <span
              key={chip.id}
              className='rounded-full border border-(--border) bg-(--surface-muted) px-3 py-1'
            >
              {chip.label}
            </span>
          ))}
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
    </>
  )
}
