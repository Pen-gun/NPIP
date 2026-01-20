type SearchFormProps = {
  query: string
  inputError: string
  isFetching: boolean
  status: 'error' | 'pending' | 'success'
  onQueryChange: (value: string) => void
  onSubmit: () => void
  onQuickSearch: (value: string) => void
}

const quickSearches = ['KP Oli', 'Balen Shah', 'Sher Bahadur Deuba', 'Pradeep Gyawali']

export default function SearchForm({
  query,
  inputError,
  isFetching,
  status,
  onQueryChange,
  onSubmit,
  onQuickSearch,
}: SearchFormProps) {
  return (
    <section className='rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface-base)] p-6 shadow-[var(--shadow)]'>
      <form
        className='flex flex-col gap-4'
        onSubmit={(event) => {
          event.preventDefault()
          onSubmit()
        }}
      >
        <label className='text-sm font-semibold text-[color:var(--text-primary)]' htmlFor='query'>
          Search a public figure
        </label>
        <div className='flex flex-col gap-3 sm:flex-row'>
          <input
            id='query'
            type='text'
            value={query}
            placeholder='e.g. KP Oli Nepali politician'
            onChange={(event) => onQueryChange(event.target.value)}
            aria-invalid={Boolean(inputError)}
            aria-describedby={inputError ? 'search-error' : undefined}
            className='w-full rounded-xl border border-[color:var(--border)] bg-transparent px-4 py-3 text-sm text-[color:var(--text-primary)] shadow-sm outline-none transition focus:ring-2 focus:ring-[color:var(--brand-accent)]'
          />
          <button
            type='submit'
            disabled={!query.trim()}
            className='rounded-xl bg-[color:var(--brand-accent)] px-5 py-3 text-sm font-semibold text-[color:var(--text-inverse)] transition hover:-translate-y-0.5 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-[color:var(--brand-accent)] disabled:cursor-not-allowed disabled:opacity-60'
          >
            Analyze
          </button>
        </div>
      </form>
      {inputError && (
        <p id='search-error' className='mt-3 text-xs text-[color:var(--state-error)]' role='alert'>
          {inputError}
        </p>
      )}
      {isFetching && status !== 'pending' && (
        <p className='mt-3 text-xs text-[color:var(--info-text)]' role='status' aria-live='polite'>
          Refreshing latest signals...
        </p>
      )}
      <div className='mt-4 flex flex-wrap gap-2'>
        {quickSearches.map((item) => (
          <button
            key={item}
            type='button'
            onClick={() => onQuickSearch(item)}
            className='rounded-full border border-[color:var(--border)] bg-[color:var(--surface-muted)] px-4 py-2 text-xs font-semibold text-[color:var(--text-primary)] transition hover:bg-[color:var(--surface-base)]'
          >
            {item}
          </button>
        ))}
      </div>
    </section>
  )
}
