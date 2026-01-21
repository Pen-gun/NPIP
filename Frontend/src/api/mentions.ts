import npipClient from './npipClient'
import type { Mention } from '../types/app'

interface MentionFilters {
  from?: string
  to?: string
  source?: string
  sentiment?: string
}

export const fetchMentions = async (
  projectId: string,
  filters: MentionFilters = {},
): Promise<Mention[]> => {
  const response = await npipClient.get('/mentions', {
    params: {
      projectId,
      from: filters.from,
      to: filters.to,
      source: filters.source,
      sentiment: filters.sentiment,
    },
  })
  return response.data.data
}
