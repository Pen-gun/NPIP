import { useState } from 'react'
import { ChevronDown, ChevronUp, FileText } from 'lucide-react'
import type { AdminPageSummary } from '../types'
import { formatDateTime } from '../utils'

type PageListCardProps = {
  pages: AdminPageSummary[]
  activePageId: string | null
  loading: boolean
  onSelectPage: (pageId: string) => void
}

export default function PageListCard({ pages, activePageId, loading, onSelectPage }: PageListCardProps) {
  const [mobileExpanded, setMobileExpanded] = useState(false)
  const activePage = pages.find((p) => p.id === activePageId)

  if (loading) {
    return (
      <div className='space-y-4'>
        {[0, 1, 2].map((item) => (
          <div key={item} className='h-20 animate-pulse rounded-2xl bg-(--surface-muted)' />
        ))}
      </div>
    )
  }

  if (!pages.length) {
    return (
      <div className='rounded-2xl border border-dashed border-(--border) bg-(--surface-base) p-6 text-sm text-(--text-muted)'>
        No pages yet. Add your first page to start editing.
      </div>
    )
  }

  return (
    <div className='rounded-2xl border border-(--border) bg-(--surface-base) shadow-sm lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)] lg:self-start lg:overflow-y-auto'>
      {/* Mobile: Collapsible header */}
      <button
        type='button'
        onClick={() => setMobileExpanded(!mobileExpanded)}
        className='flex w-full items-center justify-between p-4 lg:hidden'
      >
        <div className='flex items-center gap-3'>
          <FileText className='h-4 w-4 text-(--text-muted)' />
          <div className='text-left'>
            <p className='text-xs font-semibold uppercase tracking-wider text-(--text-muted)'>Editing</p>
            <p className='text-sm font-semibold'>{activePage?.title || 'Select a page'}</p>
          </div>
        </div>
        <div className='flex items-center gap-2'>
          <span className='text-xs text-(--text-muted)'>{pages.length} pages</span>
          {mobileExpanded ? (
            <ChevronUp className='h-4 w-4 text-(--text-muted)' />
          ) : (
            <ChevronDown className='h-4 w-4 text-(--text-muted)' />
          )}
        </div>
      </button>

      {/* Desktop: Always visible header */}
      <div className='hidden p-4 lg:block'>
        <div className='flex items-center justify-between'>
          <h3 className='text-sm font-semibold'>Pages</h3>
          <span className='text-xs text-(--text-muted)'>{pages.length} total</span>
        </div>
      </div>

      {/* Page list - collapsible on mobile, always visible on desktop */}
      <div className={`space-y-3 overflow-hidden px-4 pb-4 transition-all duration-200 ${mobileExpanded ? 'max-h-[60vh]' : 'max-h-0 lg:max-h-none'}`}>
        <div className='space-y-3 overflow-y-auto lg:max-h-[calc(100vh-12rem)]'>
          {pages.map((page) => {
            const isActive = page.id === activePageId
            return (
              <button
                key={page.id}
                type='button'
                onClick={() => {
                  onSelectPage(page.id)
                  setMobileExpanded(false)
                }}
                className={`w-full rounded-xl border px-4 py-3 text-left transition ${
                  isActive
                    ? 'border-(--brand-accent) bg-(--surface-muted) text-(--text-primary)'
                    : 'border-(--border) hover:border-(--brand-accent)/50'
                }`}
              >
                <div className='flex items-center justify-between gap-3'>
                  <div>
                    <p className='text-sm font-semibold'>{page.title}</p>
                    <p className='text-xs text-(--text-muted)'>/{page.slug}</p>
                  </div>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.2em] ${
                      page.status === 'published' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                    }`}
                  >
                    {page.status}
                  </span>
                </div>
                <p className='mt-2 text-[11px] text-(--text-muted)'>Updated {formatDateTime(page.updatedAt)}</p>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
