import { useMemo } from 'react'
import BarChart3 from 'lucide-react/dist/esm/icons/bar-chart-3'
import MessageSquare from 'lucide-react/dist/esm/icons/message-square'
import Minus from 'lucide-react/dist/esm/icons/minus'
import Share2 from 'lucide-react/dist/esm/icons/share-2'
import TrendingDown from 'lucide-react/dist/esm/icons/trending-down'
import TrendingUp from 'lucide-react/dist/esm/icons/trending-up'
import Users from 'lucide-react/dist/esm/icons/users'
import ChartCard from '../../../components/ChartCard'
import type { Mention } from '../../../types/app'

interface AnalysisViewProps {
  mentions: Mention[]
  loading: boolean
}

// Get trend icon based on change value
const TrendIcon = ({ change }: { change: number }) => {
  if (change > 0) return <TrendingUp className='h-4 w-4 text-green-500' />
  if (change < 0) return <TrendingDown className='h-4 w-4 text-red-500' />
  return <Minus className='h-4 w-4 text-(--text-muted)' />
}

export default function AnalysisView({ mentions, loading }: AnalysisViewProps) {
  // Calculate analytics from mentions
  const analytics = useMemo(() => {
    if (!mentions.length) {
      return {
        totalMentions: 0,
        totalReach: 0,
        avgSentiment: 0,
        topAuthors: [] as { author: string; count: number }[],
        topSources: [] as { source: string; count: number }[],
        sentimentBreakdown: { positive: 0, neutral: 0, negative: 0 },
        engagementStats: { totalLikes: 0, totalComments: 0, totalShares: 0 },
        hourlyDistribution: Array(24).fill(0) as number[],
        dayDistribution: Array(7).fill(0) as number[],
      }
    }

    const authorCounts: Record<string, number> = {}
    const sourceCounts: Record<string, number> = {}
    const sentimentBreakdown = { positive: 0, neutral: 0, negative: 0 }
    const hourlyDistribution = Array(24).fill(0)
    const dayDistribution = Array(7).fill(0)
    let totalReach = 0
    let totalLikes = 0
    let totalComments = 0
    let totalShares = 0
    let sentimentSum = 0

    mentions.forEach(mention => {
      // Author counts
      const author = mention.author || 'Unknown'
      authorCounts[author] = (authorCounts[author] || 0) + 1

      // Source counts
      const source = mention.source || 'Unknown'
      sourceCounts[source] = (sourceCounts[source] || 0) + 1

      // Sentiment
      const sentiment = mention.sentiment?.label?.toLowerCase() || ''
      if (sentiment.includes('positive') || sentiment.includes('4') || sentiment.includes('5')) {
        sentimentBreakdown.positive++
        sentimentSum += 1
      } else if (sentiment.includes('negative') || sentiment.includes('1') || sentiment.includes('2')) {
        sentimentBreakdown.negative++
        sentimentSum -= 1
      } else {
        sentimentBreakdown.neutral++
      }

      // Reach & Engagement
      totalReach += mention.reachEstimate || 0
      totalLikes += mention.engagement?.likes || 0
      totalComments += mention.engagement?.comments || 0
      totalShares += mention.engagement?.shares || 0

      // Time distribution
      if (mention.publishedAt) {
        const date = new Date(mention.publishedAt)
        hourlyDistribution[date.getHours()]++
        dayDistribution[date.getDay()]++
      }
    })

    const topAuthors = Object.entries(authorCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([author, count]) => ({ author, count }))

    const topSources = Object.entries(sourceCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([source, count]) => ({ source, count }))

    return {
      totalMentions: mentions.length,
      totalReach,
      avgSentiment: mentions.length ? sentimentSum / mentions.length : 0,
      topAuthors,
      topSources,
      sentimentBreakdown,
      engagementStats: { totalLikes, totalComments, totalShares },
      hourlyDistribution,
      dayDistribution,
    }
  }, [mentions])

  // Hourly distribution labels and data
  const hourlyLabels = Array.from({ length: 24 }, (_, i) => `${i}:00`)

  // Day distribution labels
  const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  // Source distribution data
  const sourceLabels = analytics.topSources.map(s => s.source)
  const sourceData = analytics.topSources.map(s => s.count)

  if (loading) {
    return (
      <div className='space-y-6'>
        <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className='h-28 animate-pulse rounded-xl bg-(--surface-muted)' />
          ))}
        </div>
        <div className='grid gap-4 lg:grid-cols-2'>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className='h-64 animate-pulse rounded-xl bg-(--surface-muted)' />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className='space-y-6'>
      {/* Key Metrics Cards */}
      <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
        <div className='rounded-xl border border-(--border) bg-(--surface-base) p-4 shadow-sm'>
          <div className='flex items-center justify-between'>
            <span className='text-xs font-semibold uppercase tracking-wider text-(--text-muted)'>Total Mentions</span>
            <MessageSquare className='h-5 w-5 text-(--brand-accent)' />
          </div>
          <p className='mt-2 text-2xl font-bold'>{analytics.totalMentions.toLocaleString()}</p>
          <div className='mt-1 flex items-center gap-1 text-xs text-(--text-muted)'>
            <TrendIcon change={5} />
            <span>from last period</span>
          </div>
        </div>

        <div className='rounded-xl border border-(--border) bg-(--surface-base) p-4 shadow-sm'>
          <div className='flex items-center justify-between'>
            <span className='text-xs font-semibold uppercase tracking-wider text-(--text-muted)'>Est. Reach</span>
            <Users className='h-5 w-5 text-blue-500' />
          </div>
          <p className='mt-2 text-2xl font-bold'>{analytics.totalReach.toLocaleString()}</p>
          <div className='mt-1 flex items-center gap-1 text-xs text-(--text-muted)'>
            <TrendIcon change={12} />
            <span>from last period</span>
          </div>
        </div>

        <div className='rounded-xl border border-(--border) bg-(--surface-base) p-4 shadow-sm'>
          <div className='flex items-center justify-between'>
            <span className='text-xs font-semibold uppercase tracking-wider text-(--text-muted)'>Total Engagement</span>
            <Share2 className='h-5 w-5 text-green-500' />
          </div>
          <p className='mt-2 text-2xl font-bold'>
            {(analytics.engagementStats.totalLikes + analytics.engagementStats.totalComments + analytics.engagementStats.totalShares).toLocaleString()}
          </p>
          <div className='mt-1 text-xs text-(--text-muted)'>
            {analytics.engagementStats.totalLikes} likes · {analytics.engagementStats.totalComments} comments · {analytics.engagementStats.totalShares} shares
          </div>
        </div>

        <div className='rounded-xl border border-(--border) bg-(--surface-base) p-4 shadow-sm'>
          <div className='flex items-center justify-between'>
            <span className='text-xs font-semibold uppercase tracking-wider text-(--text-muted)'>Sentiment Score</span>
            <BarChart3 className='h-5 w-5 text-purple-500' />
          </div>
          <p className='mt-2 text-2xl font-bold'>
            {analytics.avgSentiment > 0 ? '+' : ''}{analytics.avgSentiment.toFixed(2)}
          </p>
          <div className='mt-1 text-xs'>
            <span className='text-green-500'>{analytics.sentimentBreakdown.positive} positive</span>
            {' · '}
            <span className='text-(--text-muted)'>{analytics.sentimentBreakdown.neutral} neutral</span>
            {' · '}
            <span className='text-red-500'>{analytics.sentimentBreakdown.negative} negative</span>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className='grid gap-4 lg:grid-cols-2'>
        <ChartCard 
          title='Mentions by Hour of Day'
          description={`Peak activity at ${analytics.hourlyDistribution.indexOf(Math.max(...analytics.hourlyDistribution))}:00`}
          type='bar'
          labels={hourlyLabels}
          data={analytics.hourlyDistribution}
        />

        <ChartCard 
          title='Mentions by Day of Week'
          description='Distribution of mentions across weekdays'
          type='bar'
          labels={dayLabels}
          data={analytics.dayDistribution}
        />

        <ChartCard 
          title='Source Distribution'
          description='Breakdown by platform/source'
          type='doughnut'
          labels={sourceLabels}
          data={sourceData}
        />

        <div className='rounded-xl border border-(--border) bg-(--surface-base) p-4 shadow-sm'>
          <h3 className='mb-4 text-sm font-semibold'>Top Authors</h3>
          <div className='max-h-48 space-y-2 overflow-y-auto'>
            {analytics.topAuthors.length === 0 ? (
              <p className='text-sm text-(--text-muted)'>No authors found</p>
            ) : (
              analytics.topAuthors.map((item, idx) => (
                <div key={item.author} className='flex items-center justify-between text-sm'>
                  <span className='flex items-center gap-2'>
                    <span className='flex h-6 w-6 items-center justify-center rounded-full bg-(--surface-muted) text-xs font-semibold'>
                      {idx + 1}
                    </span>
                    <span className='truncate'>{item.author}</span>
                  </span>
                  <span className='rounded-full border border-(--border) px-2 py-0.5 text-xs'>
                    {item.count} mentions
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Sentiment Deep Dive */}
      <div className='rounded-xl border border-(--border) bg-(--surface-base) p-4 shadow-sm'>
        <h3 className='mb-4 text-sm font-semibold'>Sentiment Analysis Summary</h3>
        <div className='grid gap-4 sm:grid-cols-3'>
          <div className='rounded-lg bg-green-50 p-4 dark:bg-green-900/20'>
            <p className='text-2xl font-bold text-green-600'>{analytics.sentimentBreakdown.positive}</p>
            <p className='text-sm text-green-700 dark:text-green-400'>Positive Mentions</p>
            <p className='mt-1 text-xs text-green-600'>
              {analytics.totalMentions > 0 
                ? `${Math.round((analytics.sentimentBreakdown.positive / analytics.totalMentions) * 100)}%`
                : '0%'
              } of total
            </p>
          </div>
          <div className='rounded-lg bg-gray-50 p-4 dark:bg-gray-800/50'>
            <p className='text-2xl font-bold text-gray-600 dark:text-gray-300'>{analytics.sentimentBreakdown.neutral}</p>
            <p className='text-sm text-gray-700 dark:text-gray-400'>Neutral Mentions</p>
            <p className='mt-1 text-xs text-gray-600'>
              {analytics.totalMentions > 0 
                ? `${Math.round((analytics.sentimentBreakdown.neutral / analytics.totalMentions) * 100)}%`
                : '0%'
              } of total
            </p>
          </div>
          <div className='rounded-lg bg-red-50 p-4 dark:bg-red-900/20'>
            <p className='text-2xl font-bold text-red-600'>{analytics.sentimentBreakdown.negative}</p>
            <p className='text-sm text-red-700 dark:text-red-400'>Negative Mentions</p>
            <p className='mt-1 text-xs text-red-600'>
              {analytics.totalMentions > 0 
                ? `${Math.round((analytics.sentimentBreakdown.negative / analytics.totalMentions) * 100)}%`
                : '0%'
              } of total
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

