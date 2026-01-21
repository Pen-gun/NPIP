import npipClient from './npipClient'
import type { Mention } from '../types/app'

export const fetchMentions = async (
  projectId: string,
  filters: { from?: string; to?: string; source?: string; sentiment?: string },
): Promise<Mention[]> => {
  const response = await npipClient.get('/mentions', {
    params: {
      projectId,
      from: filters.from || undefined,
      to: filters.to || undefined,
      source: filters.source || undefined,
      sentiment: filters.sentiment || undefined,
    },
  })
  return response.data.data
}
