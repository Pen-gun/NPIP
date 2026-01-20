import type { FigureResponse } from '../types/figure'

type DisambiguationListProps = {
  data: FigureResponse
  onSelect: (value: string) => void
}

export default function DisambiguationList({ data, onSelect }: DisambiguationListProps) {
  return (
    <div className='card disambiguation'>
      <div className='card__header'>
        <h3>Choose the right person</h3>
        <span className='chip'>Disambiguation</span>
      </div>
      <p className='description'>
        "{data.query}" matches multiple entries. Pick the right profile to continue.
      </p>
      {data.candidates.length === 0 ? (
        <p className='description'>No candidates found. Try a more specific query.</p>
      ) : (
        <div className='disambiguation__list'>
          {data.candidates.slice(0, 6).map((candidate) => (
            <button
              key={candidate.wikipediaUrl || candidate.title}
              type='button'
              className='disambiguation__item'
              onClick={() => onSelect(candidate.title)}
            >
              <div>
                <p>{candidate.title}</p>
                <span>{candidate.description || 'Wikipedia entry'}</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
