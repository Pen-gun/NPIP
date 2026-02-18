import type { Mention, Project } from '../../../types/app'

export interface ProjectStats {
  projectId: string
  projectName: string
  totalMentions: number
  totalReach: number
  avgSentiment: number
  sentimentBreakdown: { positive: number; neutral: number; negative: number }
  topSources: { source: string; count: number }[]
  dailyMentions: number[]
  engagement: { likes: number; comments: number; shares: number }
}

export const PROJECT_COLORS = [
  { bg: 'bg-blue-500', text: 'text-blue-600', light: 'bg-blue-50 dark:bg-blue-900/20', border: 'border-blue-200' },
  { bg: 'bg-orange-500', text: 'text-orange-600', light: 'bg-orange-50 dark:bg-orange-900/20', border: 'border-orange-200' },
  { bg: 'bg-green-500', text: 'text-green-600', light: 'bg-green-50 dark:bg-green-900/20', border: 'border-green-200' },
  { bg: 'bg-purple-500', text: 'text-purple-600', light: 'bg-purple-50 dark:bg-purple-900/20', border: 'border-purple-200' },
  { bg: 'bg-pink-500', text: 'text-pink-600', light: 'bg-pink-50 dark:bg-pink-900/20', border: 'border-pink-200' },
] as const

export function buildProjectStats(
  selectedProjects: string[],
  projects: Project[],
  allMentions: Record<string, Mention[]>,
): ProjectStats[] {
  return selectedProjects.map((projectId) => {
    const project = projects.find((item) => item._id === projectId)
    const mentions = allMentions[projectId] || []

    const sentimentBreakdown = { positive: 0, neutral: 0, negative: 0 }
    const sourceCounts: Record<string, number> = {}
    let totalReach = 0
    let sentimentSum = 0
    let totalLikes = 0
    let totalComments = 0
    let totalShares = 0

    const dailyMentions = Array(7).fill(0)
    const now = new Date()

    mentions.forEach((mention) => {
      const source = mention.source || 'Unknown'
      sourceCounts[source] = (sourceCounts[source] || 0) + 1

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

      totalReach += mention.reachEstimate || 0
      totalLikes += mention.engagement?.likes || 0
      totalComments += mention.engagement?.comments || 0
      totalShares += mention.engagement?.shares || 0

      if (mention.publishedAt) {
        const mentionDate = new Date(mention.publishedAt)
        const daysAgo = Math.floor((now.getTime() - mentionDate.getTime()) / (24 * 60 * 60 * 1000))
        if (daysAgo >= 0 && daysAgo < 7) {
          dailyMentions[6 - daysAgo]++
        }
      }
    })

    const topSources = Object.entries(sourceCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([source, count]) => ({ source, count }))

    return {
      projectId,
      projectName: project?.name || 'Unknown',
      totalMentions: mentions.length,
      totalReach,
      avgSentiment: mentions.length ? sentimentSum / mentions.length : 0,
      sentimentBreakdown,
      topSources,
      dailyMentions,
      engagement: { likes: totalLikes, comments: totalComments, shares: totalShares },
    }
  })
}

