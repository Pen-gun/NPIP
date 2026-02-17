import { useEffect, useMemo, useState } from 'react'
import type { Mention } from '../types/app'
import { INITIAL_FILTERS, SOURCE_LABELS, getDateRange, normalizeSentiment, normalizeSource } from '../components/dashboard/dashboardUtils'
import type { DashboardFilters } from '../components/dashboard/DashboardFiltersBar'

interface UseDashboardFiltersParams {
  activeProjectId: string
  mentions: Mention[]
}

type SentimentKey = 'negative' | 'neutral' | 'positive'

export function useDashboardFilters({ activeProjectId, mentions }: UseDashboardFiltersParams) {
  const [filters, setFilters] = useState<DashboardFilters>({ ...INITIAL_FILTERS })
  const [mentionSearch, setMentionSearch] = useState('')
  const [chartGranularity, setChartGranularity] = useState<'days' | 'weeks' | 'months'>('days')
  const [dateRange, setDateRange] = useState('last_30_days')
  const [sourceFilters, setSourceFilters] = useState<Record<string, boolean>>({})
  const [sentimentFilters, setSentimentFilters] = useState<Record<string, boolean>>({})
  const [influenceScore, setInfluenceScore] = useState(6)
  const [continentFilter, setContinentFilter] = useState('')
  const [countryFilter, setCountryFilter] = useState('')
  const [sortOrder, setSortOrder] = useState<'recent' | 'oldest' | 'reach'>('recent')
  const [currentPage, setCurrentPage] = useState(1)

  const filtersStorageKey = useMemo(
    () => `npip_filters_v1_${activeProjectId}`,
    [activeProjectId],
  )

  const handleDateRangeChange = (value: string) => {
    setDateRange(value)
    const range = getDateRange(value)
    setFilters((prev) => ({ ...prev, from: range.from, to: range.to }))
    setCurrentPage(1)
  }

  const handleSourceFilterToggle = (sourceId: string) => {
    setSourceFilters((prev) => ({ ...prev, [sourceId]: !prev[sourceId] }))
    setCurrentPage(1)
  }

  const handleSentimentToggle = (key: SentimentKey) => {
    setSentimentFilters((prev) => ({ ...prev, [key]: !prev[key] }))
    setCurrentPage(1)
  }

  const handleSaveFilters = () => {
    if (!activeProjectId) return
    const savedFilters = {
      dateRange,
      sourceFilters,
      sentimentFilters,
      influenceScore,
      continentFilter,
      countryFilter,
    }
    localStorage.setItem(filtersStorageKey, JSON.stringify(savedFilters))
    alert('Filters saved!')
  }

  const handleClearFilters = () => {
    setDateRange('last_30_days')
    const range = getDateRange('last_30_days')
    setFilters((prev) => ({ ...prev, from: range.from, to: range.to }))
    setSourceFilters({})
    setSentimentFilters({})
    setInfluenceScore(6)
    setContinentFilter('')
    setCountryFilter('')
    setMentionSearch('')
    setCurrentPage(1)
    if (activeProjectId) {
      localStorage.removeItem(filtersStorageKey)
    }
  }

  useEffect(() => {
    if (!activeProjectId) return
    const saved = localStorage.getItem(filtersStorageKey)
    if (!saved) return
    try {
      const parsed = JSON.parse(saved)
      if (parsed.dateRange) {
        setDateRange(parsed.dateRange)
        const range = getDateRange(parsed.dateRange)
        setFilters((prev) => ({ ...prev, from: range.from, to: range.to }))
      }
      if (parsed.sourceFilters) setSourceFilters(parsed.sourceFilters)
      if (parsed.sentimentFilters) setSentimentFilters(parsed.sentimentFilters)
      if (parsed.influenceScore) setInfluenceScore(parsed.influenceScore)
      if (parsed.continentFilter) setContinentFilter(parsed.continentFilter)
      if (parsed.countryFilter) setCountryFilter(parsed.countryFilter)
    } catch {
      // ignore invalid saved filters
    }
  }, [activeProjectId, filtersStorageKey])

  useEffect(() => {
    setCurrentPage(1)
  }, [activeProjectId])

  const mentionsBySource = useMemo(() => {
    const counts: Record<string, number> = {}
    mentions.forEach((mention) => {
      const sourceId = normalizeSource(mention.source)
      if (!sourceId) return
      counts[sourceId] = (counts[sourceId] || 0) + 1
    })
    return counts
  }, [mentions])

  const filteredMentions = useMemo(() => {
    const query = mentionSearch.trim().toLowerCase()
    const activeSources = Object.entries(sourceFilters).filter(([, enabled]) => enabled).map(([key]) => key)
    const activeSentiments = Object.entries(sentimentFilters).filter(([, enabled]) => enabled).map(([key]) => key)

    const filtered = mentions.filter((mention) => {
      if (query) {
        const haystack = `${mention.title || ''} ${mention.text || ''} ${mention.author || ''} ${mention.url || ''}`.toLowerCase()
        if (!haystack.includes(query)) return false
      }

      if (activeSources.length) {
        const sourceId = normalizeSource(mention.source)
        if (!sourceId || !activeSources.includes(sourceId)) return false
      }

      if (activeSentiments.length) {
        const sentiment = normalizeSentiment(mention.sentiment?.label)
        if (!sentiment || !activeSentiments.includes(sentiment)) return false
      }

      return true
    })

    const getTimestamp = (value?: string | Date | null) => {
      if (!value) return 0
      const date = new Date(value)
      return Number.isNaN(date.getTime()) ? 0 : date.getTime()
    }

    const sorted = [...filtered]
    if (sortOrder === 'recent') {
      sorted.sort((a, b) => getTimestamp(b.publishedAt) - getTimestamp(a.publishedAt))
    } else if (sortOrder === 'oldest') {
      sorted.sort((a, b) => getTimestamp(a.publishedAt) - getTimestamp(b.publishedAt))
    } else if (sortOrder === 'reach') {
      sorted.sort((a, b) => (b.reachEstimate || 0) - (a.reachEstimate || 0))
    }
    return sorted
  }, [mentionSearch, mentions, sentimentFilters, sourceFilters, sortOrder])

  const appliedFilters = useMemo(() => {
    const chips: Array<{ id: string; label: string }> = []

    if (mentionSearch.trim()) {
      chips.push({ id: 'search', label: `Search: ${mentionSearch.trim()}` })
    }

    if (dateRange !== 'last_30_days') {
      const labelMap: Record<string, string> = {
        last_7_days: 'Last 7 days',
        last_30_days: 'Last 30 days',
        last_90_days: 'Last 90 days',
      }
      chips.push({ id: 'date', label: `Date: ${labelMap[dateRange] || 'Custom'}` })
    }

    Object.entries(sourceFilters)
      .filter(([, enabled]) => enabled)
      .forEach(([sourceId]) => {
        chips.push({
          id: `source-${sourceId}`,
          label: `Source: ${SOURCE_LABELS[sourceId] || sourceId}`,
        })
      })

    Object.entries(sentimentFilters)
      .filter(([, enabled]) => enabled)
      .forEach(([sentiment]) => {
        const label = sentiment.charAt(0).toUpperCase() + sentiment.slice(1)
        chips.push({ id: `sentiment-${sentiment}`, label: `Sentiment: ${label}` })
      })

    if (influenceScore !== 6) {
      chips.push({ id: 'influence', label: `Influence score: ${influenceScore}+` })
    }

    if (continentFilter) {
      const label = continentFilter.replace('_', ' ')
      chips.push({ id: 'continent', label: `Continent: ${label}` })
    }

    if (countryFilter) {
      chips.push({ id: 'country', label: `Country: ${countryFilter}` })
    }

    return chips
  }, [mentionSearch, dateRange, sourceFilters, sentimentFilters, influenceScore, continentFilter, countryFilter])

  return {
    filters,
    setFilters,
    mentionSearch,
    setMentionSearch,
    chartGranularity,
    setChartGranularity,
    dateRange,
    sourceFilters,
    sentimentFilters,
    influenceScore,
    setInfluenceScore,
    continentFilter,
    setContinentFilter,
    countryFilter,
    setCountryFilter,
    sortOrder,
    setSortOrder,
    currentPage,
    setCurrentPage,
    mentionsBySource,
    filteredMentions,
    appliedFilters,
    handleDateRangeChange,
    handleSourceFilterToggle,
    handleSentimentToggle,
    handleSaveFilters,
    handleClearFilters,
  }
}
