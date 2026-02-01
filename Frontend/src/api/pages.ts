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

export const fetchPublishedPage = async (slug: string): Promise<PublicPage> => {
  const response = await npipClient.get(`/pages/${slug}`)
  return response.data.data ?? response.data
}
