
import { useEffect, useMemo, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import {
  BarChart3,
  Bell,
  ChevronDown,
  ChevronLeft,
  ChevronUp,
  FileText,
  Image as ImageIcon,
  LayoutDashboard,
  LogOut,
  Menu,
  Plus,
  Search,
  Settings,
  Sparkles,
  Trash2,
  Users,
} from 'lucide-react'
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

type AdminSection = 'pages' | 'media' | 'seo' | 'settings' | 'analytics' | 'users'

type Toast = {
  id: string
  title: string
  message?: string
  tone: 'success' | 'error' | 'info'
}

const sectionItems: Array<{ id: AdminSection; label: string; icon: typeof LayoutDashboard }> = [
  { id: 'pages', label: 'Pages', icon: FileText },
  { id: 'media', label: 'Media', icon: ImageIcon },
  { id: 'seo', label: 'SEO', icon: Sparkles },
  { id: 'users', label: 'Users', icon: Users },
  { id: 'settings', label: 'Settings', icon: Settings },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
]

const sidebarPrimaryNav = [
  { label: 'Dashboard', icon: LayoutDashboard },
  { label: 'Pages', icon: FileText },
  { label: 'Products/Services', icon: Sparkles },
  { label: 'Blog', icon: FileText },
  { label: 'Media', icon: ImageIcon },
  { label: 'SEO', icon: Sparkles },
  { label: 'Users', icon: Users },
  { label: 'Settings', icon: Settings },
  { label: 'Analytics', icon: BarChart3 },
]

const blockLabels: Record<ContentBlock['type'], string> = {
  hero: 'Hero',
  rich_text: 'Rich text',
  feature_grid: 'Feature grid',
  testimonials: 'Testimonials',
  gallery: 'Gallery',
  cta_band: 'CTA band',
}

const blockDescriptions: Record<ContentBlock['type'], string> = {
  hero: 'Primary headline, subtitle, CTA, and background visual.',
  rich_text: 'Flexible body copy with headings, lists, and links.',
  feature_grid: 'Grid of value props with icons and descriptions.',
  testimonials: 'Quotes from customers or partners.',
  gallery: 'Visual gallery with captions.',
  cta_band: 'Bold call-to-action strip.',
}

const createId = () =>
  (typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `id-${Date.now()}-${Math.random().toString(16).slice(2)}`)

const formatDateTime = (value?: string) => {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleString()
}

const buildPageDefaults = (page?: AdminPage | null): PageFormValues => ({
  title: page?.title ?? '',
  slug: page?.slug ?? '',
  status: page?.status ?? 'draft',
  seo: {
    metaTitle: page?.seo?.metaTitle ?? '',
    metaDescription: page?.seo?.metaDescription ?? '',
    slug: page?.seo?.slug ?? page?.slug ?? '',
    canonical: page?.seo?.canonical ?? '',
    ogImage: page?.seo?.ogImage ?? '',
  },
  blocks: page?.blocks ?? [
    {
      id: createId(),
      type: 'hero',
      title: '',
      subtitle: '',
      ctaText: '',
      ctaLink: '',
      backgroundImage: '',
    },
  ],
})

const createBlockDefaults = (type: ContentBlock['type']): ContentBlock => {
  switch (type) {
    case 'hero':
      return {
        id: createId(),
        type: 'hero',
        title: 'New hero headline',
        subtitle: 'Add supporting copy that explains the value.',
        ctaText: 'Get started',
        ctaLink: '/contact',
        backgroundImage: '',
      }
    case 'rich_text':
      return {
        id: createId(),
        type: 'rich_text',
        content: '### New section\n\nAdd your copy here.',
      }
    case 'feature_grid':
      return {
        id: createId(),
        type: 'feature_grid',
        items: [
          {
            id: createId(),
            icon: 'Sparkles',
            title: 'Feature title',
            description: 'Describe the outcome for your users.',
          },
        ],
      }
    case 'testimonials':
      return {
        id: createId(),
        type: 'testimonials',
        items: [
          {
            id: createId(),
            name: 'Customer name',
            role: 'Role or company',
            photo: '',
            quote: 'Short testimonial about the impact.',
          },
        ],
      }
    case 'gallery':
      return {
        id: createId(),
        type: 'gallery',
        items: [
          {
            id: createId(),
            image: '',
            caption: 'Describe what the image shows.',
          },
        ],
      }
    case 'cta_band':
      return {
        id: createId(),
        type: 'cta_band',
        text: 'Ready to start?',
        buttonText: 'Request demo',
        buttonLink: '/contact',
      }
    default:
      return {
        id: createId(),
        type: 'rich_text',
        content: '',
      }
  }
}


export default function AdminCMSPage() {
  const { user, logout } = useAuth()
  const [activeSection, setActiveSection] = useState<AdminSection>('pages')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [toasts, setToasts] = useState<Toast[]>([])
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

  const pushToast = (toast: Omit<Toast, 'id'>) => {
    const id = createId()
    setToasts((prev) => [...prev, { ...toast, id }])
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((item) => item.id !== id))
    }, 3500)
  }

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

