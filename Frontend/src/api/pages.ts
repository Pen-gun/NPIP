import npipClient from './npipClient'

export type PublicPage = {
  id: string
  title: string
  slug: string
  status: 'draft' | 'published'
  updatedAt?: string
  seo?: {
    metaTitle?: string
    metaDescription?: string
    slug?: string
    canonical?: string
    ogImage?: string
  }
  blocks: Array<Record<string, unknown>>
}

export type PublicPageSummary = {
  id: string
  title: string
  slug: string
  updatedAt?: string
}

export const fetchPublishedPage = async (slug: string): Promise<PublicPage> => {
  const response = await npipClient.get(`/pages/${slug}`)
  return response.data.data ?? response.data
}

export const fetchPublishedPages = async (): Promise<PublicPageSummary[]> => {
  const response = await npipClient.get('/pages')
  return response.data.data ?? response.data
}
