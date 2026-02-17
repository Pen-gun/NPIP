import { useEffect, useMemo, useState } from 'react'
import { Loader2 } from 'lucide-react'
import type { AdminPage, AdminPageSummary, MediaItem, SeoFields } from '../types'
import type { ToastInput } from '../uiTypes'
import { formatDateTime } from '../utils'
import MediaModal from './MediaModal'

type SeoWorkspaceProps = {
  page: AdminPage | null
  pageSummary?: AdminPageSummary
  loading: boolean
  saving: boolean
  onSave: (seo: SeoFields) => Promise<void>
  onPublish: (seo: SeoFields) => Promise<void>
  mediaLibrary: MediaItem[]
  mediaLoading: boolean
  onUploadMedia: (payload: { file: File; title?: string; alt?: string }) => Promise<MediaItem>
  onDeleteMedia: (mediaId: string) => Promise<void>
  pushToast: (toast: ToastInput) => void
  onDirtyChange: (dirty: boolean) => void
}

const toSeoState = (page: AdminPage | null): SeoFields => ({
  metaTitle: page?.seo?.metaTitle ?? page?.title ?? '',
  metaDescription: page?.seo?.metaDescription ?? '',
  slug: page?.slug ?? '',
  canonical: page?.seo?.canonical ?? '',
  ogImage: page?.seo?.ogImage ?? '',
})

const normalizeSeo = (seo: SeoFields): SeoFields => ({
  metaTitle: seo.metaTitle.trim(),
  metaDescription: seo.metaDescription.trim(),
  slug: seo.slug.trim(),
  canonical: (seo.canonical ?? '').trim(),
  ogImage: (seo.ogImage ?? '').trim(),
})

