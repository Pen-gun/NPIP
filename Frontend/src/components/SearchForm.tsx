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
    <section className='search'>
      <form
        className='search__form'
        onSubmit={(event) => {
          event.preventDefault()
          onSubmit()
        }}
      >
        <label className='search__label' htmlFor='query'>
          Search a public figure
        </label>
        <div className='search__input'>
          <input
            id='query'
            type='text'
            value={query}
            placeholder='e.g. KP Oli Nepali politician'
            onChange={(event) => onQueryChange(event.target.value)}
            aria-invalid={Boolean(inputError)}
            aria-describedby={inputError ? 'search-error' : undefined}
          />
          <button type='submit' disabled={!query.trim()}>
            Analyze
          </button>
        </div>
      </form>
      {inputError && (
        <p id='search-error' className='search__status' role='alert'>
          {inputError}
        </p>
      )}
      {isFetching && status !== 'pending' && (
        <p className='search__status' role='status' aria-live='polite'>
          Refreshing latest signals...
        </p>
      )}
      <div className='search__quick'>
        {quickSearches.map((item) => (
          <button key={item} type='button' onClick={() => onQuickSearch(item)}>
            {item}
          </button>
        ))}
      </div>
    </section>
  )
}
