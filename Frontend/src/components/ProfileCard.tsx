import type { FigureIdentityResponse } from '../types/figure'

interface ProfileCardProps {
  data: FigureIdentityResponse
  title: string
}

const DEFAULT_INITIALS = 'NP'
const DEFAULT_TITLE = 'Unknown figure'
const DEFAULT_DESCRIPTION = 'No description found.'
const DEFAULT_EXTRACT = 'No verified biography available yet.'

export default function ProfileCard({ data, title }: ProfileCardProps) {
  const initials = title?.slice(0, 2) || DEFAULT_INITIALS
  const displayTitle = title || DEFAULT_TITLE
  const description = data.person?.description || DEFAULT_DESCRIPTION
  const extract = data.person?.extract || DEFAULT_EXTRACT

  return (
    <article className='rounded-2xl border border-(--border) bg-(--surface-base) p-6 shadow-(--shadow)'>
      <div className='flex flex-col gap-4 sm:flex-row sm:items-center'>
        {data.person?.thumbnail ? (
          <img
            src={data.person.thumbnail}
            alt={displayTitle}
            className='h-16 w-16 rounded-2xl object-cover'
          />
        ) : (
          <div className='grid h-16 w-16 place-items-center rounded-2xl bg-(--surface-muted) text-lg font-semibold text-(--brand-primary)'>
            {initials}
          </div>
        )}
        <div>
          <p className='text-xs font-semibold uppercase tracking-[0.24em] text-(--brand-accent)'>
            Identity
          </p>
          <h2 className='mt-1 text-xl font-semibold'>{displayTitle}</h2>
          <p className='mt-1 text-sm text-(--text-muted)'>{description}</p>
        </div>
      </div>
      <p className='mt-4 text-sm leading-relaxed text-(--text-primary)'>{extract}</p>
      {data.person?.wikipediaUrl && (
        <a
          className='mt-4 inline-flex text-sm font-semibold text-(--brand-accent) hover:underline'
          href={data.person.wikipediaUrl}
          target='_blank'
          rel='noreferrer'
        >
          View Wikipedia profile
        </a>
      )}
    </article>
  )
}