const isAbsoluteUrl = (value?: string) => !value || /^https?:\/\/[^ "]+$/i.test(value)

export default function SeoWorkspace({
  page,
  pageSummary,
  loading,
  saving,
  onSave,
  onPublish,
  mediaLibrary,
  mediaLoading,
  onUploadMedia,
  onDeleteMedia,
  pushToast,
  onDirtyChange,
}: SeoWorkspaceProps) {
  const [form, setForm] = useState<SeoFields>(() => toSeoState(page))
  const [initialSeo, setInitialSeo] = useState<SeoFields>(() => toSeoState(page))
  const [pendingAction, setPendingAction] = useState<'save' | 'publish' | null>(null)
  const [mediaModalOpen, setMediaModalOpen] = useState(false)

  useEffect(() => {
    const next = toSeoState(page)
    setForm(next)
    setInitialSeo(next)
    setPendingAction(null)
  }, [page])

  const normalizedForm = useMemo(() => normalizeSeo(form), [form])
  const normalizedInitial = useMemo(() => normalizeSeo(initialSeo), [initialSeo])
  const isDirty = JSON.stringify(normalizedForm) !== JSON.stringify(normalizedInitial)

  useEffect(() => {
    onDirtyChange(isDirty)
  }, [isDirty, onDirtyChange])

  useEffect(() => {
    if (!isDirty) return undefined
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault()
      event.returnValue = ''
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [isDirty])

  const metaTitleLength = normalizedForm.metaTitle.length
  const metaDescriptionLength = normalizedForm.metaDescription.length
  const titleInRange = metaTitleLength >= 30 && metaTitleLength <= 65
  const descriptionInRange = metaDescriptionLength >= 70 && metaDescriptionLength <= 160
  const canonicalLooksValid = isAbsoluteUrl(normalizedForm.canonical)
  const readyForSave =
    normalizedForm.metaTitle.length > 0 && normalizedForm.metaDescription.length > 0 && canonicalLooksValid

  const apply = async (mode: 'save' | 'publish') => {
    if (!page) return
    if (!readyForSave) {
      pushToast({
        tone: 'error',
        title: 'SEO fields incomplete',
        message: 'Meta title, meta description, and canonical URL format need attention.',
      })
      return
    }

    setPendingAction(mode)
    try {
      const payload: SeoFields = {
        ...normalizedForm,
        slug: page.slug,
      }
      if (mode === 'publish') {
        await onPublish(payload)
        pushToast({
          tone: 'success',
          title: 'SEO published',
          message: 'SEO updates are now live.',
        })
      } else {
        await onSave(payload)
        pushToast({
          tone: 'success',
          title: 'SEO saved',
          message: 'SEO updates saved successfully.',
        })
      }
      setInitialSeo(payload)
    } catch (error) {
      pushToast({
        tone: 'error',
        title: 'SEO update failed',
        message: error instanceof Error ? error.message : 'Something went wrong.',
      })
    } finally {
      setPendingAction(null)
    }
  }

  if (loading) {
    return (
      <div className='space-y-4'>
        {[0, 1].map((item) => (
          <div key={item} className='h-40 animate-pulse rounded-2xl bg-(--surface-muted)' />
        ))}
      </div>
    )
  }

  if (!page) {
    return (
      <div className='rounded-2xl border border-dashed border-(--border) bg-(--surface-base) p-6 text-sm text-(--text-muted)'>
        Select a page to edit SEO settings.
      </div>
    )
  }

  return (
    <>
      <div className='space-y-6'>
        <div className='rounded-2xl border border-(--border) bg-(--surface-base) p-6 shadow-sm'>
          <div className='flex flex-wrap items-start justify-between gap-4'>
            <div>
              <p className='text-xs font-semibold uppercase tracking-[0.3em] text-(--text-muted)'>SEO workspace</p>
              <h2 className='text-2xl font-semibold'>{page.title}</h2>
              <p className='mt-2 text-xs text-(--text-muted)'>Last updated {formatDateTime(pageSummary?.updatedAt ?? page.updatedAt)}</p>
            </div>
            <div className='flex flex-wrap items-center gap-3'>
              <button
                type='button'
                onClick={() => setMediaModalOpen(true)}
                className='rounded-full border border-(--border) px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-(--text-muted)'
              >
                Pick OG image
              </button>
              <button
                type='button'
                onClick={() => apply('save')}
                disabled={saving || pendingAction !== null}
                className='inline-flex items-center gap-2 rounded-full border border-(--border) px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-(--text-muted) disabled:opacity-50'
              >
                {pendingAction === 'save' && <Loader2 className='h-3 w-3 animate-spin' />}
                Save SEO
              </button>
              <button
                type='button'
                onClick={() => apply('publish')}
                disabled={saving || pendingAction !== null}
                className='inline-flex items-center gap-2 rounded-full bg-(--brand-accent) px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white shadow-sm disabled:opacity-50'
              >
                {pendingAction === 'publish' && <Loader2 className='h-3 w-3 animate-spin' />}
                Save + Publish
              </button>
            </div>
          </div>
        </div>

        <div className='rounded-2xl border border-(--border) bg-(--surface-base) p-6 shadow-sm'>
          <h3 className='text-lg font-semibold'>Search metadata</h3>
          <p className='mt-1 text-xs text-(--text-muted)'>Configure search snippet and link-preview metadata for this page.</p>
          <div className='mt-4 grid gap-4 lg:grid-cols-2'>
            <label className='text-sm text-(--text-muted)'>
              <span className='text-xs font-semibold uppercase tracking-[0.2em]'>Meta title</span>
              <input
                value={form.metaTitle}
                onChange={(event) => setForm((current) => ({ ...current, metaTitle: event.target.value }))}
                placeholder='Meta title'
                className='mt-2 w-full rounded-xl border border-(--border) bg-(--surface-muted) px-3 py-2 text-sm text-(--text-primary) focus:border-(--brand-accent) focus:outline-none'
              />
              <span className={`mt-1 block text-xs ${titleInRange ? 'text-emerald-700' : 'text-amber-700'}`}>
                {metaTitleLength} chars (recommended: 30-65)
              </span>
            </label>

            <label className='text-sm text-(--text-muted)'>
              <span className='text-xs font-semibold uppercase tracking-[0.2em]'>Meta description</span>
              <textarea
                value={form.metaDescription}
                onChange={(event) => setForm((current) => ({ ...current, metaDescription: event.target.value }))}
                placeholder='Meta description'
                rows={4}
                className='mt-2 w-full rounded-xl border border-(--border) bg-(--surface-muted) px-3 py-2 text-sm text-(--text-primary) focus:border-(--brand-accent) focus:outline-none'
              />
              <span className={`mt-1 block text-xs ${descriptionInRange ? 'text-emerald-700' : 'text-amber-700'}`}>
                {metaDescriptionLength} chars (recommended: 70-160)
              </span>
            </label>

            <label className='text-sm text-(--text-muted)'>
              <span className='text-xs font-semibold uppercase tracking-[0.2em]'>Canonical URL</span>
              <input
                value={form.canonical ?? ''}
                onChange={(event) => setForm((current) => ({ ...current, canonical: event.target.value }))}
                placeholder='https://yourdomain.com/page'
                className='mt-2 w-full rounded-xl border border-(--border) bg-(--surface-muted) px-3 py-2 text-sm text-(--text-primary) focus:border-(--brand-accent) focus:outline-none'
              />
              {!canonicalLooksValid && (
                <span className='mt-1 block text-xs text-amber-700'>Use a valid absolute URL with http/https.</span>
              )}
            </label>

            <label className='text-sm text-(--text-muted)'>
              <span className='text-xs font-semibold uppercase tracking-[0.2em]'>OG image URL</span>
              <input
                value={form.ogImage ?? ''}
                onChange={(event) => setForm((current) => ({ ...current, ogImage: event.target.value }))}
                placeholder='https://...'
                className='mt-2 w-full rounded-xl border border-(--border) bg-(--surface-muted) px-3 py-2 text-sm text-(--text-primary) focus:border-(--brand-accent) focus:outline-none'
              />
            </label>
          </div>
        </div>

        <div className='rounded-2xl border border-(--border) bg-(--surface-base) p-6 shadow-sm'>
          <p className='text-xs font-semibold uppercase tracking-[0.25em] text-(--text-muted)'>Preview</p>
          <div className='mt-3 space-y-1'>
            <p className='text-sm font-semibold text-blue-700'>{normalizedForm.metaTitle || 'Meta title preview'}</p>
            <p className='text-xs text-green-700'>{normalizedForm.canonical || `https://npip.ai/${page.slug}`}</p>
            <p className='text-xs text-(--text-muted)'>{normalizedForm.metaDescription || 'Meta description preview goes here.'}</p>
          </div>
          {normalizedForm.ogImage && (
            <img src={normalizedForm.ogImage} alt='Open Graph preview' className='mt-3 h-32 w-full rounded-xl object-cover' />
          )}
        </div>
      </div>

      <MediaModal
        isOpen={mediaModalOpen}
        onClose={() => setMediaModalOpen(false)}
        mediaLibrary={mediaLibrary}
        loading={mediaLoading}
        onSelect={(media) => {
          setForm((current) => ({ ...current, ogImage: media.url }))
          setMediaModalOpen(false)
        }}
        onUploadMedia={onUploadMedia}
        onDeleteMedia={onDeleteMedia}
        pushToast={pushToast}
      />
    </>
  )
}

