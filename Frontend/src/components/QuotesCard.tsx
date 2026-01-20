type QuotesCardProps = {
  quotes: string[]
}

export default function QuotesCard({ quotes }: QuotesCardProps) {
  return (
    <article className='card'>
      <div className='card__header'>
        <h3>Notable quotes</h3>
        <span className='chip'>Extracted</span>
      </div>
      {quotes.length === 0 && <p>No quotes found yet.</p>}
      <ul className='quote-list'>
        {quotes.map((quote) => (
          <li key={quote}>
            <p>"{quote}"</p>
          </li>
        ))}
      </ul>
    </article>
  )
}
