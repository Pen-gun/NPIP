interface NavTile {
  id: string
  title: string
  description: string
  onClick?: () => void
  disabled?: boolean
  badge?: string
}

interface DashboardQuickNavGridProps {
  tiles: NavTile[]
}

export default function DashboardQuickNavGrid({ tiles }: DashboardQuickNavGridProps) {
  return (
    <section className='grid gap-3 sm:grid-cols-2 xl:grid-cols-4'>
      {tiles.map((tile) => (
        <button
          key={tile.id}
          type='button'
          onClick={tile.onClick}
          disabled={tile.disabled}
          className={`group flex flex-col items-start gap-2 rounded-2xl border border-(--border) bg-(--surface-base) p-4 text-left shadow-sm transition ${
            tile.disabled
              ? 'cursor-not-allowed text-(--text-muted) opacity-60'
              : 'hover:border-(--brand-primary) hover:bg-(--surface-muted)'
          }`}
        >
          <div className='flex w-full items-center justify-between'>
            <h3 className='text-sm font-semibold text-(--text-primary)'>{tile.title}</h3>
            {tile.badge && (
              <span className='rounded-full border border-(--border) px-2 py-0.5 text-[10px] font-semibold text-(--text-muted)'>
                {tile.badge}
              </span>
            )}
          </div>
          <p className='text-xs text-(--text-muted)'>{tile.description}</p>
          <span className='mt-auto text-[10px] font-semibold uppercase tracking-[0.2em] text-(--brand-primary)'>
            {tile.disabled ? 'Coming soon' : 'Open'}
          </span>
        </button>
      ))}
    </section>
  )
}
