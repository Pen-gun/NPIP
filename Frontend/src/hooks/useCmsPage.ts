import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useParams } from 'react-router-dom'
import { fetchPublishedPage } from '../api/pages'

export function useCmsPage(slugProp?: string) {
  const params = useParams()
  const slug = (slugProp || params.slug || '').toLowerCase()

  const query = useQuery({
    queryKey: ['public-page', slug],
    queryFn: () => fetchPublishedPage(slug),
    enabled: Boolean(slug),
    staleTime: 60_000,
  })

  const contentBlocks = useMemo(() => query.data?.blocks ?? [], [query.data?.blocks])

  return {
    slug,
    contentBlocks,
    ...query,
  }
}
