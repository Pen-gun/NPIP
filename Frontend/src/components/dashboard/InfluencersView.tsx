import { useMemo, useState } from 'react'
import Award from 'lucide-react/dist/esm/icons/award'
import ChevronDown from 'lucide-react/dist/esm/icons/chevron-down'
import ChevronUp from 'lucide-react/dist/esm/icons/chevron-up'
import Crown from 'lucide-react/dist/esm/icons/crown'
import ExternalLink from 'lucide-react/dist/esm/icons/external-link'
import Filter from 'lucide-react/dist/esm/icons/filter'
import Star from 'lucide-react/dist/esm/icons/star'
import TrendingUp from 'lucide-react/dist/esm/icons/trending-up'
import Users from 'lucide-react/dist/esm/icons/users'
import type { Mention } from '../../types/app'

interface InfluencersViewProps {
  mentions: Mention[]
  loading: boolean
}

interface InfluencerData {
  author: string
  source: string
  mentionCount: number
  totalReach: number
  avgReach: number
  totalEngagement: number
  avgSentiment: number
  topMention: Mention | null
  sources: string[]
  score: number // Computed influence score
}

type SortField = 'score' | 'mentionCount' | 'totalReach' | 'totalEngagement' | 'avgSentiment'
type SortOrder = 'asc' | 'desc'

// Calculate influence score based on multiple factors
const calculateInfluenceScore = (data: Omit<InfluencerData, 'score'>): number => {
  const reachWeight = 0.4
  const engagementWeight = 0.3
  const mentionWeight = 0.2
  const sentimentWeight = 0.1

  // Normalize values to 0-100 scale (these are rough heuristics)
  const reachScore = Math.min(100, (data.totalReach / 100000) * 100)
  const engagementScore = Math.min(100, (data.totalEngagement / 1000) * 100)
  const mentionScore = Math.min(100, data.mentionCount * 10)
  const sentimentScore = ((data.avgSentiment + 1) / 2) * 100 // Convert -1 to 1 range to 0-100

  return Math.round(
    reachScore * reachWeight +
    engagementScore * engagementWeight +
    mentionScore * mentionWeight +
    sentimentScore * sentimentWeight
  )
}

// Get tier based on influence score
const getInfluencerTier = (score: number): { label: string; color: string; icon: typeof Crown } => {
  if (score >= 80) return { label: 'Elite', color: 'text-yellow-500', icon: Crown }
  if (score >= 60) return { label: 'Top', color: 'text-purple-500', icon: Award }
  if (score >= 40) return { label: 'Rising', color: 'text-blue-500', icon: Star }
  return { label: 'Emerging', color: 'text-gray-500', icon: Users }
}

