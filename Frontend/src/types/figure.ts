export type PersonProfile = {
  name: string
  description: string
  wikipediaUrl: string
  thumbnail: string
  extract: string
  pageId?: number | null
  aliases?: string[]
}

export type NewsArticle = {
  title: string
  description: string
  url: string
  source: string
  publishedAt: string
  image: string
}

export type FigureIdentityResponse = {
  query: string
  person: PersonProfile | null
  candidates: Array<{
    title: string
    description: string
    thumbnail: string
    wikipediaUrl: string
  }>
  isDisambiguation: boolean
}

export type FigureNewsResponse = {
  query: string
  name: string
  recentActivities: Array<Pick<NewsArticle, 'title' | 'publishedAt' | 'source' | 'url'>>
  recentLocations: Array<{
    name: string
    source: string
    publishedAt: string
    url: string
  }>
  news: NewsArticle[]
  metadata: {
    newsProvider: string
    warning: string | null
    sources: {
      gnews: {
        ok: boolean
        warning: string | null
      }
      rss: {
        ok: boolean
        warning: string | null
      }
    }
  }
}

export type FigureVideosResponse = {
  name: string
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
    warning: string | null
    sources: {
      youtube: {
        ok: boolean
        warning: string | null
      }
    }
  }
}

export type FigureResponse = FigureIdentityResponse &
  FigureNewsResponse &
  FigureVideosResponse
