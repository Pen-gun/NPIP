import { Bell, ChevronDown, LogOut, Menu, Search } from 'lucide-react'

type AdminTopbarProps = {
  userName: string
  searchTerm: string
  onSearchChange: (value: string) => void
  onToggleSidebar: () => void
  onPreview: () => void
  onLogout: () => void
  brandName?: string
}

export default function AdminTopbar({
  userName,
  searchTerm,
  onSearchChange,
  onToggleSidebar,
  onPreview,
  onLogout,
  brandName,
}: AdminTopbarProps) {
  return (
    <header className='sticky top-0 z-30 border-b border-(--divider) bg-(--surface-base)/90 px-4 py-4 backdrop-blur sm:px-6 lg:px-8'>
      <div className='flex flex-wrap items-center justify-between gap-4'>
        <div className='flex items-center gap-3'>
          <button
            type='button'
            onClick={onToggleSidebar}
            className='rounded-full border border-(--border) p-2 text-(--text-muted) hover:text-(--text-primary) lg:hidden'
            aria-label='Open sidebar'
          >
            <Menu className='h-4 w-4' aria-hidden />
          </button>
          <div>
            <p className='text-xs font-semibold uppercase tracking-[0.3em] text-(--text-muted)'>Content Studio</p>
            <h2 className='text-lg font-semibold'>{brandName ? `${brandName} Admin CMS` : 'Admin CMS'}</h2>
          </div>
        </div>

        <div className='flex flex-1 items-center gap-3 md:justify-center'>
          <div className='relative w-full max-w-md'>
            <Search className='pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-(--text-muted)' />
            <input
              value={searchTerm}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder='Search pages, blocks, keywords...'
              className='w-full rounded-full border border-(--border) bg-(--surface-muted) py-2 pl-9 pr-3 text-sm text-(--text-primary) placeholder:text-(--text-muted) focus:border-(--brand-accent) focus:outline-none'
            />
          </div>
        </div>

        <div className='flex items-center gap-3'>
          <button
            type='button'
            onClick={onPreview}
            className='hidden rounded-full bg-(--brand-accent) px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-white shadow-sm transition hover:opacity-90 sm:inline-flex'
          >
            Preview site
          </button>

          <button
            type='button'
            className='relative rounded-full border border-(--border) p-2 text-(--text-muted) hover:text-(--text-primary)'
            aria-label='Notifications'
          >
            <Bell className='h-4 w-4' aria-hidden />
            <span className='absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-(--brand-accent) text-[10px] font-semibold text-white'>
              3
            </span>
          </button>

          <div className='flex items-center gap-2 rounded-full border border-(--border) bg-(--surface-muted) px-3 py-2 text-xs font-semibold text-(--text-muted)'>
            <span>{userName}</span>
            <ChevronDown className='h-3 w-3' aria-hidden />
          </div>

          <button
            type='button'
            onClick={onLogout}
            className='hidden rounded-full border border-(--border) px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-(--text-muted) transition hover:text-(--text-primary) md:inline-flex'
          >
            <LogOut className='h-3.5 w-3.5' aria-hidden />
            <span className='ml-2'>Sign out</span>
          </button>
        </div>
      </div>
    </header>
  )
}
