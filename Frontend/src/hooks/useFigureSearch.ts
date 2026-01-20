import { useQuery, type UseQueryResult } from '@tanstack/react-query'
import { fetchFigure } from '../api/figures'
import type { FigureResponse } from '../types/figure'

const normalizeQuery = (value: string) => value.trim()

export const useFigureSearch = (query: string): UseQueryResult<FigureResponse, Error> => {
  const normalizedQuery = normalizeQuery(query)

  return useQuery<FigureResponse, Error>({
    queryKey: ['figure-search', normalizedQuery],
    enabled: Boolean(normalizedQuery),
    queryFn: () => fetchFigure(normalizedQuery),
    keepPreviousData: true,
  })
}
