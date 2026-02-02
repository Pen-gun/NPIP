import type { MediaItem } from '../types'
import type { ToastInput } from '../uiTypes'
import MediaLibraryPanel from './MediaLibraryPanel'

type MediaModalProps = {
  isOpen: boolean
  onClose: () => void
  mediaLibrary: MediaItem[]
  loading: boolean
  onSelect: (media: MediaItem) => void
  onUploadMedia: (payload: { file: File; title?: string; alt?: string }) => Promise<MediaItem>
  onDeleteMedia: (mediaId: string) => Promise<void>
  pushToast: (toast: ToastInput) => void
}

export default function MediaModal({
  isOpen,
  onClose,
  mediaLibrary,
  loading,
  onSelect,
  onUploadMedia,
  onDeleteMedia,
  pushToast,
}: MediaModalProps) {
  if (!isOpen) return null

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4'>
      <div className='w-full max-w-5xl rounded-2xl bg-(--surface-base) shadow-xl' role='dialog' aria-modal='true'>
        <div className='flex items-center justify-between border-b border-(--divider) px-6 py-4'>
          <div>
            <p className='text-xs font-semibold uppercase tracking-[0.3em] text-(--text-muted)'>Media library</p>
            <h3 className='text-lg font-semibold'>Select an image</h3>
          </div>
          <button
            type='button'
            onClick={onClose}
            className='rounded-full border border-(--border) px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-(--text-muted)'
          >
            Close
          </button>
        </div>
        <div className='max-h-[70vh] overflow-y-auto p-6'>
          <MediaLibraryPanel
            mediaLibrary={mediaLibrary}
            loading={loading}
            onUploadMedia={onUploadMedia}
            onDeleteMedia={onDeleteMedia}
            onSelect={onSelect}
            pushToast={pushToast}
            inline
          />
        </div>
      </div>
    </div>
  )
}
