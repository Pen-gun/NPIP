import { useState } from 'react'
import type { MediaItem } from '../types'
import type { ToastInput } from '../uiTypes'
import { formatDateTime } from '../utils'

type MediaLibraryPanelProps = {
  mediaLibrary: MediaItem[]
  loading: boolean
  onUploadMedia: (payload: { file: File; title?: string; alt?: string }) => Promise<MediaItem>
  onDeleteMedia: (mediaId: string) => Promise<void>
  onSelect?: (media: MediaItem) => void
  pushToast: (toast: ToastInput) => void
  inline?: boolean
}

export default function MediaLibraryPanel({
  mediaLibrary,
  loading,
  onUploadMedia,
  onDeleteMedia,
  onSelect,
  pushToast,
  inline = false,
}: MediaLibraryPanelProps) {
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [uploadTitle, setUploadTitle] = useState('')
  const [uploadAlt, setUploadAlt] = useState('')
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const handleUpload = async () => {
    if (!uploadFile) return
    try {
      await onUploadMedia({ file: uploadFile, title: uploadTitle, alt: uploadAlt })
      setUploadFile(null)
      setUploadTitle('')
      setUploadAlt('')
      pushToast({ title: 'Media uploaded', message: 'New asset saved to the library.', tone: 'success' })
    } catch (error) {
      pushToast({
        title: 'Upload failed',
        message: error instanceof Error ? error.message : 'Something went wrong.',
        tone: 'error',
      })
    }
  }

  const handleDelete = async (mediaId: string) => {
    if (!window.confirm('Delete this media item?')) return
    setDeletingId(mediaId)
    try {
      await onDeleteMedia(mediaId)
      pushToast({ title: 'Media deleted', tone: 'info' })
    } catch (error) {
      pushToast({
        title: 'Delete failed',
        message: error instanceof Error ? error.message : 'Something went wrong.',
        tone: 'error',
      })
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className={inline ? '' : 'space-y-6'}>
      {!inline && (
        <div className='rounded-2xl border border-(--border) bg-(--surface-base) p-6 shadow-sm'>
          <div className='flex flex-wrap items-center justify-between gap-3'>
            <div>
              <p className='text-xs font-semibold uppercase tracking-[0.3em] text-(--text-muted)'>Media library</p>
              <h2 className='text-xl font-semibold'>Images & assets</h2>
            </div>
          </div>
          <p className='mt-2 text-sm text-(--text-muted)'>
            Upload images, manage metadata, and select assets for page blocks.
          </p>
        </div>
      )}

      <div className='rounded-2xl border border-(--border) bg-(--surface-base) p-6 shadow-sm'>
        <h3 className='text-sm font-semibold'>Upload media</h3>
        <div className='mt-4 grid gap-4 lg:grid-cols-[1.2fr_1fr_1fr_auto]'>
          <input
            type='file'
            accept='image/*'
            onChange={(event) => setUploadFile(event.target.files?.[0] ?? null)}
            className='rounded-xl border border-(--border) bg-(--surface-muted) px-3 py-2 text-xs'
          />
          <input
            value={uploadTitle}
            onChange={(event) => setUploadTitle(event.target.value)}
            placeholder='Title'
            className='rounded-xl border border-(--border) bg-(--surface-muted) px-3 py-2 text-xs'
          />
          <input
            value={uploadAlt}
            onChange={(event) => setUploadAlt(event.target.value)}
            placeholder='Alt text'
            className='rounded-xl border border-(--border) bg-(--surface-muted) px-3 py-2 text-xs'
          />
          <button
            type='button'
            onClick={handleUpload}
            className='rounded-full bg-(--brand-accent) px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white'
          >
            Upload
          </button>
        </div>
      </div>

      <div className='rounded-2xl border border-(--border) bg-(--surface-base) p-6 shadow-sm'>
        <div className='flex items-center justify-between'>
          <h3 className='text-sm font-semibold'>Library</h3>
          <span className='text-xs text-(--text-muted)'>{mediaLibrary.length} assets</span>
        </div>
        {loading ? (
          <div className='mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
            {[0, 1, 2, 3, 4, 5].map((item) => (
              <div key={item} className='h-40 animate-pulse rounded-xl bg-(--surface-muted)' />
            ))}
          </div>
        ) : mediaLibrary.length ? (
          <div className='mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
            {mediaLibrary.map((media) => (
              <div key={media.id} className='rounded-xl border border-(--border) bg-(--surface-muted) p-3'>
                <img src={media.url} alt={media.alt || 'Media'} className='h-32 w-full rounded-lg object-cover' />
                <div className='mt-3'>
                  <p className='text-xs font-semibold text-(--text-primary)'>{media.title || 'Untitled'}</p>
                  <p className='text-[11px] text-(--text-muted)'>{media.alt || 'No alt text'}</p>
                </div>
                <div className='mt-3 flex items-center justify-between'>
                  {onSelect ? (
                    <button
                      type='button'
                      onClick={() => onSelect(media)}
                      className='rounded-full bg-(--brand-accent) px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-white'
                    >
                      Select
                    </button>
                  ) : (
                    <span className='text-[10px] text-(--text-muted)'>Added {formatDateTime(media.createdAt)}</span>
                  )}
                  <button
                    type='button'
                    onClick={() => handleDelete(media.id)}
                    className='text-[10px] font-semibold uppercase tracking-[0.2em] text-rose-500'
                    disabled={deletingId === media.id}
                  >
                    {deletingId === media.id ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className='mt-4 rounded-xl border border-dashed border-(--border) p-6 text-sm text-(--text-muted)'>
            No media yet. Upload an image to get started.
          </div>
        )}
      </div>
    </div>
  )
}
