import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { AdminPage, AdminPageSummary, MediaItem, PageUpdatePayload } from './types'
import {
  deleteAdminMedia,
  getAdminPage,
  listAdminMedia,
  listAdminPages,
  updateAdminPage,
  uploadAdminMedia,
} from './api'

const adminPagesKey = ['admin-pages']
const adminPageKey = (pageId: string) => ['admin-page', pageId]
const adminMediaKey = ['admin-media']

export const useAdminPages = (options?: { initialData?: AdminPageSummary[] }) =>
  useQuery({
    queryKey: adminPagesKey,
    queryFn: listAdminPages,
    initialData: options?.initialData,
    staleTime: 60_000,
  })

export const useAdminPage = (pageId: string | null, options?: { initialData?: AdminPage }) =>
  useQuery({
    queryKey: pageId ? adminPageKey(pageId) : ['admin-page', 'empty'],
    queryFn: () => {
      if (!pageId) throw new Error('Page id is required')
      return getAdminPage(pageId)
    },
    enabled: Boolean(pageId),
    initialData: options?.initialData,
    staleTime: 60_000,
  })

export const useUpdateAdminPage = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ pageId, payload }: { pageId: string; payload: PageUpdatePayload }) =>
      updateAdminPage(pageId, payload),
    onSuccess: (updatedPage) => {
      queryClient.setQueryData(adminPageKey(updatedPage.id), updatedPage)
      queryClient.setQueryData<AdminPageSummary[]>(adminPagesKey, (current) => {
        if (!current) return current
        return current.map((page) =>
          page.id === updatedPage.id
            ? {
                ...page,
                title: updatedPage.title,
                slug: updatedPage.slug,
                status: updatedPage.status,
                updatedAt: updatedPage.updatedAt,
                updatedBy: updatedPage.updatedBy,
              }
            : page,
        )
      })
    },
  })
}

export const useAdminMedia = (options?: { initialData?: MediaItem[] }) =>
  useQuery({
    queryKey: adminMediaKey,
    queryFn: listAdminMedia,
    initialData: options?.initialData,
    staleTime: 60_000,
  })

export const useUploadAdminMedia = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: uploadAdminMedia,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminMediaKey })
    },
  })
}

export const useDeleteAdminMedia = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteAdminMedia,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminMediaKey })
    },
  })
}
