
import { useEffect, useMemo, useState } from 'react'
import type { CSSProperties } from 'react'
import type { PageStatus } from '../features/adminCms/types'
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
import SettingsPanel from '../features/adminCms/components/SettingsPanel'
import ToastStack from '../features/adminCms/components/ToastStack'
import PageListCard from '../features/adminCms/components/PageListCard'
import PageEditor from '../features/adminCms/components/PageEditor'
import { useToasts } from '../features/adminCms/useToasts'
import type { AdminSection } from '../features/adminCms/uiTypes'



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
