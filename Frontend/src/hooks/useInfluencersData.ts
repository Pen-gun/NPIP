import { useMemo } from 'react'
import Award from 'lucide-react/dist/esm/icons/award'
import Crown from 'lucide-react/dist/esm/icons/crown'
import Star from 'lucide-react/dist/esm/icons/star'
import Users from 'lucide-react/dist/esm/icons/users'
import type { Mention } from '../types/app'

export interface InfluencerData {
  author: string
  source: string
  mentionCount: number
  totalReach: number
  avgReach: number
  totalEngagement: number
  avgSentiment: number
  topMention: Mention | null
  sources: string[]
  score: number
}

export type InfluencerSortField = 'score' | 'mentionCount' | 'totalReach' | 'totalEngagement' | 'avgSentiment'
export type InfluencerSortOrder = 'asc' | 'desc'

const calculateInfluenceScore = (data: Omit<InfluencerData, 'score'>): number => {
  const reachWeight = 0.4
  const engagementWeight = 0.3
  const mentionWeight = 0.2
  const sentimentWeight = 0.1

  const reachScore = Math.min(100, (data.totalReach / 100000) * 100)
  const engagementScore = Math.min(100, (data.totalEngagement / 1000) * 100)
  const mentionScore = Math.min(100, data.mentionCount * 10)
  const sentimentScore = ((data.avgSentiment + 1) / 2) * 100

  return Math.round(
    reachScore * reachWeight +
    engagementScore * engagementWeight +
    mentionScore * mentionWeight +
    sentimentScore * sentimentWeight,
  )
}

export const getInfluencerTier = (score: number): { label: string; color: string; icon: typeof Crown } => {
  if (score >= 80) return { label: 'Elite', color: 'text-yellow-500', icon: Crown }
  if (score >= 60) return { label: 'Top', color: 'text-purple-500', icon: Award }
  if (score >= 40) return { label: 'Rising', color: 'text-blue-500', icon: Star }
  return { label: 'Emerging', color: 'text-gray-500', icon: Users }
}

interface UseInfluencersDataParams {
  mentions: Mention[]
  sourceFilter: string
  minScore: number
  sortField: InfluencerSortField
  sortOrder: InfluencerSortOrder
}

export function useInfluencersData({
  mentions,
  sourceFilter,
  minScore,
  sortField,
  sortOrder,
}: UseInfluencersDataParams) {
  const influencers = useMemo(() => {
    const authorMap = new Map<string, { mentions: Mention[]; sources: Set<string> }>()

    mentions.forEach((mention) => {
      const author = mention.author || 'Unknown'
      if (!authorMap.has(author)) {
        authorMap.set(author, { mentions: [], sources: new Set() })
      }
      const data = authorMap.get(author)
      if (!data) return
      data.mentions.push(mention)
      if (mention.source) data.sources.add(mention.source)
    })

    const influencerList: InfluencerData[] = []

    authorMap.forEach((data, author) => {
      if (author === 'Unknown' || data.mentions.length === 0) return

      let totalReach = 0
      let totalEngagement = 0
      let sentimentSum = 0
      let sentimentCount = 0
      let topMention: Mention | null = null
      let maxReach = 0

      data.mentions.forEach((mention) => {
        totalReach += mention.reachEstimate || 0
        totalEngagement +=
          (mention.engagement?.likes || 0) +
          (mention.engagement?.comments || 0) +
          (mention.engagement?.shares || 0)

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

  const uniqueSources = useMemo(() => {
    const sources = new Set<string>()
    influencers.forEach((influencer) => influencer.sources.forEach((source) => sources.add(source)))
    return Array.from(sources).sort()
  }, [influencers])

  const filteredInfluencers = useMemo(() => {
    let filtered = [...influencers]

    if (sourceFilter !== 'all') {
      filtered = filtered.filter((influencer) => influencer.sources.includes(sourceFilter))
    }

    if (minScore > 0) {
      filtered = filtered.filter((influencer) => influencer.score >= minScore)
    }

    filtered.sort((a, b) => {
      const aVal = a[sortField]
      const bVal = b[sortField]
      if (sortOrder === 'asc') return aVal - bVal
      return bVal - aVal
    })

    return filtered
  }, [influencers, sourceFilter, minScore, sortField, sortOrder])

  const totalReach = useMemo(
    () => influencers.reduce((sum, influencer) => sum + influencer.totalReach, 0),
    [influencers],
  )

  const averageScore = useMemo(
    () => Math.round(influencers.reduce((sum, influencer) => sum + influencer.score, 0) / influencers.length || 0),
    [influencers],
  )

  const eliteCount = useMemo(
    () => influencers.filter((influencer) => influencer.score >= 80).length,
    [influencers],
  )

  return {
    influencers,
    uniqueSources,
    filteredInfluencers,
    totalReach,
    averageScore,
    eliteCount,
  }
}
