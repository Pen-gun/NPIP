export type User = {
  _id: string
  fullName: string
  username: string
  email: string
  plan: string
}

export type Project = {
  _id: string
  name: string
  keywords: string[]
  booleanQuery: string
  scheduleMinutes: number
  geoFocus: string
  sources: Record<string, boolean>
  lastRunAt?: string | null
  status?: 'active' | 'paused'
}

export type Mention = {
  _id: string
  source: string
  title: string
  text: string
  url?: string | null
  publishedAt?: string | Date | null
  sentiment?: { label: string; confidence: number }
  reachEstimate?: number
}

export type AlertItem = {
  _id: string
  type: string
  message: string
  createdAt: string
  readAt?: string | null
}

export type ConnectorHealth = {
  _id: string
  connectorId: string
  status: 'ok' | 'degraded' | 'down'
}

export type ProjectMetrics = {
  volume: Array<{ _id: { year: number; month: number; day: number }; count: number }>
  sentimentShare: Array<{ _id: string; count: number }>
  topSources: Array<{ _id: string; count: number }>
  topAuthors: Array<{ _id: string; count: number }>
}
