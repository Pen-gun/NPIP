import npipClient from './npipClient'
import type { Mention } from '../types/app'

interface MentionFilters {
  from?: string
  to?: string
  source?: string
  sentiment?: string
  page?: number
  limit?: number
  sort?: 'recent' | 'oldest' | 'reach'
}

interface PaginationInfo {
  page: number
  limit: number
  totalCount: number
  totalPages: number
  hasNextPage: boolean
  hasPrevPage: boolean
}

interface MentionsResponse {
  mentions: Mention[]
  pagination: PaginationInfo
}

export const fetchMentions = async (
  projectId: string,
  filters: MentionFilters = {},
): Promise<MentionsResponse> => {
  const response = await npipClient.get('/mentions', {
    params: {
      projectId,
      from: filters.from,
      to: filters.to,
      source: filters.source,
      sentiment: filters.sentiment,
      page: filters.page || 1,
      limit: filters.limit || 20,
      sort: filters.sort || 'recent',
    },
  })
  return response.data.data
}

export type { MentionFilters, PaginationInfo, MentionsResponse }
