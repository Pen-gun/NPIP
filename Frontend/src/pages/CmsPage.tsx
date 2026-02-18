import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import CmsBlockRenderer from '../components/cms/CmsBlockRenderer'
import CmsUnavailableState from '../components/cms/CmsUnavailableState'
import { useCmsPage } from '../hooks/useCmsPage'

interface CmsPageProps {
  slug?: string
  fallback?: ReactNode
}

export default function CmsPage({ slug: slugProp, fallback }: CmsPageProps) {
  const navigate = useNavigate()
  const { slug, data, isLoading, isError, contentBlocks } = useCmsPage(slugProp)

  if (!slug) {
    return fallback ? <>{fallback}</> : null
  }

  if (isLoading) {
    return (
      <div className='min-h-screen bg-(--surface-background) px-4 py-10 text-(--text-primary)'>
        <div className='mx-auto w-full max-w-5xl space-y-4'>
          {[0, 1, 2].map((item) => (
            <div key={item} className='h-32 animate-pulse rounded-3xl bg-(--surface-muted)' />
          ))}
        </div>
      </div>
    )
  }

  if (isError || !data || data.status !== 'published') {
    return fallback ? <>{fallback}</> : <CmsUnavailableState onGoHome={() => navigate('/')} />
  }

  return (
    <div className='landing-page min-h-screen bg-(--surface-background) px-4 py-10 text-(--text-primary)'>
      <div className='mx-auto w-full max-w-5xl space-y-6'>
        {contentBlocks.length === 0 && (
          <div className='rounded-3xl border border-dashed border-(--border) bg-(--surface-base) p-8 text-center text-sm text-(--text-muted)'>
            This page has no content blocks yet.
          </div>
        )}

        {contentBlocks.map((block, index) => (
          <CmsBlockRenderer key={`cms-block-${index}`} block={block} index={index} />
        ))}
      </div>
    </div>
  )
}