function AdminSidebar({
  activeSection,
  onSectionChange,
  sidebarOpen,
  onClose,
  brandName,
  tagline,
}: {
  activeSection: AdminSection
  onSectionChange: (section: AdminSection) => void
  sidebarOpen: boolean
  onClose: () => void
  brandName?: string
  tagline?: string
}) {
  return (
    <aside
      className={`fixed inset-y-0 left-0 z-40 w-72 transform border-r border-(--border) bg-(--surface-base) shadow-lg transition-transform duration-200 lg:translate-x-0 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}
      aria-label='Admin sidebar'
    >
      <div className='flex h-full flex-col'>
        <div className='flex items-center justify-between border-b border-(--divider) px-6 py-5'>
          <div>
            <p className='text-xs font-semibold uppercase tracking-[0.3em] text-(--text-muted)'>Admin CMS</p>
            <h1 className='text-lg font-semibold'>{brandName ? `${brandName} Content Studio` : 'Content Studio'}</h1>
            {tagline && <p className='mt-1 text-xs text-(--text-muted)'>{tagline}</p>}
          </div>
          <button
            type='button'
            onClick={onClose}
            className='rounded-full border border-(--border) p-2 text-(--text-muted) hover:text-(--text-primary) lg:hidden'
            aria-label='Close sidebar'
          >
            <ChevronLeft className='h-4 w-4' aria-hidden />
          </button>
        </div>

        <div className='flex-1 overflow-y-auto px-4 py-6'>
          <p className='px-2 text-[11px] font-semibold uppercase tracking-[0.3em] text-(--text-muted)'>
            Navigation
          </p>
          <nav className='mt-4 space-y-1'>
            {sidebarPrimaryNav.map((item) => (
              <div
                key={item.label}
                className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition ${
                  item.label.toLowerCase() === activeSection
                    ? 'bg-(--surface-muted) text-(--text-primary)'
                    : 'text-(--text-muted) hover:text-(--text-primary)'
                }`}
              >
                <item.icon className='h-4 w-4' aria-hidden />
                <span>{item.label}</span>
              </div>
            ))}
          </nav>

          <div className='mt-8'>
            <p className='px-2 text-[11px] font-semibold uppercase tracking-[0.3em] text-(--text-muted)'>
              CMS workspace
            </p>
            <div className='mt-3 space-y-1'>
              {sectionItems.map((item) => {
                const isActive = activeSection === item.id
                return (
                  <button
                    key={item.id}
                    type='button'
                    onClick={() => onSectionChange(item.id)}
                    className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm transition ${
                      isActive
                        ? 'bg-(--brand-accent) text-white shadow-sm'
                        : 'text-(--text-muted) hover:bg-(--surface-muted) hover:text-(--text-primary)'
                    }`}
                  >
                    <item.icon className='h-4 w-4' aria-hidden />
                    <span>{item.label}</span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        <div className='border-t border-(--divider) px-4 py-4 text-xs text-(--text-muted)'>
          <p className='font-semibold uppercase tracking-[0.25em]'>Version</p>
          <p className='mt-2'>CMS build 1.0.0</p>
        </div>
      </div>
    </aside>
  )
}

function AdminTopbar({
  userName,
  searchTerm,
  onSearchChange,
  onToggleSidebar,
  onPreview,
  onLogout,
  brandName,
}: {
  userName: string
  searchTerm: string
  onSearchChange: (value: string) => void
  onToggleSidebar: () => void
  onPreview: () => void
  onLogout: () => void
  brandName?: string
}) {
  return (
    <header className='sticky top-0 z-30 border-b border-(--divider) bg-(--surface-base)/90 px-4 py-4 backdrop-blur sm:px-6 lg:px-8'>
      <div className='flex flex-wrap items-center justify-between gap-4'>
        <div className='flex items-center gap-3'>
          <button
            type='button'
            onClick={onToggleSidebar}
            className='rounded-full border border-(--border) p-2 text-(--text-muted) hover:text-(--text-primary) lg:hidden'
            aria-label='Open sidebar'
          >
            <Menu className='h-4 w-4' aria-hidden />
          </button>
          <div>
            <p className='text-xs font-semibold uppercase tracking-[0.3em] text-(--text-muted)'>Content Studio</p>
            <h2 className='text-lg font-semibold'>{brandName ? `${brandName} Admin CMS` : 'Admin CMS'}</h2>
          </div>
        </div>

        <div className='flex flex-1 items-center gap-3 md:justify-center'>
          <div className='relative w-full max-w-md'>
            <Search className='pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-(--text-muted)' />
            <input
              value={searchTerm}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder='Search pages, blocks, keywords...'
              className='w-full rounded-full border border-(--border) bg-(--surface-muted) py-2 pl-9 pr-3 text-sm text-(--text-primary) placeholder:text-(--text-muted) focus:border-(--brand-accent) focus:outline-none'
            />
          </div>
        </div>

        <div className='flex items-center gap-3'>
          <button
            type='button'
            onClick={onPreview}
            className='hidden rounded-full bg-(--brand-accent) px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-white shadow-sm transition hover:opacity-90 sm:inline-flex'
          >
            Preview site
          </button>

          <button
            type='button'
            className='relative rounded-full border border-(--border) p-2 text-(--text-muted) hover:text-(--text-primary)'
            aria-label='Notifications'
          >
            <Bell className='h-4 w-4' aria-hidden />
            <span className='absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-(--brand-accent) text-[10px] font-semibold text-white'>
              3
            </span>
          </button>

          <div className='flex items-center gap-2 rounded-full border border-(--border) bg-(--surface-muted) px-3 py-2 text-xs font-semibold text-(--text-muted)'>
            <span>{userName}</span>
            <ChevronDown className='h-3 w-3' aria-hidden />
          </div>

          <button
            type='button'
            onClick={onLogout}
            className='hidden rounded-full border border-(--border) px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-(--text-muted) transition hover:text-(--text-primary) md:inline-flex'
          >
            <LogOut className='h-3.5 w-3.5' aria-hidden />
            <span className='ml-2'>Sign out</span>
          </button>
        </div>
      </div>
    </header>
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
  pushToast: (toast: Omit<Toast, 'id'>) => void
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

function MediaModal({
  isOpen,
  onClose,
  mediaLibrary,
  loading,
  onSelect,
  onUploadMedia,
  onDeleteMedia,
  pushToast,
}: {
  isOpen: boolean
  onClose: () => void
  mediaLibrary: MediaItem[]
  loading: boolean
  onSelect: (media: MediaItem) => void
  onUploadMedia: (payload: { file: File; title?: string; alt?: string }) => Promise<MediaItem>
  onDeleteMedia: (mediaId: string) => Promise<void>
  pushToast: (toast: Omit<Toast, 'id'>) => void
}) {
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

function MediaLibraryPanel({
  mediaLibrary,
  loading,
  onUploadMedia,
  onDeleteMedia,
  onSelect,
  pushToast,
  inline = false,
}: {
  mediaLibrary: MediaItem[]
  loading: boolean
  onUploadMedia: (payload: { file: File; title?: string; alt?: string }) => Promise<MediaItem>
  onDeleteMedia: (mediaId: string) => Promise<void>
  onSelect?: (media: MediaItem) => void
  pushToast: (toast: Omit<Toast, 'id'>) => void
  inline?: boolean
}) {
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

function ToastStack({ toasts }: { toasts: Toast[] }) {
  return (
    <div className='fixed bottom-6 right-6 z-50 space-y-3'>
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`w-72 rounded-2xl border border-(--border) bg-(--surface-base) p-4 shadow-lg ${
            toast.tone === 'success'
              ? 'border-emerald-200'
              : toast.tone === 'error'
                ? 'border-rose-200'
                : 'border-blue-200'
          }`}
          role='alert'
        >
          <p className='text-sm font-semibold text-(--text-primary)'>{toast.title}</p>
          {toast.message && <p className='mt-1 text-xs text-(--text-muted)'>{toast.message}</p>}
        </div>
      ))}
    </div>
  )
}

function SettingsPanel({
  settings,
  loading,
  saving,
  onSave,
  pushToast,
}: {
  settings?: {
    brandName: string
    tagline: string
    logoUrl: string
    footerText: string
    accentColor: string
    footerLinks: Array<{ title: string; href: string }>
    socialLinks: Array<{ label: string; href: string }>
  }
  loading: boolean
  saving: boolean
  onSave: (payload: {
    brandName: string
    tagline: string
    logoUrl: string
    footerText: string
    accentColor: string
    footerLinks: Array<{ title: string; href: string }>
    socialLinks: Array<{ label: string; href: string }>
  }) => Promise<unknown>
  pushToast: (toast: Omit<Toast, 'id'>) => void
}) {
  const [formState, setFormState] = useState({
    brandName: settings?.brandName || '',
    tagline: settings?.tagline || '',
    logoUrl: settings?.logoUrl || '',
    footerText: settings?.footerText || '',
    accentColor: settings?.accentColor || '',
    footerLinks: settings?.footerLinks || [],
    socialLinks: settings?.socialLinks || [],
  })

  useEffect(() => {
    if (!settings) return
    setFormState({
      brandName: settings.brandName || '',
      tagline: settings.tagline || '',
      logoUrl: settings.logoUrl || '',
      footerText: settings.footerText || '',
      accentColor: settings.accentColor || '',
      footerLinks: settings.footerLinks || [],
      socialLinks: settings.socialLinks || [],
    })
  }, [settings])

  const handleChange = (key: keyof typeof formState, value: string) => {
    setFormState((prev) => ({ ...prev, [key]: value }))
  }

  const updateFooterLink = (index: number, key: 'title' | 'href', value: string) => {
    setFormState((prev) => ({
      ...prev,
      footerLinks: prev.footerLinks.map((item, i) => (i === index ? { ...item, [key]: value } : item)),
    }))
  }

  const updateSocialLink = (index: number, key: 'label' | 'href', value: string) => {
    setFormState((prev) => ({
      ...prev,
      socialLinks: prev.socialLinks.map((item, i) => (i === index ? { ...item, [key]: value } : item)),
    }))
  }

  const addFooterLink = () => {
    setFormState((prev) => ({
      ...prev,
      footerLinks: [...prev.footerLinks, { title: 'Link', href: '/' }],
    }))
  }

  const addSocialLink = () => {
    setFormState((prev) => ({
      ...prev,
      socialLinks: [...prev.socialLinks, { label: 'X', href: 'https://x.com' }],
    }))
  }

  const handleSubmit = async () => {
    try {
      await onSave(formState)
      pushToast({ title: 'Settings saved', tone: 'success' })
    } catch (error) {
      pushToast({
        title: 'Failed to save settings',
        message: error instanceof Error ? error.message : 'Something went wrong.',
        tone: 'error',
      })
    }
  }

  return (
    <div className='space-y-6'>
      <div className='rounded-2xl border border-(--border) bg-(--surface-base) p-6 shadow-sm'>
        <div className='flex items-center justify-between'>
          <div>
            <p className='text-xs font-semibold uppercase tracking-[0.3em] text-(--text-muted)'>Brand</p>
            <h2 className='text-xl font-semibold'>Site settings</h2>
          </div>
          <button
            type='button'
            onClick={handleSubmit}
            disabled={saving}
            className='rounded-full bg-(--brand-accent) px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white'
          >
            {saving ? 'Saving...' : 'Save settings'}
          </button>
        </div>
        {loading ? (
          <div className='mt-6 grid gap-4 lg:grid-cols-2'>
            {[0, 1, 2, 3].map((item) => (
              <div key={item} className='h-12 animate-pulse rounded-xl bg-(--surface-muted)' />
            ))}
          </div>
        ) : (
          <div className='mt-6 grid gap-4 lg:grid-cols-2'>
            <label className='text-sm text-(--text-muted)'>
              <span className='text-xs font-semibold uppercase tracking-[0.2em]'>Brand name</span>
              <input
                value={formState.brandName}
                onChange={(event) => handleChange('brandName', event.target.value)}
                className='mt-2 w-full rounded-xl border border-(--border) bg-(--surface-muted) px-3 py-2 text-sm'
              />
            </label>
            <label className='text-sm text-(--text-muted)'>
              <span className='text-xs font-semibold uppercase tracking-[0.2em]'>Tagline</span>
              <input
                value={formState.tagline}
                onChange={(event) => handleChange('tagline', event.target.value)}
                className='mt-2 w-full rounded-xl border border-(--border) bg-(--surface-muted) px-3 py-2 text-sm'
              />
            </label>
            <label className='text-sm text-(--text-muted)'>
              <span className='text-xs font-semibold uppercase tracking-[0.2em]'>Logo URL</span>
              <input
                value={formState.logoUrl}
                onChange={(event) => handleChange('logoUrl', event.target.value)}
                className='mt-2 w-full rounded-xl border border-(--border) bg-(--surface-muted) px-3 py-2 text-sm'
                placeholder='https://...'
              />
            </label>
            <label className='text-sm text-(--text-muted)'>
              <span className='text-xs font-semibold uppercase tracking-[0.2em]'>Accent color</span>
              <input
                value={formState.accentColor}
                onChange={(event) => handleChange('accentColor', event.target.value)}
                className='mt-2 w-full rounded-xl border border-(--border) bg-(--surface-muted) px-3 py-2 text-sm'
                placeholder='#d86b2c'
              />
            </label>
            <label className='text-sm text-(--text-muted) lg:col-span-2'>
              <span className='text-xs font-semibold uppercase tracking-[0.2em]'>Footer text</span>
              <textarea
                value={formState.footerText}
                onChange={(event) => handleChange('footerText', event.target.value)}
                rows={3}
                className='mt-2 w-full rounded-xl border border-(--border) bg-(--surface-muted) px-3 py-2 text-sm'
              />
            </label>
            <div className='lg:col-span-2'>
              <div className='flex items-center justify-between'>
                <p className='text-xs font-semibold uppercase tracking-[0.2em] text-(--text-muted)'>Footer links</p>
                <button
                  type='button'
                  onClick={addFooterLink}
                  className='text-xs font-semibold text-(--brand-accent)'
                >
                  Add link
                </button>
              </div>
              <div className='mt-3 space-y-3'>
                {formState.footerLinks.map((link, index) => (
                  <div key={`footer-${index}`} className='grid gap-2 sm:grid-cols-2'>
                    <input
                      value={link.title}
                      onChange={(event) => updateFooterLink(index, 'title', event.target.value)}
                      className='rounded-xl border border-(--border) bg-(--surface-muted) px-3 py-2 text-sm'
                      placeholder='Title'
                    />
                    <input
                      value={link.href}
                      onChange={(event) => updateFooterLink(index, 'href', event.target.value)}
                      className='rounded-xl border border-(--border) bg-(--surface-muted) px-3 py-2 text-sm'
                      placeholder='/path'
                    />
                  </div>
                ))}
              </div>
            </div>
            <div className='lg:col-span-2'>
              <div className='flex items-center justify-between'>
                <p className='text-xs font-semibold uppercase tracking-[0.2em] text-(--text-muted)'>Social links</p>
                <button
                  type='button'
                  onClick={addSocialLink}
                  className='text-xs font-semibold text-(--brand-accent)'
                >
                  Add social
                </button>
              </div>
              <div className='mt-3 space-y-3'>
                {formState.socialLinks.map((link, index) => (
                  <div key={`social-${index}`} className='grid gap-2 sm:grid-cols-2'>
                    <input
                      value={link.label}
                      onChange={(event) => updateSocialLink(index, 'label', event.target.value)}
                      className='rounded-xl border border-(--border) bg-(--surface-muted) px-3 py-2 text-sm'
                      placeholder='Label (X, LinkedIn)'
                    />
                    <input
                      value={link.href}
                      onChange={(event) => updateSocialLink(index, 'href', event.target.value)}
                      className='rounded-xl border border-(--border) bg-(--surface-muted) px-3 py-2 text-sm'
                      placeholder='https://'
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

