import npipClient from './npipClient'

export type SiteSettings = {
  brandName: string
  tagline: string
  logoUrl: string
  accentColor: string
  socialLinks: Array<{ label: string; href: string }>
}

export const fetchPublicSettings = async (): Promise<SiteSettings> => {
  const response = await npipClient.get('/settings')
  return response.data.data ?? response.data
}

export const fetchAdminSettings = async (): Promise<SiteSettings> => {
  const response = await npipClient.get('/admin/settings')
  return response.data.data ?? response.data
}

export const updateAdminSettings = async (payload: SiteSettings): Promise<SiteSettings> => {
  const response = await npipClient.put('/admin/settings', payload)
  return response.data.data ?? response.data
}
