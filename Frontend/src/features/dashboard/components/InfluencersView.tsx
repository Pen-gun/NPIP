import { useState } from 'react'
import ChevronDown from 'lucide-react/dist/esm/icons/chevron-down'
import ChevronUp from 'lucide-react/dist/esm/icons/chevron-up'
import ExternalLink from 'lucide-react/dist/esm/icons/external-link'
import Filter from 'lucide-react/dist/esm/icons/filter'
import Star from 'lucide-react/dist/esm/icons/star'
import TrendingUp from 'lucide-react/dist/esm/icons/trending-up'
import Users from 'lucide-react/dist/esm/icons/users'
import type { Mention } from '../../../types/app'
import {
  getInfluencerTier,
  useInfluencersData,
  type InfluencerSortField,
  type InfluencerSortOrder,
} from '../hooks/useInfluencersData'

interface InfluencersViewProps {
  mentions: Mention[]
  loading: boolean
}

export default function InfluencersView({ mentions, loading }: InfluencersViewProps) {
  const [sortField, setSortField] = useState<InfluencerSortField>('score')
  const [sortOrder, setSortOrder] = useState<InfluencerSortOrder>('desc')
  const [sourceFilter, setSourceFilter] = useState<string>('all')
  const [minScore, setMinScore] = useState<number>(0)

  const {
    influencers,
    uniqueSources,
    filteredInfluencers,
    totalReach,
    averageScore,
    eliteCount,
  } = useInfluencersData({
    mentions,
    sourceFilter,
    minScore,
    sortField,
    sortOrder,
  })

  const handleSort = (field: InfluencerSortField) => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortField(field)
      setSortOrder('desc')
    }
  }

  const SortIcon = ({ field }: { field: InfluencerSortField }) => {
    if (sortField !== field) return null
    return sortOrder === 'desc' ? <ChevronDown className='h-4 w-4' /> : <ChevronUp className='h-4 w-4' />
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
      <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
        <div className='rounded-xl border border-(--border) bg-(--surface-base) p-4 shadow-sm'>
          <div className='flex items-center justify-between'>
            <span className='text-xs font-semibold uppercase tracking-wider text-(--text-muted)'>Total Influencers</span>
            <Users className='h-5 w-5 text-(--brand-accent)' />
          </div>
          <p className='mt-2 text-2xl font-bold'>{influencers.length}</p>
        </div>

        <div className='rounded-xl border border-(--border) bg-(--surface-base) p-4 shadow-sm'>
          <div className='flex items-center justify-between'>
            <span className='text-xs font-semibold uppercase tracking-wider text-(--text-muted)'>Elite Tier</span>
            <Star className='h-5 w-5 text-yellow-500' />
          </div>
          <p className='mt-2 text-2xl font-bold'>{eliteCount}</p>
        </div>

        <div className='rounded-xl border border-(--border) bg-(--surface-base) p-4 shadow-sm'>
          <div className='flex items-center justify-between'>
            <span className='text-xs font-semibold uppercase tracking-wider text-(--text-muted)'>Total Reach</span>
            <TrendingUp className='h-5 w-5 text-green-500' />
          </div>
          <p className='mt-2 text-2xl font-bold'>{totalReach.toLocaleString()}</p>
        </div>

        <div className='rounded-xl border border-(--border) bg-(--surface-base) p-4 shadow-sm'>
          <div className='flex items-center justify-between'>
            <span className='text-xs font-semibold uppercase tracking-wider text-(--text-muted)'>Avg. Score</span>
            <Star className='h-5 w-5 text-purple-500' />
          </div>
          <p className='mt-2 text-2xl font-bold'>{averageScore}</p>
        </div>
      </div>

      <div className='flex flex-wrap items-center gap-4 rounded-xl border border-(--border) bg-(--surface-base) p-4 shadow-sm'>
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
            {uniqueSources.map((source) => (
              <option key={source} value={source}>
                {source}
              </option>
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

      <div className='overflow-hidden rounded-xl border border-(--border) bg-(--surface-base) shadow-sm'>
        <div className='overflow-x-auto'>
          <table className='w-full text-sm'>
            <thead className='bg-(--surface-muted)'>
              <tr>
                <th className='p-3 text-left font-medium'>Rank</th>
                <th className='p-3 text-left font-medium'>Influencer</th>
                <th className='cursor-pointer p-3 text-center font-medium hover:bg-(--surface-base)' onClick={() => handleSort('score')}>
                  <div className='flex items-center justify-center gap-1'>
                    Score <SortIcon field='score' />
                  </div>
                </th>
                <th className='cursor-pointer p-3 text-center font-medium hover:bg-(--surface-base)' onClick={() => handleSort('mentionCount')}>
                  <div className='flex items-center justify-center gap-1'>
                    Mentions <SortIcon field='mentionCount' />
                  </div>
                </th>
                <th className='cursor-pointer p-3 text-center font-medium hover:bg-(--surface-base)' onClick={() => handleSort('totalReach')}>
                  <div className='flex items-center justify-center gap-1'>
                    Reach <SortIcon field='totalReach' />
                  </div>
                </th>
                <th className='cursor-pointer p-3 text-center font-medium hover:bg-(--surface-base)' onClick={() => handleSort('totalEngagement')}>
                  <div className='flex items-center justify-center gap-1'>
                    Engagement <SortIcon field='totalEngagement' />
                  </div>
                </th>
                <th className='cursor-pointer p-3 text-center font-medium hover:bg-(--surface-base)' onClick={() => handleSort('avgSentiment')}>
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
                      <span className='block text-xs text-(--text-muted)'>avg {influencer.avgReach.toLocaleString()}</span>
                    </td>
                    <td className='p-3 text-center font-medium'>{influencer.totalEngagement.toLocaleString()}</td>
                    <td className='p-3 text-center'>
                      <span
                        className={`font-medium ${
                          influencer.avgSentiment > 0.2
                            ? 'text-green-600'
                            : influencer.avgSentiment < -0.2
                              ? 'text-red-600'
                              : 'text-(--text-muted)'
                        }`}
                      >
                        {influencer.avgSentiment > 0 ? '+' : ''}
                        {influencer.avgSentiment.toFixed(2)}
                      </span>
                    </td>
                    <td className='p-3 text-center'>
                      <div className='flex flex-wrap justify-center gap-1'>
                        {influencer.sources.slice(0, 3).map((source) => (
                          <span key={source} className='rounded-full bg-(--surface-muted) px-2 py-0.5 text-xs'>
                            {source}
                          </span>
                        ))}
                        {influencer.sources.length > 3 && (
                          <span className='text-xs text-(--text-muted)'>+{influencer.sources.length - 3}</span>
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

      {filteredInfluencers.length > 0 && (
        <div>
          <h3 className='mb-4 text-lg font-semibold'>Top Influencers</h3>
          <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
            {filteredInfluencers.slice(0, 3).map((influencer, idx) => {
              const tier = getInfluencerTier(influencer.score)
              const TierIcon = tier.icon
              const bgColors = [
                'bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20',
                'bg-gradient-to-br from-gray-50 to-slate-50 dark:from-gray-800/50 dark:to-slate-800/50',
                'bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20',
              ]
              const labels = ['1st', '2nd', '3rd']

              return (
                <div key={influencer.author} className={`rounded-xl border border-(--border) p-4 shadow-sm ${bgColors[idx]}`}>
                  <div className='mb-3 flex items-center justify-between'>
                    <span className='text-xl font-semibold'>{labels[idx]}</span>
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

