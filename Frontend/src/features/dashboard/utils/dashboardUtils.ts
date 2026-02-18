import type { ProjectFormState } from '../components/ProjectForm'
import type { DashboardFilters } from '../types/dashboard'

export const INITIAL_PROJECT_FORM: ProjectFormState = Object.freeze({
  name: '',
  keywords: '',
  booleanQuery: '',
  scheduleMinutes: 30,
  geoFocus: 'Nepal',
  sources: {
    localNews: true,
    youtube: true,
    reddit: true,
    x: true,
    meta: true,
    tiktok: true,
    viber: true,
  },
})

export const parseKeywords = (value: string): string[] =>
  value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)

export const SOURCE_MAP: Record<string, string> = Object.freeze({
  facebook: 'facebook',
  instagram: 'instagram',
  x: 'x',
  twitter: 'x',
  tiktok: 'tiktok',
  youtube: 'youtube',
  videos: 'youtube',
  wiki: 'wikipedia',
  wikipedia: 'wikipedia',
  gnews: 'gnews',
  rss: 'rss',
  chatgpt: 'chatgpt',
  openai: 'chatgpt',
  llm: 'ai',
  ai: 'ai',
  local_news: 'local_news',
  news: 'local_news',
  reddit: 'reddit',
  podcasts: 'podcasts',
  blogs: 'blogs',
  web: 'web',
  viber: 'viber',
})

export const SOURCE_LABELS: Record<string, string> = Object.freeze({
  youtube: 'YouTube',
  reddit: 'Reddit',
  x: 'X (Twitter)',
  facebook: 'Facebook',
  instagram: 'Instagram',
  tiktok: 'TikTok',
  local_news: 'Local News',
  wikipedia: 'Wikipedia',
  gnews: 'Google News',
  rss: 'RSS',
  chatgpt: 'ChatGPT',
  ai: 'AI Insights',
  viber: 'Viber',
  podcasts: 'Podcasts',
  blogs: 'Blogs',
  web: 'Web',
})

export const normalizeSentiment = (value?: string) => {
  const normalized = value?.toLowerCase() || ''
  if (['5 stars', '4 stars', 'positive'].includes(normalized)) return 'positive'
  if (['3 stars', 'neutral'].includes(normalized)) return 'neutral'
  if (['2 stars', '1 star', 'negative'].includes(normalized)) return 'negative'
  return ''
}

export const normalizeSource = (value?: string) => {
  const normalized = value?.toLowerCase().trim() || ''
  if (!normalized) return ''
  return SOURCE_MAP[normalized] || normalized
}

const formatDateInput = (value: Date) => value.toISOString().slice(0, 10)

export const getDateRange = (range: string) => {
  const to = new Date()
  const from = new Date(to)
  if (range === 'last_7_days') {
    from.setDate(to.getDate() - 7)
  } else if (range === 'last_30_days') {
    from.setDate(to.getDate() - 30)
  } else if (range === 'last_90_days') {
    from.setDate(to.getDate() - 90)
  }
  return { from: formatDateInput(from), to: formatDateInput(to) }
}

export const INITIAL_FILTERS: DashboardFilters = Object.freeze({
  ...getDateRange('last_30_days'),
  source: '',
  sentiment: '',
})

