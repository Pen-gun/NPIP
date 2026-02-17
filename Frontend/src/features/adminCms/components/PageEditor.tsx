import { useEffect, useState } from 'react'
import { Loader2, Plus } from 'lucide-react'
import { FormProvider, useFieldArray, useForm, useWatch, type FieldPath } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import type { AdminPage, AdminPageSummary, ContentBlock, MediaItem } from '../types'
import { pageFormSchema, type PageFormValues } from '../schemas'
import type { ToastInput } from '../uiTypes'
import { blockLabels, buildPageDefaults, createBlockDefaults, formatDateTime } from '../utils'
import MediaModal from './MediaModal'
import BlockCard from './blocks/BlockCard'
import InputField from './fields/InputField'

type PageEditorProps = {
  page: AdminPage | null
  pageSummary?: AdminPageSummary
  loading: boolean
  onSave: (values: PageFormValues) => Promise<void>
  onPublish: (values: PageFormValues) => Promise<void>
  onUnpublish: (values: PageFormValues) => Promise<void>
  mediaLibrary: MediaItem[]
  mediaLoading: boolean
  onUploadMedia: (payload: { file: File; title?: string; alt?: string }) => Promise<MediaItem>
  onDeleteMedia: (mediaId: string) => Promise<void>
  pushToast: (toast: ToastInput) => void
  onDirtyChange: (dirty: boolean) => void
}

