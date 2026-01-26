import { BellOff, CheckSquare, ChevronLeft, ChevronRight, ExternalLink, FileText, MoreHorizontal, Tag, Trash2 } from 'lucide-react'
import type { Mention } from '../../types/app'
import type { PaginationInfo } from '../../api/mentions'

interface MentionsListProps {
  mentions: Mention[]
  loading: boolean
  pagination?: PaginationInfo
  sortOrder: 'recent' | 'oldest' | 'reach'
  onSortChange: (sort: 'recent' | 'oldest' | 'reach') => void
  onPageChange: (page: number) => void
}

const SKELETON_COUNT = 4
const DATE_FORMAT_OPTIONS: Intl.DateTimeFormatOptions = Object.freeze({
  month: 'short',
  day: 'numeric',
  year: 'numeric',
})

// Format star ratings for display
const SENTIMENT_LABELS: Record<string, string> = {
  '1 star': 'Very Negative',
  '2 stars': 'Negative',
  '3 stars': 'Neutral',
  '4 stars': 'Positive',
  '5 stars': 'Very Positive',
  positive: 'Positive',
  neutral: 'Neutral',
  negative: 'Negative',
}

const formatSentimentLabel = (label?: string): string =>
  SENTIMENT_LABELS[label?.toLowerCase() ?? ''] || SENTIMENT_LABELS[label ?? ''] || label || 'Unknown'

const formatDate = (value?: string | Date | null): string => {
  if (!value) return 'Unknown'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Unknown'
  return date.toLocaleDateString('en-US', DATE_FORMAT_OPTIONS)
}

const createSkeletonElement = (className: string) => (
  <div className={`animate-pulse rounded-full bg-(--surface-muted) ${className}`} />
)

function MentionCard({ mention }: { mention: Mention }) {
  const title = mention.title || mention.text || 'Untitled mention'
  const snippet = mention.text && mention.text !== mention.title ? mention.text : ''

  const content = (
    <>
      <div className='flex items-center justify-between text-xs text-(--text-muted)'>
        <span className='inline-flex items-center gap-2 font-semibold text-(--text-primary)'>
          <span className='grid h-8 w-8 place-items-center rounded-full bg-(--surface-base) text-xs font-semibold uppercase'>
            {mention.source?.slice(0, 1) || 'M'}
          </span>
          {mention.source || 'Unknown source'}
        </span>
        <span>{formatDate(mention.publishedAt)}</span>
      </div>
      <h4 className='mt-2 text-sm font-semibold'>{title}</h4>
      {snippet && <p className='mt-1 text-xs text-(--text-muted)'>{snippet}</p>}
      <div className='mt-3 flex flex-wrap gap-3 text-xs text-(--text-muted)'>
        <span className='rounded-full border border-(--border) px-2 py-0.5'>Sentiment: {formatSentimentLabel(mention.sentiment?.label)}</span>
        <span className='rounded-full border border-(--border) px-2 py-0.5'>Reach: {mention.reachEstimate || 0}</span>
        <span className='rounded-full border border-(--border) px-2 py-0.5'>Influence score: 9/10</span>
      </div>
      <div className='mt-3 flex flex-wrap items-center gap-2 text-xs font-semibold text-(--text-muted)'>
        <button className='inline-flex items-center gap-1 rounded-full border border-(--border) px-2 py-1 hover:bg-(--surface-base)'>
          <ExternalLink className='h-3.5 w-3.5' />
          Visit
        </button>
        <button className='inline-flex items-center gap-1 rounded-full border border-(--border) px-2 py-1 hover:bg-(--surface-base)'>
          <Tag className='h-3.5 w-3.5' />
          Tags
        </button>
        <button className='inline-flex items-center gap-1 rounded-full border border-(--border) px-2 py-1 hover:bg-(--surface-base)'>
          <Trash2 className='h-3.5 w-3.5' />
          Delete
        </button>
        <button className='inline-flex items-center gap-1 rounded-full border border-(--border) px-2 py-1 hover:bg-(--surface-base)'>
          <FileText className='h-3.5 w-3.5' />
          Add to PDF report
        </button>
        <button className='inline-flex items-center gap-1 rounded-full border border-(--border) px-2 py-1 hover:bg-(--surface-base)'>
          <BellOff className='h-3.5 w-3.5' />
          Mute source
        </button>
        <button className='inline-flex items-center gap-1 rounded-full border border-(--border) px-2 py-1 hover:bg-(--surface-base)'>
          <MoreHorizontal className='h-3.5 w-3.5' />
          More actions
        </button>
        <button className='ml-auto inline-flex items-center gap-1 rounded-full border border-(--border) px-2 py-1 hover:bg-(--surface-base)'>
          <CheckSquare className='h-3.5 w-3.5' />
        </button>
      </div>
    </>
  )

  if (mention.url) {
    return (
      <a
        href={mention.url}
        target='_blank'
        rel='noreferrer'
        className='rounded-xl border border-(--border) bg-(--surface-muted) p-4 transition hover:-translate-y-px hover:shadow-[0_12px_24px_rgba(15,23,42,0.08)]'
      >
        {content}
      </a>
    )
  }

  return (
    <article className='rounded-xl border border-(--border) bg-(--surface-muted) p-4'>
      {content}
    </article>
  )
}

