import type { FigureResponse } from '../types/figure'

type ProfileCardProps = {
  data: FigureResponse
  title: string
}

export default function ProfileCard({ data, title }: ProfileCardProps) {
  return (
    <article className='card profile'>
      <div className='profile__header'>
        {data.person?.thumbnail ? (
          <img src={data.person.thumbnail} alt={title} />
        ) : (
          <div className='profile__placeholder'>{title?.slice(0, 2) || 'NP'}</div>
        )}
        <div>
          <p className='eyebrow'>Identity</p>
          <h2>{title || 'Unknown figure'}</h2>
          <p className='description'>{data.person?.description || 'No description found.'}</p>
        </div>
      </div>
      <p className='summary'>{data.person?.extract || 'No verified biography available yet.'}</p>
      {data.person?.wikipediaUrl && (
        <a className='link' href={data.person.wikipediaUrl} target='_blank' rel='noreferrer'>
          View Wikipedia profile
        </a>
      )}
    </article>
  )
}
