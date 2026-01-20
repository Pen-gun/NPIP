import npipClient from './npipClient'
import type { FigureIdentityResponse, FigureNewsResponse, FigureVideosResponse } from '../types/figure'

export const fetchIdentity = async (query: string, signal?: AbortSignal) => {
  const response = await npipClient.get<FigureIdentityResponse>('/v1/figures/identity', {
    params: { query },
    signal,
  })
  return response.data
}

export const fetchNews = async (
  params: { name: string; query?: string; aliases?: string[] },
  signal?: AbortSignal,
) => {
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

export const fetchVideos = async (name: string, signal?: AbortSignal) => {
  const response = await npipClient.get<FigureVideosResponse>('/v1/figures/videos', {
    params: { name },
    signal,
  })
  return response.data
}
