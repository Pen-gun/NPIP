import { useMemo } from 'react'
import type { CSSProperties } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useParams } from 'react-router-dom'
import type { ReactNode } from 'react'
import { fetchPublishedPage } from '../api/pages'
import type { ContentBlock } from '../features/adminCms/types'
import { usePublicSiteSettings } from '../hooks/useSiteSettings'

const blockTypeLabels: Record<ContentBlock['type'], string> = {
  hero: 'Hero',
  rich_text: 'Rich text',
  feature_grid: 'Feature grid',
  testimonials: 'Testimonials',
  gallery: 'Gallery',
  cta_band: 'CTA band',
}

const isContentBlock = (block: unknown): block is ContentBlock => {
  if (!block || typeof block !== 'object') return false
  return 'type' in block
}

const renderInline = (text: string): ReactNode[] => {
  const nodes: ReactNode[] = []
  const regex = /(\*\*([^*]+)\*\*|\[([^\]]+)\]\(([^)]+)\))/g
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index))
    }
    if (match[2]) {
      nodes.push(<strong key={`b-${match.index}`}>{match[2]}</strong>)
    } else if (match[3] && match[4]) {
      nodes.push(
        <a
          key={`a-${match.index}`}
          href={match[4]}
          className='font-semibold text-blue-700 underline-offset-4 hover:underline'
        >
          {match[3]}
        </a>,
      )
    }
    lastIndex = match.index + match[0].length
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex))
  }

  return nodes
}

const renderRichText = (content: string) => {
  const lines = content.split('\n')
  const nodes: ReactNode[] = []
  let listBuffer: string[] = []

  const flushList = () => {
    if (!listBuffer.length) return
    nodes.push(
      <ul key={`list-${nodes.length}`} className='list-disc space-y-1 pl-5 text-sm text-(--text-secondary)'>
        {listBuffer.map((item, index) => (
          <li key={`li-${index}`}>{renderInline(item)}</li>
        ))}
      </ul>,
    )
    listBuffer = []
  }

  lines.forEach((line, index) => {
    const trimmed = line.trim()
    if (!trimmed) {
      flushList()
      nodes.push(<div key={`sp-${index}`} className='h-3' />)
      return
    }

    if (trimmed.startsWith('- ')) {
      listBuffer.push(trimmed.slice(2))
      return
    }

    flushList()

    if (trimmed.startsWith('### ')) {
      nodes.push(
        <h3 key={`h3-${index}`} className='text-lg font-semibold text-(--text-primary)'>
          {renderInline(trimmed.slice(4))}
        </h3>,
      )
      return
    }
    if (trimmed.startsWith('## ')) {
      nodes.push(
        <h2 key={`h2-${index}`} className='text-xl font-semibold text-(--text-primary)'>
          {renderInline(trimmed.slice(3))}
        </h2>,
      )
      return
    }
    if (trimmed.startsWith('# ')) {
      nodes.push(
        <h1 key={`h1-${index}`} className='text-2xl font-semibold text-(--text-primary)'>
          {renderInline(trimmed.slice(2))}
        </h1>,
      )
      return
    }

    nodes.push(
      <p key={`p-${index}`} className='text-sm leading-relaxed text-(--text-secondary)'>
        {renderInline(trimmed)}
      </p>,
    )
  })

  flushList()
  return nodes
}

const withDelay = (delay: number) => ({ '--delay': `${delay}ms` } as CSSProperties)

function HeroBlock({
  block,
  index,
}: {
  block: Extract<ContentBlock, { type: 'hero' }>
  index: number
}) {
  return (
    <section
      className='landing-reveal relative overflow-hidden rounded-3xl border border-(--border) bg-(--surface-base) p-8 shadow-sm'
      style={withDelay(120 + index * 70)}
    >
      {block.backgroundImage && (
        <img
          src={block.backgroundImage}
          alt=''
          className='absolute inset-0 h-full w-full object-cover opacity-20'
        />
      )}
      <div className='relative z-10 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]'>
        <div>
          <h1 className='text-3xl font-semibold text-(--text-primary)'>{block.title}</h1>
          <p className='mt-3 text-sm text-(--text-secondary)'>{block.subtitle}</p>
          <a
            href={block.ctaLink}
            className='mt-6 inline-flex items-center justify-center rounded-full bg-(--brand-accent) px-5 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white shadow-sm'
          >
            {block.ctaText}
          </a>
        </div>
      </div>
    </section>
  )
}

