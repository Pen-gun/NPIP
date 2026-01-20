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
    <article className='rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-6 shadow-[var(--shadow)]'>
      <div className='flex items-center justify-between'>
        <h3 className='text-lg font-semibold'>Interviews & speeches</h3>
        <span className='rounded-full border border-[color:var(--border)] bg-[color:var(--background)] px-3 py-1 text-xs font-semibold'>
          YouTube
        </span>
      </div>
      {isLoading && <p className='mt-3 text-sm text-[color:var(--muted)]'>Loading videos...</p>}
      {errorMessage && <p className='mt-3 text-sm text-[color:var(--accent)]'>{errorMessage}</p>}
      {data.videos.length === 0 && (
        <p className='mt-3 text-sm text-[color:var(--muted)]'>
          {videoWarning ? `Videos unavailable: ${videoWarning}` : 'No videos found yet.'}
        </p>
      )}
      <div className='mt-4 grid gap-4'>
        {data.videos.map((video) => (
          <div
            key={video.url || video.id}
            className='grid gap-3 rounded-xl border border-transparent p-3 transition hover:border-[color:var(--accent)] hover:bg-[color:var(--background)] sm:grid-cols-[96px_1fr]'
          >
            {video.thumbnail ? (
              <img
                src={video.thumbnail}
                alt={video.title}
                className='h-16 w-24 rounded-lg object-cover'
              />
            ) : null}
            <div className='space-y-2'>
              <a
                href={video.url}
                target='_blank'
                rel='noreferrer'
                className='block text-sm font-semibold text-[color:var(--text)] hover:text-[color:var(--accent)]'
              >
                {video.title}
              </a>
              <span className='text-xs text-[color:var(--muted)]'>
                {video.channelTitle} • {formatDate(video.publishedAt)}
              </span>
              {video.transcriptPreview && video.transcriptPreview.length > 0 && (
                <details className='text-xs text-[color:var(--muted)]'>
                  <summary className='cursor-pointer font-semibold'>Transcript preview</summary>
                  <p className='mt-1'>{video.transcriptPreview.join(' ')}</p>
                </details>
              )}
            </div>
          </div>
        ))}
      </div>
    </article>
  )
}
