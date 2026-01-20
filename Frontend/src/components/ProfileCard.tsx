import type { FigureIdentityResponse } from '../types/figure'

type ProfileCardProps = {
  data: FigureIdentityResponse
  title: string
}

export default function ProfileCard({ data, title }: ProfileCardProps) {
  return (
    <article className='rounded-2xl border border-(--border) bg-(--surface-base) p-6 shadow-(--shadow)'>
      <div className='flex flex-col gap-4 sm:flex-row sm:items-center'>
        {data.person?.thumbnail ? (
          <img
            src={data.person.thumbnail}
            alt={title}
            className='h-16 w-16 rounded-2xl object-cover'
          />
        ) : (
          <div className='grid h-16 w-16 place-items-center rounded-2xl bg-(--surface-muted) text-lg font-semibold text-(--brand-primary)'>
            {title?.slice(0, 2) || 'NP'}
          </div>
        )}
        <div>
          <p className='text-xs font-semibold uppercase tracking-[0.24em] text-(--brand-accent)'>
            Identity
          </p>
          <h2 className='mt-1 text-xl font-semibold'>{title || 'Unknown figure'}</h2>
          <p className='mt-1 text-sm text-(--text-muted)'>
            {data.person?.description || 'No description found.'}
          </p>
        </div>
      </div>
      <p className='mt-4 text-sm leading-relaxed text-(--text-primary)'>
        {data.person?.extract || 'No verified biography available yet.'}
      </p>
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

