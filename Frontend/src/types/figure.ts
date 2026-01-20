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
  recentActivities: Array<Pick<NewsArticle, 'title' | 'publishedAt' | 'source' | 'url'>>
  news: NewsArticle[]
  metadata: {
    newsProvider: string
    warning: string | null
  }
}
