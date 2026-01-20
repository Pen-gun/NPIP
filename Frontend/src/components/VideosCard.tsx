import type { FigureResponse } from '../types/figure'

type VideosCardProps = {
  data: FigureResponse
  formatDate: (value?: string) => string
}

export default function VideosCard({ data, formatDate }: VideosCardProps) {
  const videoWarning = data.metadata.sources.youtube.warning

  return (
    <article className='card videos'>
      <div className='card__header'>
        <h3>Interviews & speeches</h3>
        <span className='chip'>YouTube</span>
      </div>
      {data.videos.length === 0 && (
        <p>{videoWarning ? `Videos unavailable: ${videoWarning}` : 'No videos found yet.'}</p>
      )}
      <div className='videos__list'>
        {data.videos.map((video) => (
          <a key={video.url || video.id} className='videos__item' href={video.url} target='_blank' rel='noreferrer'>
            {video.thumbnail ? <img src={video.thumbnail} alt={video.title} /> : null}
            <div>
              <p>{video.title}</p>
              <span>
                {video.channelTitle} • {formatDate(video.publishedAt)}
              </span>
            </div>
          </a>
        ))}
      </div>
    </article>
  )
}