function FeatureGrid({
  block,
  index,
}: {
  block: Extract<ContentBlock, { type: 'feature_grid' }>
  index: number
}) {
  return (
    <section
      className='landing-reveal rounded-3xl border border-(--border) bg-(--surface-base) p-8 shadow-sm'
      style={withDelay(120 + index * 70)}
    >
      <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
        {block.items.map((item) => (
          <div key={item.id} className='landing-reveal-soft rounded-2xl border border-(--border) bg-(--surface-muted) p-4'>
            <p className='text-xs font-semibold uppercase tracking-[0.2em] text-(--text-muted)'>
              {item.icon}
            </p>
            <h3 className='mt-2 text-lg font-semibold text-(--text-primary)'>{item.title}</h3>
            <p className='mt-2 text-sm text-(--text-secondary)'>{item.description}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

function Testimonials({
  block,
  index,
}: {
  block: Extract<ContentBlock, { type: 'testimonials' }>
  index: number
}) {
  return (
    <section
      className='landing-reveal rounded-3xl border border-(--border) bg-(--surface-base) p-8 shadow-sm'
      style={withDelay(120 + index * 70)}
    >
      <div className='grid gap-4 lg:grid-cols-2'>
        {block.items.map((item) => (
          <div key={item.id} className='landing-reveal-soft rounded-2xl border border-(--border) bg-(--surface-muted) p-4'>
            <div className='flex items-center gap-3'>
              {item.photo ? (
                <img src={item.photo} alt={item.name} className='h-12 w-12 rounded-full object-cover' />
              ) : (
                <div className='h-12 w-12 rounded-full bg-(--border)' />
              )}
              <div>
                <p className='text-sm font-semibold text-(--text-primary)'>{item.name}</p>
                <p className='text-xs text-(--text-muted)'>{item.role}</p>
              </div>
            </div>
            <p className='mt-3 text-sm text-(--text-secondary)'>“{item.quote}”</p>
          </div>
        ))}
      </div>
    </section>
  )
}

function Gallery({
  block,
  index,
}: {
  block: Extract<ContentBlock, { type: 'gallery' }>
  index: number
}) {
  return (
    <section
      className='landing-reveal rounded-3xl border border-(--border) bg-(--surface-base) p-8 shadow-sm'
      style={withDelay(120 + index * 70)}
    >
      <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
        {block.items.map((item) => (
          <figure key={item.id} className='landing-reveal-soft rounded-2xl border border-(--border) bg-(--surface-muted) p-3'>
            <img src={item.image} alt={item.caption} className='h-40 w-full rounded-lg object-cover' />
            <figcaption className='mt-2 text-xs text-(--text-muted)'>{item.caption}</figcaption>
          </figure>
        ))}
      </div>
    </section>
  )
}

function CtaBand({
  block,
  index,
}: {
  block: Extract<ContentBlock, { type: 'cta_band' }>
  index: number
}) {
  return (
    <section
      className='landing-reveal rounded-3xl border border-(--border) bg-(--surface-base) p-8 shadow-sm'
      style={withDelay(120 + index * 70)}
    >
      <div className='flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center'>
        <p className='text-lg font-semibold text-(--text-primary)'>{block.text}</p>
        <a
          href={block.buttonLink}
          className='inline-flex items-center justify-center rounded-full bg-(--brand-accent) px-5 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white shadow-sm'
        >
          {block.buttonText}
        </a>
      </div>
    </section>
  )
}

function RichText({
  block,
  index,
}: {
  block: Extract<ContentBlock, { type: 'rich_text' }>
  index: number
}) {
  return (
    <section
      className='landing-reveal rounded-3xl border border-(--border) bg-(--surface-base) p-8 shadow-sm'
      style={withDelay(120 + index * 70)}
    >
      <div className='space-y-3'>{renderRichText(block.content)}</div>
    </section>
  )
}

export default function CmsPage({
  slug: slugProp,
  fallback,
}: {
  slug?: string
  fallback?: ReactNode
}) {
  const params = useParams()
  const slug = (slugProp || params.slug || '').toLowerCase()
  const { data: settings } = usePublicSiteSettings()

  const { data, isLoading, isError } = useQuery({
    queryKey: ['public-page', slug],
    queryFn: () => fetchPublishedPage(slug),
    enabled: Boolean(slug),
    staleTime: 60_000,
  })

  const contentBlocks = useMemo(
    () => (data?.blocks ?? []).filter(isContentBlock),
    [data?.blocks],
  )

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
    return fallback ? (
      <>{fallback}</>
    ) : (
      <div className='min-h-screen bg-(--surface-background) px-4 py-10 text-(--text-primary)'>
        <div className='mx-auto w-full max-w-3xl rounded-3xl border border-(--border) bg-(--surface-base) p-8 text-center shadow-sm'>
          <p className='text-xs font-semibold uppercase tracking-[0.3em] text-(--text-muted)'>Not found</p>
          <h1 className='mt-3 text-2xl font-semibold'>This page is not published yet.</h1>
        </div>
      </div>
    )
  }

  return (
    <div className='landing-page min-h-screen bg-(--surface-background) px-4 py-10 text-(--text-primary)'>
      <div className='mx-auto w-full max-w-5xl space-y-6'>
        {contentBlocks.length === 0 && (
          <div className='rounded-3xl border border-dashed border-(--border) bg-(--surface-base) p-8 text-center text-sm text-(--text-muted)'>
            This page has no content blocks yet.
          </div>
        )}
        {contentBlocks.map((block, index) => {
          if (block.type === 'hero') return <HeroBlock key={block.id ?? index} block={block} index={index} />
          if (block.type === 'rich_text') return <RichText key={block.id ?? index} block={block} index={index} />
          if (block.type === 'feature_grid') return <FeatureGrid key={block.id ?? index} block={block} index={index} />
          if (block.type === 'testimonials') return <Testimonials key={block.id ?? index} block={block} index={index} />
          if (block.type === 'gallery') return <Gallery key={block.id ?? index} block={block} index={index} />
          if (block.type === 'cta_band') return <CtaBand key={block.id ?? index} block={block} index={index} />
          return (
            <div
              key={`unknown-${index}`}
              className='landing-reveal rounded-3xl border border-(--border) bg-(--surface-base) p-6 text-sm text-(--text-muted)'
            >
              Unsupported block: {blockTypeLabels[block.type] ?? block.type}
            </div>
          )
        })}
      </div>
    </div>
  )
}
