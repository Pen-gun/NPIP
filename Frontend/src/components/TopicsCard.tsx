type TopicsCardProps = {
  topics: Array<{ topic: string; count: number }>
}

export default function TopicsCard({ topics }: TopicsCardProps) {
  return (
    <article className='card'>
      <div className='card__header'>
        <h3>Key topics</h3>
        <span className='chip'>Signals</span>
      </div>
      {topics.length === 0 && <p>No topics extracted yet.</p>}
      <div className='topic-list'>
        {topics.map((item) => (
          <span key={item.topic} className='chip'>
            {item.topic} ({item.count})
          </span>
        ))}
      </div>
    </article>
  )
}
