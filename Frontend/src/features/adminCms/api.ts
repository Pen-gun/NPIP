import npipClient from '../../api/npipClient'
import type {
  AdminPage,
  AdminPageSummary,
  MediaItem,
  MediaUploadPayload,
  PageUpdatePayload,
} from './types'

// Base path matches /api/admin/* when VITE_API_URL points to /api.
const ADMIN_BASE = '/admin'

export const listAdminPages = async (): Promise<AdminPageSummary[]> => {
  const response = await npipClient.get(`${ADMIN_BASE}/pages`)
  return response.data.data ?? response.data
}

export const getAdminPage = async (pageId: string): Promise<AdminPage> => {
  const response = await npipClient.get(`${ADMIN_BASE}/pages/${pageId}`)
  return response.data.data ?? response.data
}

export const updateAdminPage = async (
  pageId: string,
  payload: PageUpdatePayload,
): Promise<AdminPage> => {
  const response = await npipClient.put(`${ADMIN_BASE}/pages/${pageId}`, payload)
  return response.data.data ?? response.data
}

export const listAdminMedia = async (): Promise<MediaItem[]> => {
  const response = await npipClient.get(`${ADMIN_BASE}/media`)
  return response.data.data ?? response.data
}

export const uploadAdminMedia = async (payload: MediaUploadPayload): Promise<MediaItem> => {
  const formData = new FormData()
  formData.append('file', payload.file)
  if (payload.title) formData.append('title', payload.title)
  if (payload.alt) formData.append('alt', payload.alt)

  const response = await npipClient.post(`${ADMIN_BASE}/media`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return response.data.data ?? response.data
}

export const deleteAdminMedia = async (mediaId: string): Promise<void> => {
  await npipClient.delete(`${ADMIN_BASE}/media/${mediaId}`)
}