export default function InfluencersView({ mentions, loading }: InfluencersViewProps) {
  const [sortField, setSortField] = useState<SortField>('score')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')
  const [sourceFilter, setSourceFilter] = useState<string>('all')
  const [minScore, setMinScore] = useState<number>(0)

  // Calculate influencer data from mentions
  const influencers = useMemo(() => {
    const authorMap = new Map<string, {
      mentions: Mention[]
      sources: Set<string>
    }>()

    // Group mentions by author
    mentions.forEach(mention => {
      const author = mention.author || 'Unknown'
      if (!authorMap.has(author)) {
        authorMap.set(author, { mentions: [], sources: new Set() })
      }
      const data = authorMap.get(author)!
      data.mentions.push(mention)
      if (mention.source) data.sources.add(mention.source)
    })

    // Calculate stats for each author
    const influencerList: InfluencerData[] = []

    authorMap.forEach((data, author) => {
      if (author === 'Unknown' || data.mentions.length === 0) return

      let totalReach = 0
      let totalEngagement = 0
      let sentimentSum = 0
      let sentimentCount = 0
      let topMention: Mention | null = null
      let maxReach = 0

      data.mentions.forEach(mention => {
        totalReach += mention.reachEstimate || 0
        totalEngagement += (mention.engagement?.likes || 0) + 
                          (mention.engagement?.comments || 0) + 
                          (mention.engagement?.shares || 0)

        // Calculate sentiment
        const label = (mention.sentiment?.label || '').toLowerCase()
        if (label.includes('positive') || label.includes('4') || label.includes('5')) {
          sentimentSum += 1
          sentimentCount++
        } else if (label.includes('negative') || label.includes('1') || label.includes('2')) {
          sentimentSum -= 1
          sentimentCount++
        } else if (label) {
          sentimentCount++
        }

        // Track top mention by reach
        const reach = mention.reachEstimate || 0
        if (reach > maxReach) {
          maxReach = reach
          topMention = mention
        }
      })

      const baseData = {
        author,
        source: data.mentions[0]?.source || 'Unknown',
        mentionCount: data.mentions.length,
        totalReach,
        avgReach: Math.round(totalReach / data.mentions.length),
        totalEngagement,
        avgSentiment: sentimentCount > 0 ? sentimentSum / sentimentCount : 0,
        topMention,
        sources: Array.from(data.sources),
      }

      influencerList.push({
        ...baseData,
        score: calculateInfluenceScore(baseData),
      })
    })

    return influencerList
  }, [mentions])

  // Get unique sources for filter
  const uniqueSources = useMemo(() => {
    const sources = new Set<string>()
    influencers.forEach(inf => inf.sources.forEach(s => sources.add(s)))
    return Array.from(sources).sort()
  }, [influencers])

  // Filter and sort influencers
  const filteredInfluencers = useMemo(() => {
    let filtered = influencers

    // Apply source filter
    if (sourceFilter !== 'all') {
      filtered = filtered.filter(inf => inf.sources.includes(sourceFilter))
    }

    // Apply minimum score filter
    if (minScore > 0) {
      filtered = filtered.filter(inf => inf.score >= minScore)
    }

    // Sort
    filtered.sort((a, b) => {
      const aVal = a[sortField]
      const bVal = b[sortField]
      if (sortOrder === 'asc') return aVal - bVal
      return bVal - aVal
    })

    return filtered
  }, [influencers, sourceFilter, minScore, sortField, sortOrder])

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortOrder('desc')
    }
  }

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null
    return sortOrder === 'desc' 
      ? <ChevronDown className='h-4 w-4' />
      : <ChevronUp className='h-4 w-4' />
  }

  if (loading) {
    return (
      <div className='space-y-4'>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className='h-20 animate-pulse rounded-xl bg-(--surface-muted)' />
        ))}
      </div>
    )
  }

  if (mentions.length === 0) {
    return (
      <div className='flex flex-col items-center justify-center rounded-xl border border-(--border) bg-(--surface-base) p-12 text-center'>
        <Users className='mb-4 h-12 w-12 text-(--text-muted)' />
        <h3 className='text-lg font-semibold'>No Influencer Data</h3>
        <p className='mt-2 text-sm text-(--text-muted)'>
          Start tracking mentions to identify key influencers in your space.
        </p>
      </div>
    )
  }

  return (
    <div className='space-y-6'>
      {/* Stats Overview */}
      <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
        <div className='rounded-xl border border-(--border) bg-(--surface-base) p-4 shadow-(--shadow)'>
          <div className='flex items-center justify-between'>
            <span className='text-xs font-semibold uppercase tracking-wider text-(--text-muted)'>Total Influencers</span>
            <Users className='h-5 w-5 text-(--brand-accent)' />
          </div>
          <p className='mt-2 text-2xl font-bold'>{influencers.length}</p>
        </div>

        <div className='rounded-xl border border-(--border) bg-(--surface-base) p-4 shadow-(--shadow)'>
          <div className='flex items-center justify-between'>
            <span className='text-xs font-semibold uppercase tracking-wider text-(--text-muted)'>Elite Tier</span>
            <Crown className='h-5 w-5 text-yellow-500' />
          </div>
          <p className='mt-2 text-2xl font-bold'>{influencers.filter(i => i.score >= 80).length}</p>
        </div>

        <div className='rounded-xl border border-(--border) bg-(--surface-base) p-4 shadow-(--shadow)'>
          <div className='flex items-center justify-between'>
            <span className='text-xs font-semibold uppercase tracking-wider text-(--text-muted)'>Total Reach</span>
            <TrendingUp className='h-5 w-5 text-green-500' />
          </div>
          <p className='mt-2 text-2xl font-bold'>
            {influencers.reduce((sum, i) => sum + i.totalReach, 0).toLocaleString()}
          </p>
        </div>

        <div className='rounded-xl border border-(--border) bg-(--surface-base) p-4 shadow-(--shadow)'>
          <div className='flex items-center justify-between'>
            <span className='text-xs font-semibold uppercase tracking-wider text-(--text-muted)'>Avg. Score</span>
            <Star className='h-5 w-5 text-purple-500' />
          </div>
          <p className='mt-2 text-2xl font-bold'>
            {Math.round(influencers.reduce((sum, i) => sum + i.score, 0) / influencers.length || 0)}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className='flex flex-wrap items-center gap-4 rounded-xl border border-(--border) bg-(--surface-base) p-4 shadow-(--shadow)'>
        <div className='flex items-center gap-2'>
          <Filter className='h-4 w-4 text-(--text-muted)' />
          <span className='text-sm font-medium'>Filters:</span>
        </div>

        <div className='flex items-center gap-2'>
          <label className='text-sm text-(--text-muted)'>Source:</label>
          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            className='rounded-lg border border-(--border) bg-(--surface-muted) px-3 py-1.5 text-sm'
          >
            <option value='all'>All Sources</option>
            {uniqueSources.map(source => (
              <option key={source} value={source}>{source}</option>
            ))}
          </select>
        </div>

        <div className='flex items-center gap-2'>
          <label className='text-sm text-(--text-muted)'>Min Score:</label>
          <input
            type='range'
            min='0'
            max='100'
            value={minScore}
            onChange={(e) => setMinScore(Number(e.target.value))}
            className='w-24'
          />
          <span className='text-sm font-medium'>{minScore}</span>
        </div>

        <div className='ml-auto text-sm text-(--text-muted)'>
          Showing {filteredInfluencers.length} of {influencers.length}
        </div>
      </div>

      {/* Influencer Table */}
      <div className='overflow-hidden rounded-xl border border-(--border) bg-(--surface-base) shadow-(--shadow)'>
        <div className='overflow-x-auto'>
          <table className='w-full text-sm'>
            <thead className='bg-(--surface-muted)'>
              <tr>
                <th className='p-3 text-left font-medium'>Rank</th>
                <th className='p-3 text-left font-medium'>Influencer</th>
                <th 
                  className='cursor-pointer p-3 text-center font-medium hover:bg-(--surface-base)'
                  onClick={() => handleSort('score')}
                >
                  <div className='flex items-center justify-center gap-1'>
                    Score <SortIcon field='score' />
                  </div>
                </th>
                <th 
                  className='cursor-pointer p-3 text-center font-medium hover:bg-(--surface-base)'
                  onClick={() => handleSort('mentionCount')}
                >
                  <div className='flex items-center justify-center gap-1'>
                    Mentions <SortIcon field='mentionCount' />
                  </div>
                </th>
                <th 
                  className='cursor-pointer p-3 text-center font-medium hover:bg-(--surface-base)'
                  onClick={() => handleSort('totalReach')}
                >
                  <div className='flex items-center justify-center gap-1'>
                    Reach <SortIcon field='totalReach' />
                  </div>
                </th>
                <th 
                  className='cursor-pointer p-3 text-center font-medium hover:bg-(--surface-base)'
                  onClick={() => handleSort('totalEngagement')}
                >
                  <div className='flex items-center justify-center gap-1'>
                    Engagement <SortIcon field='totalEngagement' />
                  </div>
                </th>
                <th 
                  className='cursor-pointer p-3 text-center font-medium hover:bg-(--surface-base)'
                  onClick={() => handleSort('avgSentiment')}
                >
                  <div className='flex items-center justify-center gap-1'>
                    Sentiment <SortIcon field='avgSentiment' />
                  </div>
                </th>
                <th className='p-3 text-center font-medium'>Platforms</th>
              </tr>
            </thead>
            <tbody className='divide-y divide-(--border)'>
              {filteredInfluencers.slice(0, 50).map((influencer, idx) => {
                const tier = getInfluencerTier(influencer.score)
                const TierIcon = tier.icon

                return (
                  <tr key={influencer.author} className='hover:bg-(--surface-muted)'>
                    <td className='p-3'>
                      <div className='flex h-8 w-8 items-center justify-center rounded-full bg-(--surface-muted) text-sm font-bold'>
                        {idx + 1}
                      </div>
                    </td>
                    <td className='p-3'>
                      <div className='flex items-center gap-3'>
                        <div className='flex h-10 w-10 items-center justify-center rounded-full bg-(--surface-muted) text-lg font-semibold'>
                          {influencer.author.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className='font-medium'>{influencer.author}</p>
                          <div className={`flex items-center gap-1 text-xs ${tier.color}`}>
                            <TierIcon className='h-3 w-3' />
                            {tier.label} Influencer
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className='p-3 text-center'>
                      <div className='inline-flex items-center gap-1 rounded-full bg-(--surface-muted) px-3 py-1'>
                        <span className='text-lg font-bold'>{influencer.score}</span>
                        <span className='text-xs text-(--text-muted)'>/100</span>
                      </div>
                    </td>
                    <td className='p-3 text-center font-medium'>{influencer.mentionCount}</td>
                    <td className='p-3 text-center'>
                      <span className='font-medium'>{influencer.totalReach.toLocaleString()}</span>
                      <span className='block text-xs text-(--text-muted)'>
                        avg {influencer.avgReach.toLocaleString()}
                      </span>
                    </td>
                    <td className='p-3 text-center font-medium'>{influencer.totalEngagement.toLocaleString()}</td>
                    <td className='p-3 text-center'>
                      <span className={`font-medium ${
                        influencer.avgSentiment > 0.2 ? 'text-green-600' :
                        influencer.avgSentiment < -0.2 ? 'text-red-600' : 'text-(--text-muted)'
                      }`}>
                        {influencer.avgSentiment > 0 ? '+' : ''}{influencer.avgSentiment.toFixed(2)}
                      </span>
                    </td>
                    <td className='p-3 text-center'>
                      <div className='flex flex-wrap justify-center gap-1'>
                        {influencer.sources.slice(0, 3).map(source => (
                          <span 
                            key={source}
                            className='rounded-full bg-(--surface-muted) px-2 py-0.5 text-xs'
                          >
                            {source}
                          </span>
                        ))}
                        {influencer.sources.length > 3 && (
                          <span className='text-xs text-(--text-muted)'>
                            +{influencer.sources.length - 3}
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {filteredInfluencers.length > 50 && (
          <div className='border-t border-(--border) p-3 text-center text-sm text-(--text-muted)'>
            Showing top 50 of {filteredInfluencers.length} influencers
          </div>
        )}
      </div>

      {/* Top Influencer Cards */}
      {filteredInfluencers.length > 0 && (
        <div>
          <h3 className='mb-4 text-lg font-semibold'>Top Influencers</h3>
          <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
            {filteredInfluencers.slice(0, 3).map((influencer, idx) => {
              const tier = getInfluencerTier(influencer.score)
              const TierIcon = tier.icon
              const bgColors = ['bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20',
                               'bg-gradient-to-br from-gray-50 to-slate-50 dark:from-gray-800/50 dark:to-slate-800/50',
                               'bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20']
              const medals = ['🥇', '🥈', '🥉']

              return (
                <div key={influencer.author} className={`rounded-xl border border-(--border) p-4 shadow-(--shadow) ${bgColors[idx]}`}>
                  <div className='mb-3 flex items-center justify-between'>
                    <span className='text-2xl'>{medals[idx]}</span>
                    <div className={`flex items-center gap-1 ${tier.color}`}>
                      <TierIcon className='h-4 w-4' />
                      <span className='text-sm font-medium'>{tier.label}</span>
                    </div>
                  </div>
                  <div className='mb-3 flex items-center gap-3'>
                    <div className='flex h-12 w-12 items-center justify-center rounded-full bg-white text-xl font-bold shadow-sm dark:bg-(--surface-muted)'>
                      {influencer.author.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className='font-semibold'>{influencer.author}</p>
                      <p className='text-sm text-(--text-muted)'>{influencer.sources.join(', ')}</p>
                    </div>
                  </div>
                  <div className='grid grid-cols-2 gap-2 text-center text-sm'>
                    <div className='rounded-lg bg-white/50 p-2 dark:bg-(--surface-muted)'>
                      <p className='font-bold'>{influencer.score}</p>
                      <p className='text-xs text-(--text-muted)'>Score</p>
                    </div>
                    <div className='rounded-lg bg-white/50 p-2 dark:bg-(--surface-muted)'>
                      <p className='font-bold'>{influencer.totalReach.toLocaleString()}</p>
                      <p className='text-xs text-(--text-muted)'>Reach</p>
                    </div>
                  </div>
                  {influencer.topMention?.url && (
                    <a
                      href={influencer.topMention.url}
                      target='_blank'
                      rel='noopener noreferrer'
                      className='mt-3 flex items-center justify-center gap-1 text-sm text-(--brand-accent) hover:underline'
                    >
                      View Top Mention <ExternalLink className='h-3 w-3' />
                    </a>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
