
import { useEffect, useMemo, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import { ChevronDown, ChevronUp, Plus, Trash2 } from 'lucide-react'
import { FormProvider, useFieldArray, useForm, useFormContext, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import type { AdminPage, AdminPageSummary, ContentBlock, MediaItem, PageStatus } from '../features/adminCms/types'
import { pageFormSchema, type PageFormValues } from '../features/adminCms/schemas'
import {
  useAdminMedia,
  useAdminPage,
  useAdminPages,
  useDeleteAdminMedia,
  useUpdateAdminPage,
  useUploadAdminMedia,
} from '../features/adminCms/hooks'
import { useAuth } from '../contexts/AuthContext'
import { useAdminSiteSettings, useUpdateAdminSiteSettings } from '../hooks/useSiteSettings'
import AdminSidebar from '../features/adminCms/components/AdminSidebar'
import AdminTopbar from '../features/adminCms/components/AdminTopbar'
import MediaLibraryPanel from '../features/adminCms/components/MediaLibraryPanel'
import MediaModal from '../features/adminCms/components/MediaModal'
import SettingsPanel from '../features/adminCms/components/SettingsPanel'
import ToastStack from '../features/adminCms/components/ToastStack'
import { useToasts } from '../features/adminCms/useToasts'
import type { AdminSection, ToastInput } from '../features/adminCms/uiTypes'
import {
  blockDescriptions,
  blockLabels,
  buildPageDefaults,
  createBlockDefaults,
  createId,
  formatDateTime,
} from '../features/adminCms/utils'



export default function AdminCMSPage() {
  const { user, logout } = useAuth()
  const [activeSection, setActiveSection] = useState<AdminSection>('pages')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { toasts, pushToast } = useToasts()
  const [searchTerm, setSearchTerm] = useState('')
  const [pageDirty, setPageDirty] = useState(false)
  const { data: pages = [], isLoading: pagesLoading } = useAdminPages()
  const [activePageId, setActivePageId] = useState<string | null>(
    pages[0]?.id ?? null,
  )
  const activePageFromList = pages.find((page) => page.id === activePageId)
  const { data: activePage, isLoading: pageLoading } = useAdminPage(activePageId)
  const { data: mediaLibrary = [], isLoading: mediaLoading } = useAdminMedia()
  const updatePageMutation = useUpdateAdminPage()
  const uploadMediaMutation = useUploadAdminMedia()
  const deleteMediaMutation = useDeleteAdminMedia()
  const { data: siteSettings, isLoading: settingsLoading } = useAdminSiteSettings()
  const updateSettingsMutation = useUpdateAdminSiteSettings()

  useEffect(() => {
    if (!activePageId && pages.length) {
      setActivePageId(pages[0].id)
    }
  }, [activePageId, pages])

  const filteredPages = useMemo(() => {
    const query = searchTerm.trim().toLowerCase()
    if (!query) return pages
    return pages.filter((page) => page.title.toLowerCase().includes(query) || page.slug.includes(query))
  }, [pages, searchTerm])

  const handlePreview = () => {
    if (!activePage) return
    const slug = activePage.slug === 'home' ? '' : activePage.slug
    window.open(`/${slug}`, '_blank', 'noopener,noreferrer')
  }

  const handleLogout = async () => {
    await logout()
  }

  const handlePageUpdate = async (values: PageFormValues, statusOverride?: PageStatus) => {
    if (!activePageId) return
    const payload = {
      ...values,
      status: statusOverride ?? values.status,
      seo: {
        ...values.seo,
        slug: values.slug,
      },
    }
    await updatePageMutation.mutateAsync({ pageId: activePageId, payload })
  }

  return (
    <div
      className='admin-shell relative min-h-screen bg-(--surface-background) text-(--text-primary)'
      style={
        siteSettings?.accentColor
          ? ({ '--brand-accent': siteSettings.accentColor } as CSSProperties)
          : undefined
      }
    >
      <div className='pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(249,115,22,0.16),_transparent_55%)]' />

      <AdminSidebar
        activeSection={activeSection}
        onSectionChange={(section) => {
          setActiveSection(section)
          setSidebarOpen(false)
        }}
        sidebarOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        brandName={siteSettings?.brandName}
        tagline={siteSettings?.tagline}
      />

      <div className='flex min-h-screen flex-col lg:pl-72'>
        <AdminTopbar
          userName={user?.fullName || user?.username || 'Admin'}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
          onPreview={handlePreview}
          onLogout={handleLogout}
          brandName={siteSettings?.brandName}
        />

        <main className='flex-1 px-4 pb-12 pt-6 sm:px-6 lg:px-8'>
          {activeSection === 'pages' && (
            <div className='grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]'>
              <PageListCard
                pages={filteredPages}
                activePageId={activePageId}
                loading={pagesLoading}
                onSelectPage={(pageId) => {
                  if (pageDirty && pageId !== activePageId) {
                    const confirmChange = window.confirm(
                      'You have unsaved changes. Switch pages and discard them?',
                    )
                    if (!confirmChange) return
                  }
                  setActivePageId(pageId)
                }}
              />
              <PageEditor
                page={activePage ?? null}
                pageSummary={activePageFromList}
                loading={pageLoading}
                onSave={async (values) => {
                  try {
                    await handlePageUpdate(values, 'draft')
                    pushToast({
                      title: 'Draft saved',
                      message: 'Your changes are stored in the database.',
                      tone: 'success',
                    })
                  } catch (error) {
                    pushToast({
                      title: 'Failed to save',
                      message: error instanceof Error ? error.message : 'Something went wrong.',
                      tone: 'error',
                    })
                  }
                }}
                onPublish={async (values) => {
                  try {
                    await handlePageUpdate(values, 'published')
                    pushToast({
                      title: 'Page published',
                      message: 'Live content updated successfully.',
                      tone: 'success',
                    })
                  } catch (error) {
                    pushToast({
                      title: 'Publish failed',
                      message: error instanceof Error ? error.message : 'Something went wrong.',
                      tone: 'error',
                    })
                  }
                }}
                onUnpublish={async (values) => {
                  try {
                    await handlePageUpdate(values, 'draft')
                    pushToast({
                      title: 'Page unpublished',
                      message: 'Page is now in draft state.',
                      tone: 'info',
                    })
                  } catch (error) {
                    pushToast({
                      title: 'Unpublish failed',
                      message: error instanceof Error ? error.message : 'Something went wrong.',
                      tone: 'error',
                    })
                  }
                }}
                mediaLibrary={mediaLibrary}
                mediaLoading={mediaLoading}
                onUploadMedia={uploadMediaMutation.mutateAsync}
                onDeleteMedia={deleteMediaMutation.mutateAsync}
                pushToast={pushToast}
                onDirtyChange={setPageDirty}
              />
            </div>
          )}

          {activeSection === 'media' && (
            <MediaLibraryPanel
              mediaLibrary={mediaLibrary}
              loading={mediaLoading}
              onUploadMedia={uploadMediaMutation.mutateAsync}
              onDeleteMedia={deleteMediaMutation.mutateAsync}
              pushToast={pushToast}
            />
          )}

          {activeSection === 'settings' && (
            <SettingsPanel
              settings={siteSettings}
              loading={settingsLoading}
              onSave={updateSettingsMutation.mutateAsync}
              saving={updateSettingsMutation.isPending}
              pushToast={pushToast}
            />
          )}

          {activeSection !== 'pages' && activeSection !== 'media' && activeSection !== 'settings' && (
            <div className='rounded-2xl border border-(--border) bg-(--surface-base) p-6 shadow-sm'>
              <div className='flex items-center gap-3'>
                <div className='rounded-2xl bg-(--surface-muted) p-3 text-(--brand-accent)'>
                  <Sparkles className='h-5 w-5' aria-hidden />
                </div>
                <div>
                  <p className='text-xs font-semibold uppercase tracking-[0.3em] text-(--text-muted)'>
                    Coming soon
                  </p>
                  <h2 className='text-xl font-semibold'>More admin tools in progress</h2>
                </div>
              </div>
              <p className='mt-4 text-sm text-(--text-muted)'>
                This area will include advanced role management, SEO automation, and analytics dashboards.
                Use the Pages and Media tabs for full CMS editing today.
              </p>
            </div>
          )}
        </main>
      </div>

      <ToastStack toasts={toasts} />
    </div>
  )
}

function PageListCard({
  pages,
  activePageId,
  loading,
  onSelectPage,
}: {
  pages: AdminPageSummary[]
  activePageId: string | null
  loading: boolean
  onSelectPage: (pageId: string) => void
}) {
  if (loading) {
    return (
      <div className='space-y-4'>
        {[0, 1, 2].map((item) => (
          <div key={item} className='h-20 animate-pulse rounded-2xl bg-(--surface-muted)' />
        ))}
      </div>
    )
  }

  if (!pages.length) {
    return (
      <div className='rounded-2xl border border-dashed border-(--border) bg-(--surface-base) p-6 text-sm text-(--text-muted)'>
        No pages yet. Add your first page to start editing.
      </div>
    )
  }

  return (
    <div className='rounded-2xl border border-(--border) bg-(--surface-base) p-4 shadow-sm'>
      <div className='flex items-center justify-between'>
        <h3 className='text-sm font-semibold'>Pages</h3>
        <span className='text-xs text-(--text-muted)'>{pages.length} total</span>
      </div>
      <div className='mt-4 space-y-3'>
        {pages.map((page) => {
          const isActive = page.id === activePageId
          return (
            <button
              key={page.id}
              type='button'
              onClick={() => onSelectPage(page.id)}
              className={`w-full rounded-xl border px-4 py-3 text-left transition ${
                isActive
                  ? 'border-(--brand-accent) bg-(--surface-muted) text-(--text-primary)'
                  : 'border-(--border) hover:border-(--brand-accent)/50'
              }`}
            >
              <div className='flex items-center justify-between gap-3'>
                <div>
                  <p className='text-sm font-semibold'>{page.title}</p>
                  <p className='text-xs text-(--text-muted)'>/{page.slug}</p>
                </div>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.2em] ${
                    page.status === 'published'
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-amber-100 text-amber-700'
                  }`}
                >
                  {page.status}
                </span>
              </div>
              <p className='mt-2 text-[11px] text-(--text-muted)'>
                Updated {formatDateTime(page.updatedAt)}
              </p>
            </button>
          )
        })}
      </div>
    </div>
  )
}

function PageEditor({
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
}: {
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
}) {
  const [blockTypeToAdd, setBlockTypeToAdd] = useState<ContentBlock['type']>('hero')
  const [mediaModalOpen, setMediaModalOpen] = useState(false)
  const [mediaTargetPath, setMediaTargetPath] = useState<string | null>(null)
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
    setValue(mediaTargetPath as never, media.url, { shouldDirty: true })
    setMediaModalOpen(false)
    setMediaTargetPath(null)
  }

  const handleMediaPickerOpen = (path: string) => {
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
                  status === 'published'
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-amber-100 text-amber-700'
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
                className='rounded-full border border-(--border) px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-(--text-muted) transition hover:text-(--text-primary)'
                disabled={pendingAction !== null}
              >
                Save draft
              </button>
              <button
                type='button'
                onClick={() => submitAction('publish')}
                className='rounded-full bg-(--brand-accent) px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white shadow-sm transition hover:opacity-90'
                disabled={pendingAction !== null}
              >
                Publish
              </button>
              <button
                type='button'
                onClick={() =>
                  handleDestructiveAction(() => submitAction('unpublish'), 'Unpublish this page?')
                }
                className='rounded-full border border-(--border) px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-(--text-muted) transition hover:text-(--text-primary)'
                disabled={pendingAction !== null}
              >
                Unpublish
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
                  <p className='text-xs text-(--text-muted)'>
                    Title and slug control navigation, routing, and SEO.
                  </p>
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
                  <p className='text-xs text-(--text-muted)'>
                    Add, reorder, and customize sections for this page.
                  </p>
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
                      handleDestructiveAction(
                        () => blocksFieldArray.remove(index),
                        'Delete this content block?',
                      )
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

            <SeoPanel onPickMedia={handleMediaPickerOpen} />

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
                      <strong>seo</strong> populates the SEO fields and preview snippet.
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

function InputField({
  name,
  label,
  placeholder,
}: {
  name: string
  label: string
  placeholder?: string
}) {
  const {
    register,
    formState: { errors },
  } = useFormContext<PageFormValues>()
  const fieldError = name
    .split('.')
    .reduce((acc, key) => (acc ? (acc as Record<string, unknown>)[key] : null), errors as unknown)
  const message = (fieldError as { message?: string } | null)?.message
  return (
    <label className='text-sm text-(--text-muted)'>
      <span className='text-xs font-semibold uppercase tracking-[0.2em]'>{label}</span>
      <input
        {...register(name as never)}
        placeholder={placeholder}
        className='mt-2 w-full rounded-xl border border-(--border) bg-(--surface-muted) px-3 py-2 text-sm text-(--text-primary) placeholder:text-(--text-muted) focus:border-(--brand-accent) focus:outline-none'
      />
      {message && <span className='mt-1 block text-xs text-amber-700'>{message}</span>}
    </label>
  )
}

function BlockCard({
  index,
  blockType,
  onMoveUp,
  onMoveDown,
  onRemove,
  canMoveUp,
  canMoveDown,
  onPickMedia,
}: {
  index: number
  blockType: ContentBlock['type']
  onMoveUp: () => void
  onMoveDown: () => void
  onRemove: () => void
  canMoveUp: boolean
  canMoveDown: boolean
  onPickMedia: (path: string) => void
}) {
  return (
    <div className='rounded-2xl border border-(--border) bg-white p-5 shadow-sm'>
      <div className='flex flex-wrap items-center justify-between gap-4'>
        <div>
          <p className='text-xs font-semibold uppercase tracking-[0.3em] text-(--text-muted)'>
            {blockLabels[blockType]}
          </p>
          <p className='text-xs text-(--text-muted)'>{blockDescriptions[blockType]}</p>
        </div>
        <div className='flex items-center gap-2'>
          <button
            type='button'
            onClick={onMoveUp}
            disabled={!canMoveUp}
            className='rounded-full border border-(--border) p-2 text-(--text-muted) disabled:opacity-40'
            aria-label='Move block up'
          >
            <ChevronUp className='h-3.5 w-3.5' aria-hidden />
          </button>
          <button
            type='button'
            onClick={onMoveDown}
            disabled={!canMoveDown}
            className='rounded-full border border-(--border) p-2 text-(--text-muted) disabled:opacity-40'
            aria-label='Move block down'
          >
            <ChevronDown className='h-3.5 w-3.5' aria-hidden />
          </button>
          <button
            type='button'
            onClick={onRemove}
            className='rounded-full border border-(--border) p-2 text-(--text-muted) hover:text-rose-500'
            aria-label='Delete block'
          >
            <Trash2 className='h-3.5 w-3.5' aria-hidden />
          </button>
        </div>
      </div>

      <div className='mt-5'>
        {blockType === 'hero' && <HeroBlockEditor index={index} onPickMedia={onPickMedia} />}
        {blockType === 'rich_text' && <RichTextBlockEditor index={index} />}
        {blockType === 'feature_grid' && <FeatureGridBlockEditor index={index} />}
        {blockType === 'testimonials' && <TestimonialsBlockEditor index={index} onPickMedia={onPickMedia} />}
        {blockType === 'gallery' && <GalleryBlockEditor index={index} onPickMedia={onPickMedia} />}
        {blockType === 'cta_band' && <CtaBandBlockEditor index={index} />}
      </div>
    </div>
  )
}

function HeroBlockEditor({ index, onPickMedia }: { index: number; onPickMedia: (path: string) => void }) {
  const { register, watch } = useFormContext<PageFormValues>()
  const imageValue = watch(`blocks.${index}.backgroundImage`)

  return (
    <div className='grid gap-4 lg:grid-cols-[1.2fr_0.8fr]'>
      <div className='space-y-4'>
        <InputField name={`blocks.${index}.title`} label='Headline' placeholder='Headline' />
        <label className='text-sm text-(--text-muted)'>
          <span className='text-xs font-semibold uppercase tracking-[0.2em]'>Subtitle</span>
          <textarea
            {...register(`blocks.${index}.subtitle`)}
            rows={3}
            className='mt-2 w-full rounded-xl border border-(--border) bg-(--surface-muted) px-3 py-2 text-sm text-(--text-primary) placeholder:text-(--text-muted) focus:border-(--brand-accent) focus:outline-none'
            placeholder='Supportive copy for the hero.'
          />
        </label>
        <div className='grid gap-4 sm:grid-cols-2'>
          <InputField name={`blocks.${index}.ctaText`} label='CTA text' placeholder='Book demo' />
          <InputField name={`blocks.${index}.ctaLink`} label='CTA link' placeholder='/contact' />
        </div>
      </div>
      <div className='rounded-xl border border-dashed border-(--border) bg-(--surface-muted) p-4'>
        <div className='flex items-center justify-between'>
          <p className='text-xs font-semibold uppercase tracking-[0.2em] text-(--text-muted)'>Background</p>
          <button
            type='button'
            onClick={() => onPickMedia(`blocks.${index}.backgroundImage`)}
            className='rounded-full bg-(--brand-accent) px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-white'
          >
            Choose image
          </button>
        </div>
        {imageValue ? (
          <img src={imageValue} alt='Hero background' className='mt-4 h-40 w-full rounded-lg object-cover' />
        ) : (
          <div className='mt-4 flex h-40 items-center justify-center rounded-lg border border-dashed border-(--border) text-xs text-(--text-muted)'>
            No image selected
          </div>
        )}
        <input type='hidden' {...register(`blocks.${index}.backgroundImage`)} />
      </div>
    </div>
  )
}

function RichTextBlockEditor({ index }: { index: number }) {
  const { register, setValue, getValues } = useFormContext<PageFormValues>()
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)
  const { ref: contentRef, ...contentField } = register(`blocks.${index}.content`)

  const insertSnippet = (prefix: string, suffix = '') => {
    const textarea = textareaRef.current
    if (!textarea) return
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const currentValue = getValues(`blocks.${index}.content`) ?? ''
    const nextValue =
      currentValue.substring(0, start) + prefix + currentValue.substring(start, end) + suffix + currentValue.substring(end)
    setValue(`blocks.${index}.content`, nextValue, { shouldDirty: true })
    window.requestAnimationFrame(() => {
      textarea.focus()
      textarea.setSelectionRange(start + prefix.length, end + prefix.length)
    })
  }

  return (
    <div>
      <div className='flex flex-wrap gap-2'>
        <button
          type='button'
          onClick={() => insertSnippet('### ')}
          className='rounded-full border border-(--border) px-3 py-1 text-xs text-(--text-muted)'
        >
          Heading
        </button>
        <button
          type='button'
          onClick={() => insertSnippet('**', '**')}
          className='rounded-full border border-(--border) px-3 py-1 text-xs text-(--text-muted)'
        >
          Bold
        </button>
        <button
          type='button'
          onClick={() => insertSnippet('- ')}
          className='rounded-full border border-(--border) px-3 py-1 text-xs text-(--text-muted)'
        >
          List
        </button>
        <button
          type='button'
          onClick={() => insertSnippet('[link text](', ')')}
          className='rounded-full border border-(--border) px-3 py-1 text-xs text-(--text-muted)'
        >
          Link
        </button>
      </div>
      <textarea
        {...contentField}
        ref={(element) => {
          contentRef(element)
          textareaRef.current = element
        }}
        rows={6}
        className='mt-3 w-full rounded-xl border border-(--border) bg-(--surface-muted) px-3 py-2 text-sm text-(--text-primary) placeholder:text-(--text-muted) focus:border-(--brand-accent) focus:outline-none'
        placeholder='Write using Markdown-like formatting...'
      />
      <p className='mt-2 text-xs text-(--text-muted)'>
        Supports headings, bold, lists, and links. Content renders as rich text on the site.
      </p>
    </div>
  )
}

function FeatureGridBlockEditor({ index }: { index: number }) {
  const { control, register } = useFormContext<PageFormValues>()
  const itemsFieldArray = useFieldArray({ control, name: `blocks.${index}.items` })

  return (
    <div className='space-y-4'>
      {itemsFieldArray.fields.map((item, itemIndex) => (
        <div key={item.id} className='rounded-xl border border-(--border) bg-(--surface-muted) p-4'>
          <div className='flex items-center justify-between'>
            <p className='text-xs font-semibold uppercase tracking-[0.2em] text-(--text-muted)'>
              Feature {itemIndex + 1}
            </p>
            <button
              type='button'
              onClick={() => itemsFieldArray.remove(itemIndex)}
              className='text-xs text-rose-500'
            >
              Remove
            </button>
          </div>
          <div className='mt-3 grid gap-3 sm:grid-cols-2'>
            <InputField name={`blocks.${index}.items.${itemIndex}.icon`} label='Icon' placeholder='Sparkles' />
            <InputField name={`blocks.${index}.items.${itemIndex}.title`} label='Title' placeholder='Feature title' />
          </div>
          <label className='mt-3 block text-sm text-(--text-muted)'>
            <span className='text-xs font-semibold uppercase tracking-[0.2em]'>Description</span>
            <textarea
              {...register(`blocks.${index}.items.${itemIndex}.description`)}
              rows={3}
              className='mt-2 w-full rounded-xl border border-(--border) bg-(--surface-base) px-3 py-2 text-sm text-(--text-primary)'
              placeholder='Describe the feature.'
            />
          </label>
        </div>
      ))}
      <button
        type='button'
        onClick={() =>
          itemsFieldArray.append({
            id: createId(),
            icon: 'Sparkles',
            title: 'New feature',
            description: 'Describe the outcome for your users.',
          })
        }
        className='inline-flex items-center gap-2 rounded-full border border-(--border) px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-(--text-muted)'
      >
        <Plus className='h-3.5 w-3.5' aria-hidden />
        Add feature
      </button>
    </div>
  )
}

function TestimonialsBlockEditor({
  index,
  onPickMedia,
}: {
  index: number
  onPickMedia: (path: string) => void
}) {
  const { control, register, watch } = useFormContext<PageFormValues>()
  const itemsFieldArray = useFieldArray({ control, name: `blocks.${index}.items` })

  return (
    <div className='space-y-4'>
      {itemsFieldArray.fields.map((item, itemIndex) => {
        const imageValue = watch(`blocks.${index}.items.${itemIndex}.photo`)
        return (
          <div key={item.id} className='rounded-xl border border-(--border) bg-(--surface-muted) p-4'>
            <div className='flex items-center justify-between'>
              <p className='text-xs font-semibold uppercase tracking-[0.2em] text-(--text-muted)'>
                Testimonial {itemIndex + 1}
              </p>
              <button
                type='button'
                onClick={() => itemsFieldArray.remove(itemIndex)}
                className='text-xs text-rose-500'
              >
                Remove
              </button>
            </div>
            <div className='mt-3 grid gap-3 sm:grid-cols-2'>
              <InputField name={`blocks.${index}.items.${itemIndex}.name`} label='Name' placeholder='Name' />
              <InputField name={`blocks.${index}.items.${itemIndex}.role`} label='Role' placeholder='Role' />
            </div>
            <label className='mt-3 block text-sm text-(--text-muted)'>
              <span className='text-xs font-semibold uppercase tracking-[0.2em]'>Quote</span>
              <textarea
                {...register(`blocks.${index}.items.${itemIndex}.quote`)}
                rows={3}
                className='mt-2 w-full rounded-xl border border-(--border) bg-(--surface-base) px-3 py-2 text-sm text-(--text-primary)'
                placeholder='Quote text'
              />
            </label>
            <div className='mt-3 rounded-xl border border-dashed border-(--border) bg-(--surface-base) p-3'>
              <div className='flex items-center justify-between'>
                <p className='text-xs font-semibold uppercase tracking-[0.2em] text-(--text-muted)'>Photo</p>
                <button
                  type='button'
                  onClick={() => onPickMedia(`blocks.${index}.items.${itemIndex}.photo`)}
                  className='rounded-full bg-(--brand-accent) px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-white'
                >
                  Choose image
                </button>
              </div>
              {imageValue ? (
                <img src={imageValue} alt='Testimonial' className='mt-3 h-28 w-full rounded-lg object-cover' />
              ) : (
                <div className='mt-3 flex h-28 items-center justify-center rounded-lg border border-dashed border-(--border) text-xs text-(--text-muted)'>
                  No image selected
                </div>
              )}
            </div>
          </div>
        )
      })}
      <button
        type='button'
        onClick={() =>
          itemsFieldArray.append({
            id: createId(),
            name: 'Customer name',
            role: 'Role or company',
            photo: '',
            quote: 'Short testimonial about the impact.',
          })
        }
        className='inline-flex items-center gap-2 rounded-full border border-(--border) px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-(--text-muted)'
      >
        <Plus className='h-3.5 w-3.5' aria-hidden />
        Add testimonial
      </button>
    </div>
  )
}

function GalleryBlockEditor({
  index,
  onPickMedia,
}: {
  index: number
  onPickMedia: (path: string) => void
}) {
  const { control, register, watch } = useFormContext<PageFormValues>()
  const itemsFieldArray = useFieldArray({ control, name: `blocks.${index}.items` })

  return (
    <div className='space-y-4'>
      {itemsFieldArray.fields.map((item, itemIndex) => {
        const imageValue = watch(`blocks.${index}.items.${itemIndex}.image`)
        return (
          <div key={item.id} className='rounded-xl border border-(--border) bg-(--surface-muted) p-4'>
            <div className='flex items-center justify-between'>
              <p className='text-xs font-semibold uppercase tracking-[0.2em] text-(--text-muted)'>
                Image {itemIndex + 1}
              </p>
              <button
                type='button'
                onClick={() => itemsFieldArray.remove(itemIndex)}
                className='text-xs text-rose-500'
              >
                Remove
              </button>
            </div>
            <div className='mt-3 rounded-xl border border-dashed border-(--border) bg-(--surface-base) p-3'>
              <div className='flex items-center justify-between'>
                <p className='text-xs font-semibold uppercase tracking-[0.2em] text-(--text-muted)'>Image</p>
                <button
                  type='button'
                  onClick={() => onPickMedia(`blocks.${index}.items.${itemIndex}.image`)}
                  className='rounded-full bg-(--brand-accent) px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-white'
                >
                  Choose image
                </button>
              </div>
              {imageValue ? (
                <img src={imageValue} alt='Gallery' className='mt-3 h-32 w-full rounded-lg object-cover' />
              ) : (
                <div className='mt-3 flex h-32 items-center justify-center rounded-lg border border-dashed border-(--border) text-xs text-(--text-muted)'>
                  No image selected
                </div>
              )}
            </div>
            <label className='mt-3 block text-sm text-(--text-muted)'>
              <span className='text-xs font-semibold uppercase tracking-[0.2em]'>Caption</span>
              <input
                {...register(`blocks.${index}.items.${itemIndex}.caption`)}
                className='mt-2 w-full rounded-xl border border-(--border) bg-(--surface-base) px-3 py-2 text-sm text-(--text-primary)'
                placeholder='Caption'
              />
            </label>
          </div>
        )
      })}
      <button
        type='button'
        onClick={() =>
          itemsFieldArray.append({
            id: createId(),
            image: '',
            caption: 'Caption',
          })
        }
        className='inline-flex items-center gap-2 rounded-full border border-(--border) px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-(--text-muted)'
      >
        <Plus className='h-3.5 w-3.5' aria-hidden />
        Add image
      </button>
    </div>
  )
}

function CtaBandBlockEditor({ index }: { index: number }) {
  return (
    <div className='grid gap-4 lg:grid-cols-2'>
      <InputField name={`blocks.${index}.text`} label='CTA text' placeholder='Ready to start?' />
      <InputField name={`blocks.${index}.buttonText`} label='Button text' placeholder='Request demo' />
      <InputField name={`blocks.${index}.buttonLink`} label='Button link' placeholder='/contact' />
    </div>
  )
}

function SeoPanel({ onPickMedia }: { onPickMedia: (path: string) => void }) {
  const { watch } = useFormContext<PageFormValues>()
  const metaTitle = watch('seo.metaTitle')
  const metaDescription = watch('seo.metaDescription')
  const slug = watch('slug')
  const ogImage = watch('seo.ogImage')

  return (
    <div className='rounded-2xl border border-(--border) bg-(--surface-base) p-6 shadow-sm'>
      <div className='flex flex-wrap items-center justify-between gap-4'>
        <div>
          <h3 className='text-lg font-semibold'>SEO settings</h3>
          <p className='text-xs text-(--text-muted)'>Control how this page appears on search engines.</p>
        </div>
        <button
          type='button'
          onClick={() => onPickMedia('seo.ogImage')}
          className='rounded-full border border-(--border) px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-(--text-muted)'
        >
          Pick OG image
        </button>
      </div>
      <div className='mt-4 grid gap-4 lg:grid-cols-2'>
        <InputField name='seo.metaTitle' label='Meta title' placeholder='Meta title' />
        <InputField name='seo.metaDescription' label='Meta description' placeholder='Meta description' />
        <InputField name='seo.canonical' label='Canonical URL' placeholder='https://npip.ai/page' />
        <InputField name='seo.ogImage' label='OG image URL' placeholder='https://...' />
      </div>
      <div className='mt-6 rounded-2xl border border-(--border) bg-(--surface-muted) p-4'>
        <p className='text-xs font-semibold uppercase tracking-[0.25em] text-(--text-muted)'>Preview</p>
        <div className='mt-3 space-y-1'>
          <p className='text-sm font-semibold text-blue-700'>{metaTitle || 'Meta title preview'}</p>
          <p className='text-xs text-green-700'>https://npip.ai/{slug || 'slug'}</p>
          <p className='text-xs text-(--text-muted)'>
            {metaDescription || 'Meta description preview goes here.'}
          </p>
        </div>
        {ogImage && (
          <img src={ogImage} alt='Open Graph preview' className='mt-3 h-32 w-full rounded-xl object-cover' />
        )}
      </div>
    </div>
  )
}

