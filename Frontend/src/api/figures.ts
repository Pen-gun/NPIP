import npipClient from './npipClient'
import type { FigureIdentityResponse, FigureNewsResponse, FigureVideosResponse } from '../types/figure'

interface FetchNewsParams {
  name: string
  query?: string
  aliases?: string[]
}

export const fetchIdentity = async (
  query: string,
  signal?: AbortSignal,
): Promise<FigureIdentityResponse> => {
  const response = await npipClient.get<FigureIdentityResponse>('/figures/identity', {
    params: { query },
    signal,
  })
  return response.data
}

export const fetchNews = async (
  params: FetchNewsParams,
  signal?: AbortSignal,
): Promise<FigureNewsResponse> => {
  const response = await npipClient.get<FigureNewsResponse>('/v1/figures/news', {
    params: {
      name: params.name,
      query: params.query,
      aliases: params.aliases?.join(','),
    },
    signal,
  })
  return response.data
}

export const fetchVideos = async (
  name: string,
  signal?: AbortSignal,
): Promise<FigureVideosResponse> => {
  const response = await npipClient.get<FigureVideosResponse>('/figures/videos', {
    params: { name },
    signal,
  })
  return response.data
}
