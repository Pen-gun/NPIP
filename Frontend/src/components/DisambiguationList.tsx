import type { FigureIdentityResponse } from '../types/figure'

type DisambiguationListProps = {
  data: FigureIdentityResponse
  onSelect: (value: string) => void
}

export default function DisambiguationList({ data, onSelect }: DisambiguationListProps) {
  return (
    <div className='rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface-base)] p-6 shadow-[var(--shadow)]'>
      <div className='flex items-center justify-between'>
        <h3 className='text-lg font-semibold'>Choose the right person</h3>
        <span className='rounded-full border border-[color:var(--border)] bg-[color:var(--surface-muted)] px-3 py-1 text-xs font-semibold'>
          Disambiguation
        </span>
      </div>
      <p className='mt-2 text-sm text-[color:var(--text-muted)]'>
        "{data.query}" matches multiple entries. Pick the right profile to continue.
      </p>
      {data.candidates.length === 0 ? (
        <p className='mt-3 text-sm text-[color:var(--text-muted)]'>
          No candidates found. Try a more specific query.
        </p>
      ) : (
        <div className='mt-4 grid gap-3'>
          {data.candidates.slice(0, 6).map((candidate) => (
            <button
              key={candidate.wikipediaUrl || candidate.title}
              type='button'
              className='rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-muted)] p-4 text-left transition hover:-translate-y-0.5 hover:border-[color:var(--brand-accent)] hover:shadow-md'
              onClick={() => onSelect(candidate.title)}
            >
              <div>
                <p className='text-sm font-semibold text-[color:var(--text-primary)]'>
                  {candidate.title}
                </p>
                <span className='text-xs text-[color:var(--text-muted)]'>
                  {candidate.description || 'Wikipedia entry'}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
