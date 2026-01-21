import type { Mention } from '../../types/app'

interface MentionsListProps {
  mentions: Mention[]
  loading: boolean
}

const SKELETON_COUNT = 4
const DATE_FORMAT_OPTIONS: Intl.DateTimeFormatOptions = Object.freeze({
  month: 'short',
  day: 'numeric',
  year: 'numeric',
})

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
  const content = (
    <>
      <div className='flex items-center justify-between text-xs text-(--text-muted)'>
        <span>{mention.source}</span>
        <span>{formatDate(mention.publishedAt)}</span>
      </div>
      <h4 className='mt-2 text-sm font-semibold'>{mention.title || mention.text}</h4>
      <div className='mt-2 text-xs font-semibold text-(--brand-accent)'>
        {mention.url ? 'Open source' : 'No source link'}
      </div>
      <div className='mt-3 flex flex-wrap gap-2 text-xs text-(--text-muted)'>
        <span>Sentiment: {mention.sentiment?.label}</span>
        <span>Reach: {mention.reachEstimate || 0}</span>
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

export default function MentionsList({ mentions, loading }: MentionsListProps) {
  return (
    <div className='rounded-[20px] border border-(--border) bg-(--surface-base) p-4 shadow-(--shadow) sm:rounded-[28px] sm:p-6'>
      <h3 className='text-base font-semibold sm:text-lg'>Mentions</h3>
      <div className='mt-3 grid max-h-96 gap-3 overflow-y-auto pr-1 sm:mt-4 sm:max-h-130 sm:gap-4 sm:pr-2'>
        {loading &&
          Array.from({ length: SKELETON_COUNT }).map((_, index) => (
            <MentionSkeleton key={`mention-skeleton-${index}`} />
          ))}
        {!loading && mentions.length === 0 && (
          <p className='text-sm text-(--text-muted)'>No mentions yet.</p>
        )}
        {!loading && mentions.map((mention) => <MentionCard key={mention._id} mention={mention} />)}
      </div>
    </div>
  )
}
