import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { fetchPublishedPage } from '../api/pages'
import type { ContentBlock } from '../features/adminCms/types'

interface Highlight {
  title: string
  description: string
}

const HIGHLIGHTS: readonly Highlight[] = Object.freeze([
  {
    title: 'Public signal intake',
    description: 'Track public mentions across Nepali news, YouTube, Reddit and optional connectors.',
  },
  {
    title: 'Nepali + English sentiment',
    description: 'Devanagari-aware language detection with multilingual sentiment scoring.',
  },
  {
    title: 'Alerts & reports',
    description: 'Real-time spike alerts, email digests, and exportable PDF summaries.',
  },
])

const CONSTRAINTS = Object.freeze([
  'Local news + YouTube + Reddit are the reliable MVP sources.',
  'X, Meta, TikTok, Viber remain gated or best-effort.',
  'Public data only, respecting robots.txt and platform ToS.',
])

const DATA_SOURCES = Object.freeze([
  'Local News RSS',
  'YouTube API',
  'Reddit API',
  'X (paid)',
  'Meta (owned)',
  'TikTok (best-effort)',
])

const WORKFLOW_STEPS = Object.freeze([
  {
    title: 'Create a project',
    description: 'Define keywords, boolean queries, and the sources you want to monitor.',
  },
  {
    title: 'Ingest mentions',
    description: 'Schedule connectors to collect mentions across the supported stack.',
  },
  {
    title: 'Act on insights',
    description: 'Use sentiment, top sources, and alerts to take action quickly.',
  },
])

export function useHomePageContent() {
  const { data: homePage, error: homeError } = useQuery({
    queryKey: ['public-page', 'home'],
    queryFn: () => fetchPublishedPage('home'),
    staleTime: 60_000,
  })

  const contentBlocks = useMemo(
    () =>
      (homePage?.blocks ?? []).filter(
        (block): block is ContentBlock =>
          Boolean(block && typeof block === 'object' && 'type' in block),
      ),
    [homePage?.blocks],
  )

  const heroBlock = contentBlocks.find(
    (block): block is Extract<ContentBlock, { type: 'hero' }> => block.type === 'hero',
  )

  const featureBlocks = contentBlocks.filter(
    (block): block is Extract<ContentBlock, { type: 'feature_grid' }> => block.type === 'feature_grid',
  )

  const richTextBlock = contentBlocks.find(
    (block): block is Extract<ContentBlock, { type: 'rich_text' }> => block.type === 'rich_text',
  )

  const ctaBlock = contentBlocks.find(
    (block): block is Extract<ContentBlock, { type: 'cta_band' }> => block.type === 'cta_band',
  )

  const highlights =
    featureBlocks[0]?.items?.map((item) => ({
      title: item.title,
      description: item.description,
    })) ?? HIGHLIGHTS

  const workflowSteps =
    featureBlocks[1]?.items?.map((item) => ({
      title: item.title,
      description: item.description,
    })) ?? WORKFLOW_STEPS

  const { constraints, dataSources } = useMemo(() => {
    if (!richTextBlock?.content) {
      return { constraints: CONSTRAINTS, dataSources: DATA_SOURCES }
    }

    const lines = richTextBlock.content.split('\n').map((line) => line.trim())
    const parsedConstraints: string[] = []
    const parsedSources: string[] = []
    let section: 'constraints' | 'sources' | null = null

    for (const line of lines) {
      if (!line) continue
      const lower = line.toLowerCase()
      if (line.startsWith('#')) {
        if (lower.includes('source reality')) {
          section = 'constraints'
        } else if (lower.includes('data sources')) {
          section = 'sources'
        } else {
          section = null
        }
        continue
      }

      if (line.startsWith('- ')) {
        if (section === 'constraints') {
          parsedConstraints.push(line.slice(2))
        } else if (section === 'sources') {
          parsedSources.push(line.slice(2))
        }
      }
    }

    return {
      constraints: parsedConstraints.length ? parsedConstraints : CONSTRAINTS,
      dataSources: parsedSources.length ? parsedSources : DATA_SOURCES,
    }
  }, [richTextBlock?.content])

  return {
    homeError,
    heroBlock,
    highlights,
    workflowSteps,
    constraints,
    dataSources,
    ctaBlock,
  }
}