export default function PageEditor({
  page,
  pageSummary,
  loading,
  onSave,
  onPublish,
  onUnpublish,
  mediaLibrary,
  mediaLoading,
  onUploadMedia,
  onDeleteMedia,
  pushToast,
  onDirtyChange,
}: PageEditorProps) {
  const [blockTypeToAdd, setBlockTypeToAdd] = useState<ContentBlock['type']>('hero')
  const [mediaModalOpen, setMediaModalOpen] = useState(false)
  const [mediaTargetPath, setMediaTargetPath] = useState<FieldPath<PageFormValues> | null>(null)
  const [pendingAction, setPendingAction] = useState<'save' | 'publish' | 'unpublish' | null>(null)

  const methods = useForm<PageFormValues>({
    resolver: zodResolver(pageFormSchema),
    defaultValues: buildPageDefaults(page),
    mode: 'onBlur',
  })

  const {
    control,
    handleSubmit,
    reset,
    formState: { isDirty, errors },
    setValue,
  } = methods

  const blocksFieldArray = useFieldArray({ control, name: 'blocks' })
  const livePayload = useWatch({ control })
  const samplePayload = JSON.stringify(livePayload ?? {}, null, 2)

  useEffect(() => {
    reset(buildPageDefaults(page), { keepDirty: false })
  }, [page, reset])

  useEffect(() => {
    if (!isDirty) return undefined
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault()
      event.returnValue = ''
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [isDirty])

  useEffect(() => {
    onDirtyChange(isDirty)
  }, [isDirty, onDirtyChange])

  const handleMediaSelect = (media: MediaItem) => {
    if (!mediaTargetPath) return
    setValue(mediaTargetPath, media.url, { shouldDirty: true })
    setMediaModalOpen(false)
    setMediaTargetPath(null)
  }

  const handleMediaPickerOpen = (path: FieldPath<PageFormValues>) => {
    setMediaTargetPath(path)
    setMediaModalOpen(true)
  }

  const handleAddBlock = () => {
    blocksFieldArray.append(createBlockDefaults(blockTypeToAdd))
  }

  const handleDestructiveAction = (action: () => void, message: string) => {
    if (!window.confirm(message)) return
    action()
  }

  const submitAction = (action: 'save' | 'publish' | 'unpublish') => {
    if (pendingAction) return
    setPendingAction(action)
    void handleSubmit(async (values) => {
      try {
        if (action === 'publish') {
          await onPublish(values)
        } else if (action === 'unpublish') {
          await onUnpublish(values)
        } else {
          await onSave(values)
        }
        reset(values)
      } finally {
        setPendingAction(null)
      }
    })()
  }

  const status = pageSummary?.status ?? page?.status ?? 'draft'
  const updatedBy = pageSummary?.updatedBy?.name ?? page?.updatedBy?.name ?? '—'
  const updatedAt = pageSummary?.updatedAt ?? page?.updatedAt

  return (
    <FormProvider {...methods}>
      <form className='space-y-6' aria-busy={loading}>
        <div className='rounded-2xl border border-(--border) bg-(--surface-base) p-6 shadow-sm'>
          <div className='flex flex-wrap items-center justify-between gap-4'>
            <div>
              <p className='text-xs font-semibold uppercase tracking-[0.3em] text-(--text-muted)'>Page editor</p>
              <h2 className='text-2xl font-semibold'>{page?.title || 'Select a page'}</h2>
              <p className='mt-2 text-xs text-(--text-muted)'>
                Last updated {formatDateTime(updatedAt)} by {updatedBy}
              </p>
            </div>
            <div className='flex flex-wrap items-center gap-3'>
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] ${
                  status === 'published' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                }`}
              >
                {status}
              </span>
              {isDirty && (
                <span className='rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700'>
                  Unsaved changes
                </span>
              )}
              <button
                type='button'
                onClick={() => submitAction('save')}
                className='flex items-center gap-2 rounded-full border border-(--border) px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-(--text-muted) transition hover:text-(--text-primary) disabled:opacity-50'
                disabled={pendingAction !== null}
              >
                {pendingAction === 'save' && <Loader2 className='h-3 w-3 animate-spin' />}
                {pendingAction === 'save' ? 'Saving...' : 'Save draft'}
              </button>
              <button
                type='button'
                onClick={() => submitAction('publish')}
                className='flex items-center gap-2 rounded-full bg-(--brand-accent) px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white shadow-sm transition hover:opacity-90 disabled:opacity-50'
                disabled={pendingAction !== null}
              >
                {pendingAction === 'publish' && <Loader2 className='h-3 w-3 animate-spin' />}
                {pendingAction === 'publish' ? 'Publishing...' : 'Publish'}
              </button>
              <button
                type='button'
                onClick={() => handleDestructiveAction(() => submitAction('unpublish'), 'Unpublish this page?')}
                className='flex items-center gap-2 rounded-full border border-(--border) px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-(--text-muted) transition hover:text-(--text-primary) disabled:opacity-50'
                disabled={pendingAction !== null}
              >
                {pendingAction === 'unpublish' && <Loader2 className='h-3 w-3 animate-spin' />}
                {pendingAction === 'unpublish' ? 'Unpublishing...' : 'Unpublish'}
              </button>
            </div>
          </div>
          {Object.keys(errors).length > 0 && (
            <div className='mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800'>
              Some fields need attention. Scroll down to see validation hints.
            </div>
          )}
        </div>

        {loading ? (
          <div className='space-y-4'>
            {[0, 1, 2].map((item) => (
              <div key={item} className='h-32 animate-pulse rounded-2xl bg-(--surface-muted)' />
            ))}
          </div>
        ) : (
          <>
            <div className='rounded-2xl border border-(--border) bg-(--surface-base) p-6 shadow-sm'>
              <div className='flex flex-wrap items-center justify-between gap-4'>
                <div>
                  <h3 className='text-lg font-semibold'>Page essentials</h3>
                  <p className='text-xs text-(--text-muted)'>Title and slug control navigation, routing, and SEO.</p>
                </div>
                <div className='flex items-center gap-2'>
                  <label className='text-xs font-semibold text-(--text-muted)'>Status</label>
                  <select
                    {...methods.register('status')}
                    className='rounded-full border border-(--border) bg-(--surface-muted) px-3 py-2 text-xs font-semibold text-(--text-primary)'
                  >
                    <option value='draft'>Draft</option>
                    <option value='published'>Published</option>
                  </select>
                </div>
              </div>
              <div className='mt-4 grid gap-4 lg:grid-cols-2'>
                <InputField name='title' label='Page title' placeholder='Home, About, Contact...' />
                <InputField name='slug' label='Slug' placeholder='home, about, contact' />
              </div>
            </div>

            <div className='rounded-2xl border border-(--border) bg-(--surface-base) p-6 shadow-sm'>
              <div className='flex flex-wrap items-center justify-between gap-4'>
                <div>
                  <h3 className='text-lg font-semibold'>Content blocks</h3>
                  <p className='text-xs text-(--text-muted)'>Add, reorder, and customize sections for this page.</p>
                </div>
                <div className='flex items-center gap-2'>
                  <select
                    value={blockTypeToAdd}
                    onChange={(event) => setBlockTypeToAdd(event.target.value as ContentBlock['type'])}
                    className='rounded-full border border-(--border) bg-(--surface-muted) px-3 py-2 text-xs font-semibold text-(--text-primary)'
                  >
                    {Object.keys(blockLabels).map((type) => (
                      <option key={type} value={type}>
                        {blockLabels[type as ContentBlock['type']]}
                      </option>
                    ))}
                  </select>
                  <button
                    type='button'
                    onClick={handleAddBlock}
                    className='inline-flex items-center gap-2 rounded-full bg-(--brand-accent) px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white'
                  >
                    <Plus className='h-3.5 w-3.5' aria-hidden />
                    Add block
                  </button>
                </div>
              </div>

              <div className='mt-6 space-y-4'>
                {blocksFieldArray.fields.map((block, index) => (
                  <BlockCard
                    key={block.id}
                    index={index}
                    blockType={block.type as ContentBlock['type']}
                    onMoveUp={() => blocksFieldArray.move(index, index - 1)}
                    onMoveDown={() => blocksFieldArray.move(index, index + 1)}
                    onRemove={() =>
                      handleDestructiveAction(() => blocksFieldArray.remove(index), 'Delete this content block?')
                    }
                    canMoveUp={index > 0}
                    canMoveDown={index < blocksFieldArray.fields.length - 1}
                    onPickMedia={handleMediaPickerOpen}
                  />
                ))}
                {!blocksFieldArray.fields.length && (
                  <div className='rounded-xl border border-dashed border-(--border) p-6 text-sm text-(--text-muted)'>
                    No blocks yet. Add a block to start building this page.
                  </div>
                )}
              </div>
            </div>

            <div className='rounded-2xl border border-(--border) bg-(--surface-base) p-6 shadow-sm'>
              <h3 className='text-lg font-semibold'>API payload preview</h3>
              <p className='mt-1 text-xs text-(--text-muted)'>
                This JSON is stored in the database and maps directly to the editor UI.
              </p>
              <div className='mt-4 grid gap-4 lg:grid-cols-[1.2fr_1fr]'>
                <pre className='max-h-64 overflow-auto rounded-xl bg-(--surface-muted) p-4 text-[11px] text-(--text-muted)'>
                  {samplePayload}
                </pre>
                <div className='text-xs text-(--text-muted)'>
                  <ul className='space-y-2'>
                    <li>
                      <strong>blocks</strong> renders each block editor (hero, rich text, grid, etc).
                    </li>
                    <li>
                      <strong>seo</strong> is managed from the dedicated SEO tab.
                    </li>
                    <li>
                      <strong>status</strong> powers Draft/Published state and workflow buttons.
                    </li>
                    <li>
                      <strong>updatedBy</strong> appears in the editor header for transparency.
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </>
        )}
      </form>

      <MediaModal
        isOpen={mediaModalOpen}
        onClose={() => setMediaModalOpen(false)}
        mediaLibrary={mediaLibrary}
        loading={mediaLoading}
        onSelect={handleMediaSelect}
        onUploadMedia={onUploadMedia}
        onDeleteMedia={onDeleteMedia}
        pushToast={pushToast}
      />
    </FormProvider>
  )
}
