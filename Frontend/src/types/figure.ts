export type PersonProfile = {
  name: string
  description: string
  wikipediaUrl: string
  thumbnail: string
  extract: string
  pageId?: number | null
}

export type NewsArticle = {
  title: string
  description: string
  url: string
  source: string
  publishedAt: string
  image: string
}

export type FigureResponse = {
  query: string
  person: PersonProfile | null
  candidates: Array<{
    title: string
    description: string
    thumbnail: string
    wikipediaUrl: string
  }>
  isDisambiguation: boolean
  recentActivities: Array<Pick<NewsArticle, 'title' | 'publishedAt' | 'source' | 'url'>>
  news: NewsArticle[]
  videos: Array<{
    id: string
    title: string
    description: string
    publishedAt: string
    channelTitle: string
    thumbnail: string
    url: string
  }>
  metadata: {
    newsProvider: string
    warning: string | null
  }
}
