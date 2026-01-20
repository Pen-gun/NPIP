import npipClient from './npipClient'
import type { FigureResponse } from '../types/figure'

export const fetchFigure = async (query: string, signal?: AbortSignal) => {
  const response = await npipClient.get<FigureResponse>('/v1/figures/search', {
    params: { query },
    signal,
  })
  return response.data
}
