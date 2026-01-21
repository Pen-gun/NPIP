import { useQuery, type UseQueryResult } from '@tanstack/react-query'
import { useMemo } from 'react'

import { fetchIdentity, fetchNews, fetchVideos } from '../api/figures'
import type {
  FigureIdentityResponse,
  FigureNewsResponse,
  FigureVideosResponse,
} from '../types/figure'

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

/** Query key factory for consistent cache key generation */
const QUERY_KEYS = {
  identity: (query: string) => ['figure', 'identity', query] as const,
  news: (name: string, query?: string, aliases?: string) =>
    ['figure', 'news', name, query, aliases] as const,
  videos: (name: string) => ['figure', 'videos', name] as const,
} as const

/** Default stale time for figure data (5 minutes) */
const STALE_TIME_MS = 5 * 60 * 1000

/** Cache time before garbage collection (30 minutes) */
const CACHE_TIME_MS = 30 * 60 * 1000

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

/** Parameters for fetching figure news */
export interface FigureNewsParams {
  /** The canonical name of the figure */
  name: string
  /** Optional search query to filter news */
  query?: string
  /** Optional list of alternative names/aliases */
  aliases?: string[]
}

// ─────────────────────────────────────────────────────────────────────────────
// Utilities
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Normalizes a search query by trimming whitespace and converting to lowercase.
 * This ensures consistent cache key generation regardless of input formatting.
 */
const normalizeQuery = (value: string): string => value.trim().toLowerCase()

/**
 * Validates that a query string is non-empty after normalization.
 */
const isValidQuery = (query: string): boolean => {
  const normalized = normalizeQuery(query)
  return normalized.length > 0
}

// ─────────────────────────────────────────────────────────────────────────────
// Hooks
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Fetches and caches figure identity information based on a search query.
 *
 * @param query - The search query (person name or identifier)
 * @returns Query result containing identity data, candidates, and disambiguation info
 *
 * @example
 * ```tsx
 * const { data, isLoading, error } = useFigureIdentity('Elon Musk')
 *
 * if (data?.isDisambiguation) {
 *   // Show disambiguation UI with data.candidates
 * } else if (data?.person) {
 *   // Show person profile
 * }
 * ```
 */
export const useFigureIdentity = (
  query: string,
): UseQueryResult<FigureIdentityResponse, Error> => {
  const normalizedQuery = useMemo(() => normalizeQuery(query), [query])

  return useQuery<FigureIdentityResponse, Error>({
    queryKey: QUERY_KEYS.identity(normalizedQuery),
    queryFn: ({ signal }) => fetchIdentity(normalizedQuery, signal),
    enabled: isValidQuery(query),
    staleTime: STALE_TIME_MS,
    gcTime: CACHE_TIME_MS,
    placeholderData: (previousData) => previousData,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
  })
}

/**
 * Fetches and caches news articles related to a figure.
 *
 * @param params - Parameters including name, optional query, and aliases
 * @param enabled - Whether the query should execute
 * @returns Query result containing news articles, events, and insights
 *
 * @example
 * ```tsx
 * const { data, isLoading } = useFigureNews(
 *   { name: 'Elon Musk', aliases: ['SpaceX CEO'] },
 *   Boolean(selectedPerson)
 * )
 * ```
 */
export const useFigureNews = (
  params: FigureNewsParams,
  enabled: boolean,
): UseQueryResult<FigureNewsResponse, Error> => {
  // Memoize aliases string to prevent unnecessary query key changes
  const aliasesKey = useMemo(
    () => params.aliases?.sort().join(','),
    [params.aliases],
  )

  const queryKey = useMemo(
    () => QUERY_KEYS.news(params.name, params.query, aliasesKey),
    [params.name, params.query, aliasesKey],
  )

  return useQuery<FigureNewsResponse, Error>({
    queryKey,
    queryFn: ({ signal }) => fetchNews(params, signal),
    enabled: enabled && Boolean(params.name),
    staleTime: STALE_TIME_MS,
    gcTime: CACHE_TIME_MS,
    placeholderData: (previousData) => previousData,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
  })
}

/**
 * Fetches and caches video content related to a figure.
 *
 * @param name - The canonical name of the figure
 * @param enabled - Whether the query should execute
 * @returns Query result containing videos and video insights
 *
 * @example
 * ```tsx
 * const { data, isLoading } = useFigureVideos('Elon Musk', Boolean(selectedPerson))
 * ```
 */
export const useFigureVideos = (
  name: string,
  enabled: boolean,
): UseQueryResult<FigureVideosResponse, Error> => {
  const queryKey = useMemo(() => QUERY_KEYS.videos(name), [name])

  return useQuery<FigureVideosResponse, Error>({
    queryKey,
    queryFn: ({ signal }) => fetchVideos(name, signal),
    enabled: enabled && Boolean(name),
    staleTime: STALE_TIME_MS,
    gcTime: CACHE_TIME_MS,
    placeholderData: (previousData) => previousData,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
  })
}

// ─────────────────────────────────────────────────────────────────────────────
// Exports for testing
// ─────────────────────────────────────────────────────────────────────────────

export { QUERY_KEYS, normalizeQuery, isValidQuery }