function MentionSkeleton() {
  return (
    <div className='rounded-xl border border-(--border) bg-(--surface-muted) p-4'>
      <div className='flex items-center justify-between'>
        {createSkeletonElement('h-3 w-16')}
        {createSkeletonElement('h-3 w-20')}
      </div>
      <div className='mt-3 space-y-2'>
        {createSkeletonElement('h-4 w-3/4')}
        {createSkeletonElement('h-3 w-1/2')}
      </div>
    </div>
  )
}

export default function MentionsList({ mentions, loading, pagination, sortOrder, onSortChange, onPageChange }: MentionsListProps) {
  // Generate page numbers to display
  const getPageNumbers = () => {
    if (!pagination) return []
    const { page, totalPages } = pagination
    const pages: (number | 'ellipsis')[] = []
    
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i)
    } else {
      pages.push(1)
      if (page > 3) pages.push('ellipsis')
      for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) {
        pages.push(i)
      }
      if (page < totalPages - 2) pages.push('ellipsis')
      pages.push(totalPages)
    }
    return pages
  }

  return (
    <div className='rounded-[20px] border border-(--border) bg-(--surface-base) p-4 shadow-(--shadow) sm:rounded-[28px] sm:p-6'>
      <div className='flex flex-wrap items-center justify-between gap-3'>
        <h3 className='text-base font-semibold sm:text-lg'>
          Mentions {pagination && <span className='text-sm font-normal text-(--text-muted)'>({pagination.totalCount.toLocaleString()} total)</span>}
        </h3>
        <div className='flex items-center gap-2 text-xs font-semibold'>
          <label className='text-(--text-muted)'>Sort</label>
          <select
            value={sortOrder}
            onChange={(event) => onSortChange(event.target.value as 'recent' | 'oldest' | 'reach')}
            className='rounded-full border border-(--border) bg-(--surface-muted) px-3 py-1'
          >
            <option value='recent'>Recent first</option>
            <option value='oldest'>Oldest first</option>
            <option value='reach'>Highest reach</option>
          </select>
        </div>
      </div>
      <div className='mt-3 grid max-h-[500px] gap-3 overflow-y-auto pr-1 sm:mt-4 sm:max-h-[700px] sm:gap-4 sm:pr-2'>
        {loading &&
          Array.from({ length: SKELETON_COUNT }).map((_, index) => (
            <MentionSkeleton key={`mention-skeleton-${index}`} />
          ))}
        {!loading && mentions.length === 0 && (
          <p className='text-sm text-(--text-muted)'>No mentions yet.</p>
        )}
        {!loading && mentions.map((mention) => <MentionCard key={mention._id} mention={mention} />)}
      </div>
      <div className='mt-4 flex flex-wrap items-center justify-between gap-2 text-xs font-semibold text-(--text-muted)'>
        <span>
          {pagination 
            ? `Showing ${((pagination.page - 1) * pagination.limit) + 1}-${Math.min(pagination.page * pagination.limit, pagination.totalCount)} of ${pagination.totalCount.toLocaleString()}`
            : `Showing ${mentions.length} mentions`
          }
        </span>
        {pagination && pagination.totalPages > 1 && (
          <div className='flex items-center gap-1'>
            <button
              onClick={() => onPageChange(pagination.page - 1)}
              disabled={!pagination.hasPrevPage}
              className='flex h-7 w-7 items-center justify-center rounded-full border border-(--border) disabled:cursor-not-allowed disabled:opacity-40'
              aria-label='Previous page'
            >
              <ChevronLeft className='h-4 w-4' />
            </button>
            {getPageNumbers().map((pageNum, idx) => 
              pageNum === 'ellipsis' ? (
                <span key={`ellipsis-${idx}`} className='px-1'>…</span>
              ) : (
                <button
                  key={pageNum}
                  onClick={() => onPageChange(pageNum)}
                  className={`h-7 w-7 rounded-full border ${
                    pageNum === pagination.page 
                      ? 'border-(--brand-accent) bg-(--brand-accent) text-white' 
                      : 'border-(--border) hover:bg-(--surface-muted)'
                  }`}
                >
                  {pageNum}
                </button>
              )
            )}
            <button
              onClick={() => onPageChange(pagination.page + 1)}
              disabled={!pagination.hasNextPage}
              className='flex h-7 w-7 items-center justify-center rounded-full border border-(--border) disabled:cursor-not-allowed disabled:opacity-40'
              aria-label='Next page'
            >
              <ChevronRight className='h-4 w-4' />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
