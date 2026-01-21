import ChartCard from '../ChartCard'
import type { ProjectMetrics } from '../../types/app'

interface MetricsChartsProps {
  metrics: ProjectMetrics | null
  loading: boolean
}

const SKELETON_CHART_COUNT = 3

// Map BERT star ratings to human-readable sentiment labels
const SENTIMENT_LABELS: Record<string, string> = {
  // Star ratings from multilingual BERT model
  '1 star': 'Very Negative',
  '2 stars': 'Negative',
  '3 stars': 'Neutral',
  '4 stars': 'Positive',
  '5 stars': 'Very Positive',
  // Alternative formats
  '1': 'Very Negative',
  '2': 'Negative',
  '3': 'Neutral',
  '4': 'Positive',
  '5': 'Very Positive',
  // Standard labels (fallback)
  positive: 'Positive',
  neutral: 'Neutral',
  negative: 'Negative',
  unknown: 'Unknown',
}

const formatSentimentLabel = (label: string): string =>
  SENTIMENT_LABELS[label?.toLowerCase()] || SENTIMENT_LABELS[label] || label || 'Unknown'

export default function MetricsCharts({ metrics, loading }: MetricsChartsProps) {
  const volumeLabels = metrics?.volume.map((item) => `${item._id.month}/${item._id.day}`) || []
  const volumeData = metrics?.volume.map((item) => item.count) || []
  const sentimentLabels = metrics?.sentimentShare.map((item) => formatSentimentLabel(item._id)) || []
  const sentimentData = metrics?.sentimentShare.map((item) => item.count) || []
  const sourceLabels = metrics?.topSources.map((item) => item._id) || []
  const sourceData = metrics?.topSources.map((item) => item.count) || []

  if (loading) {
    return (
      <div className='mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
        {Array.from({ length: SKELETON_CHART_COUNT }).map((_, index) => (
          <div key={`chart-skeleton-${index}`} className='h-56 rounded-2xl bg-(--surface-muted) animate-pulse' />
        ))}
      </div>
    )
  }

  return (
    <div className='mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
      <ChartCard
        title='Volume'
        description='Mentions per day'
        type='line'
        labels={volumeLabels}
        data={volumeData}
      />
      <ChartCard
        title='Sentiment'
        description='Share of sentiment'
        type='doughnut'
        labels={sentimentLabels}
        data={sentimentData}
      />
      <ChartCard
        title='Sources'
        description='Top mention sources'
        type='bar'
        labels={sourceLabels}
        data={sourceData}
      />
    </div>
  )
}
