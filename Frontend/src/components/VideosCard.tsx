import type { FigureVideosResponse } from '../types/figure'

type VideosCardProps = {
  data: FigureVideosResponse
  formatDate: (value?: string) => string
  isLoading?: boolean
  errorMessage?: string
}

export default function VideosCard({ data, formatDate, isLoading, errorMessage }: VideosCardProps) {
  const videoWarning = data.metadata.sources.youtube.warning

  return (
    <article className='card videos'>
      <div className='card__header'>
        <h3>Interviews & speeches</h3>
        <span className='chip'>YouTube</span>
      </div>
      {isLoading && <p>Loading videos...</p>}
      {errorMessage && <p className='warning'>{errorMessage}</p>}
      {data.videos.length === 0 && (
        <p>{videoWarning ? `Videos unavailable: ${videoWarning}` : 'No videos found yet.'}</p>
      )}
      <div className='videos__list'>
        {data.videos.map((video) => (
          <div key={video.url || video.id} className='videos__item'>
            {video.thumbnail ? <img src={video.thumbnail} alt={video.title} /> : null}
            <div>
              <a href={video.url} target='_blank' rel='noreferrer'>
                {video.title}
              </a>
              <span>
                {video.channelTitle} • {formatDate(video.publishedAt)}
              </span>
              {video.transcriptPreview && video.transcriptPreview.length > 0 && (
                <details className='transcript'>
                  <summary>Transcript preview</summary>
                  <p>{video.transcriptPreview.join(' ')}</p>
                </details>
              )}
            </div>
          </div>
        ))}
      </div>
    </article>
  )
}
