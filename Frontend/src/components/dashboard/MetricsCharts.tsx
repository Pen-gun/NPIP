import { useMemo, useState } from 'react'
import ChartCard from '../ChartCard'
import type { ProjectMetrics } from '../../types/app'

interface MetricsChartsProps {
  metrics: ProjectMetrics | null
  loading: boolean
}

const SKELETON_CHART_COUNT = 3

// Format star ratings for display
const SENTIMENT_LABELS: Record<string, string> = {
  '1 star': 'Very Negative',
  '2 stars': 'Negative',
  '3 stars': 'Neutral',
  '4 stars': 'Positive',
  '5 stars': 'Very Positive',
  positive: 'Positive',
  neutral: 'Neutral',
  negative: 'Negative',
  unknown: 'Unknown',
}

const formatSentimentLabel = (label: string): string =>
  SENTIMENT_LABELS[label?.toLowerCase()] || SENTIMENT_LABELS[label] || label || 'Unknown'

export default function MetricsCharts({ metrics, loading }: MetricsChartsProps) {
  const [activeChart, setActiveChart] = useState<'all' | 'volume' | 'sentiment' | 'sources'>('all')
  const volumeLabels = useMemo(
    () => metrics?.volume.map((item) => `${item._id.month}/${item._id.day}`) || [],
    [metrics],
  )
  const volumeData = useMemo(
    () => metrics?.volume.map((item) => item.count) || [],
    [metrics],
  )
  const sentimentLabels = useMemo(
    () => metrics?.sentimentShare.map((item) => formatSentimentLabel(item._id)) || [],
    [metrics],
  )
  const sentimentData = useMemo(
    () => metrics?.sentimentShare.map((item) => item.count) || [],
    [metrics],
  )
  const sourceLabels = useMemo(
    () => metrics?.topSources.map((item) => item._id) || [],
    [metrics],
  )
  const sourceData = useMemo(
    () => metrics?.topSources.map((item) => item.count) || [],
    [metrics],
  )

  const charts = [
    {
      id: 'volume' as const,
      title: 'Volume',
      description: 'Mentions per day',
      type: 'line' as const,
      labels: volumeLabels,
      data: volumeData,
    },
    {
      id: 'sentiment' as const,
      title: 'Sentiment',
      description: 'Share of sentiment',
      type: 'doughnut' as const,
      labels: sentimentLabels,
      data: sentimentData,
    },
    {
      id: 'sources' as const,
      title: 'Sources',
      description: 'Top mention sources',
      type: 'bar' as const,
      labels: sourceLabels,
      data: sourceData,
    },
  ]

  const visibleCharts = activeChart === 'all' ? charts : charts.filter((chart) => chart.id === activeChart)
  const skeletonCount = activeChart === 'all' ? SKELETON_CHART_COUNT : 1

  return (
    <div className='mt-6'>
      <div className='flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-(--text-muted)'>
        <button
          type='button'
          onClick={() => setActiveChart('all')}
          className={`rounded-full border px-3 py-1 transition ${
            activeChart === 'all'
              ? 'border-(--brand-accent) text-(--brand-accent)'
              : 'border-(--border) text-(--text-muted) hover:text-(--text-primary)'
          }`}
          disabled={loading}
        >
          All
        </button>
        <button
          type='button'
          onClick={() => setActiveChart('volume')}
          className={`rounded-full border px-3 py-1 transition ${
            activeChart === 'volume'
              ? 'border-(--brand-accent) text-(--brand-accent)'
              : 'border-(--border) text-(--text-muted) hover:text-(--text-primary)'
          }`}
          disabled={loading}
        >
          Volume
        </button>
        <button
          type='button'
          onClick={() => setActiveChart('sentiment')}
          className={`rounded-full border px-3 py-1 transition ${
            activeChart === 'sentiment'
              ? 'border-(--brand-accent) text-(--brand-accent)'
              : 'border-(--border) text-(--text-muted) hover:text-(--text-primary)'
          }`}
          disabled={loading}
        >
          Sentiment
        </button>
        <button
          type='button'
          onClick={() => setActiveChart('sources')}
          className={`rounded-full border px-3 py-1 transition ${
            activeChart === 'sources'
              ? 'border-(--brand-accent) text-(--brand-accent)'
              : 'border-(--border) text-(--text-muted) hover:text-(--text-primary)'
          }`}
          disabled={loading}
        >
          Sources
        </button>
      </div>

      <div
        className={`mt-4 grid gap-4 ${
          visibleCharts.length === 1 ? 'sm:grid-cols-1' : 'sm:grid-cols-2 lg:grid-cols-3'
        }`}
      >
        {loading
          ? Array.from({ length: skeletonCount }).map((_, index) => (
              <div
                key={`chart-skeleton-${index}`}
                className='h-56 rounded-2xl bg-(--surface-muted) animate-pulse'
              />
            ))
          : visibleCharts.map((chart) => (
              <ChartCard
                key={chart.id}
                title={chart.title}
                description={chart.description}
                type={chart.type}
                labels={chart.labels}
                data={chart.data}
              />
            ))}
      </div>
    </div>
  )
}
