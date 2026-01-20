import { useQuery, type UseQueryResult } from '@tanstack/react-query'
import { fetchIdentity, fetchNews, fetchVideos } from '../api/figures'
import type { FigureIdentityResponse, FigureNewsResponse, FigureVideosResponse } from '../types/figure'

const normalizeQuery = (value: string) => value.trim()

export const useFigureIdentity = (
  query: string,
): UseQueryResult<FigureIdentityResponse, Error> => {
  const normalizedQuery = normalizeQuery(query)

  return useQuery<FigureIdentityResponse, Error>({
    queryKey: ['figure-identity', normalizedQuery],
    enabled: Boolean(normalizedQuery),
    queryFn: ({ signal }) => fetchIdentity(normalizedQuery, signal),
    keepPreviousData: true,
  })
}

export const useFigureNews = (
  params: { name: string; query?: string; aliases?: string[] },
  enabled: boolean,
): UseQueryResult<FigureNewsResponse, Error> => {
  return useQuery<FigureNewsResponse, Error>({
    queryKey: ['figure-news', params.name, params.query, params.aliases?.join(',')],
    enabled,
    queryFn: ({ signal }) => fetchNews(params, signal),
    keepPreviousData: true,
  })
}

export const useFigureVideos = (
  name: string,
  enabled: boolean,
): UseQueryResult<FigureVideosResponse, Error> => {
  return useQuery<FigureVideosResponse, Error>({
    queryKey: ['figure-videos', name],
    enabled,
    queryFn: ({ signal }) => fetchVideos(name, signal),
    keepPreviousData: true,
  })
}
