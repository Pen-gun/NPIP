import type { LucideIcon } from 'lucide-react'
import { BarChart3, ChevronLeft, FileText, Image as ImageIcon, Settings, Sparkles, Users } from 'lucide-react'
import type { AdminSection } from '../uiTypes'

const sectionItems: Array<{ id: AdminSection; label: string; icon: LucideIcon }> = [
  { id: 'pages', label: 'Pages', icon: FileText },
  { id: 'media', label: 'Media', icon: ImageIcon },
  { id: 'seo', label: 'SEO', icon: Sparkles },
  { id: 'users', label: 'Users', icon: Users },
  { id: 'settings', label: 'Settings', icon: Settings },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
]


type AdminSidebarProps = {
  activeSection: AdminSection
  onSectionChange: (section: AdminSection) => void
  sidebarOpen: boolean
  onClose: () => void
  brandName?: string
  tagline?: string
}

export default function AdminSidebar({
  activeSection,
  onSectionChange,
  sidebarOpen,
  onClose,
  brandName,
  tagline,
}: AdminSidebarProps) {
  return (
    <aside
      className={`fixed inset-y-0 left-0 z-40 w-72 transform border-r border-(--border) bg-(--surface-base) shadow-lg transition-transform duration-200 lg:translate-x-0 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}
      aria-label='Admin sidebar'
    >
      <div className='flex h-full flex-col'>
        <div className='flex items-center justify-between border-b border-(--divider) px-6 py-5'>
          <div>
            <p className='text-xs font-semibold uppercase tracking-[0.3em] text-(--text-muted)'>Admin CMS</p>
            <h1 className='text-lg font-semibold'>{brandName ? `${brandName} Content Studio` : 'Content Studio'}</h1>
            {tagline && <p className='mt-1 text-xs text-(--text-muted)'>{tagline}</p>}
          </div>
          <button
            type='button'
            onClick={onClose}
            className='rounded-full border border-(--border) p-2 text-(--text-muted) hover:text-(--text-primary) lg:hidden'
            aria-label='Close sidebar'
          >
            <ChevronLeft className='h-4 w-4' aria-hidden />
          </button>
        </div>

        <div className='flex-1 overflow-y-auto px-4 py-6'>
          <div>
            <p className='px-2 text-[11px] font-semibold uppercase tracking-[0.3em] text-(--text-muted)'>
              CMS workspace
            </p>
            <div className='mt-3 space-y-1'>
              {sectionItems.map((item) => {
                const isActive = activeSection === item.id
                return (
                  <button
                    key={item.id}
                    type='button'
                    onClick={() => onSectionChange(item.id)}
                    className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm transition ${
                      isActive
                        ? 'bg-(--brand-accent) text-white shadow-sm'
                        : 'text-(--text-muted) hover:bg-(--surface-muted) hover:text-(--text-primary)'
                    }`}
                  >
                    <item.icon className='h-4 w-4' aria-hidden />
                    <span>{item.label}</span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        <div className='border-t border-(--divider) px-4 py-4 text-xs text-(--text-muted)'>
          <p className='font-semibold uppercase tracking-[0.25em]'>Version</p>
          <p className='mt-2'>CMS build 1.0.0</p>
        </div>
      </div>
    </aside>
  )
}
