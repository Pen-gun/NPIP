import { useState, useMemo } from 'react'
import BarChart3 from 'lucide-react/dist/esm/icons/bar-chart-3'
import MessageSquare from 'lucide-react/dist/esm/icons/message-square'
import Minus from 'lucide-react/dist/esm/icons/minus'
import Plus from 'lucide-react/dist/esm/icons/plus'
import TrendingDown from 'lucide-react/dist/esm/icons/trending-down'
import TrendingUp from 'lucide-react/dist/esm/icons/trending-up'
import Users from 'lucide-react/dist/esm/icons/users'
import X from 'lucide-react/dist/esm/icons/x'
import ChartCard from '../ChartCard'
import type { Mention, Project } from '../../types/app'
import { PROJECT_COLORS, buildProjectStats } from './comparisonUtils'

interface ComparisonViewProps {
  projects: Project[]
  allMentions: Record<string, Mention[]> // projectId -> mentions
  loading: boolean
  onAddProject?: () => void
}

const TrendIcon = ({ change }: { change: number }) => {
  if (change > 0) return <TrendingUp className='h-3 w-3 text-green-500' />
  if (change < 0) return <TrendingDown className='h-3 w-3 text-red-500' />
  return <Minus className='h-3 w-3 text-(--text-muted)' />
}

export default function ComparisonView({ 
  projects, 
  allMentions, 
  loading,
  onAddProject 
}: ComparisonViewProps) {
  const [selectedProjects, setSelectedProjects] = useState<string[]>(
    projects.slice(0, 2).map(p => p._id)
  )

  const projectStats = useMemo(() => {
    return buildProjectStats(selectedProjects, projects, allMentions)
  }, [selectedProjects, projects, allMentions])

  // Combined chart data for comparison
  const comparisonChartData = projectStats.map(ps => ps.dailyMentions.reduce((a, b) => a + b, 0) / 7)

  const handleToggleProject = (projectId: string) => {
    if (selectedProjects.includes(projectId)) {
      if (selectedProjects.length > 1) {
        setSelectedProjects(prev => prev.filter(id => id !== projectId))
      }
    } else if (selectedProjects.length < 5) {
      setSelectedProjects(prev => [...prev, projectId])
    }
  }

  if (loading) {
    return (
      <div className='space-y-6'>
        <div className='h-12 animate-pulse rounded-xl bg-(--surface-muted)' />
        <div className='grid gap-4 lg:grid-cols-2'>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className='h-64 animate-pulse rounded-xl bg-(--surface-muted)' />
          ))}
        </div>
      </div>
    )
  }

  if (projects.length === 0) {
    return (
      <div className='flex flex-col items-center justify-center rounded-xl border border-(--border) bg-(--surface-base) p-12 text-center'>
        <BarChart3 className='mb-4 h-12 w-12 text-(--text-muted)' />
        <h3 className='text-lg font-semibold'>No Projects to Compare</h3>
        <p className='mt-2 text-sm text-(--text-muted)'>
          Create multiple projects to compare their metrics side-by-side.
        </p>
        {onAddProject && (
          <button
            onClick={onAddProject}
            className='mt-4 flex items-center gap-2 rounded-lg bg-(--brand-accent) px-4 py-2 text-sm font-medium text-white hover:bg-(--brand-accent-hover)'
          >
            <Plus className='h-4 w-4' />
            Create Project
          </button>
        )}
      </div>
    )
  }

  return (
    <div className='space-y-6'>
      {/* Project Selector */}
      <div className='rounded-xl border border-(--border) bg-(--surface-base) p-4 shadow-sm'>
        <h3 className='mb-3 text-sm font-semibold'>Select Projects to Compare (max 5)</h3>
        <div className='flex flex-wrap gap-2'>
          {projects.map((project) => {
            const isSelected = selectedProjects.includes(project._id)
            const colorIdx = selectedProjects.indexOf(project._id)
            const color = isSelected && colorIdx >= 0 ? PROJECT_COLORS[colorIdx % PROJECT_COLORS.length] : null

            return (
              <button
                key={project._id}
                onClick={() => handleToggleProject(project._id)}
                className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium transition-all ${
                  isSelected
                    ? `${color?.light} ${color?.border} ${color?.text}`
                    : 'border-(--border) bg-(--surface-muted) text-(--text-muted) hover:bg-(--surface-base)'
                }`}
              >
                {isSelected && (
                  <span className={`h-2 w-2 rounded-full ${color?.bg}`} />
                )}
                {project.name}
                {isSelected && selectedProjects.length > 1 && (
                  <X className='h-3 w-3' />
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Comparison Cards */}
      <div className={`grid gap-4 ${selectedProjects.length === 1 ? 'lg:grid-cols-1' : selectedProjects.length === 2 ? 'lg:grid-cols-2' : 'lg:grid-cols-3'}`}>
        {projectStats.map((stats, idx) => {
          const color = PROJECT_COLORS[idx % PROJECT_COLORS.length]
          return (
            <div key={stats.projectId} className={`rounded-xl border ${color.border} bg-(--surface-base) p-4 shadow-sm`}>
              <div className='mb-4 flex items-center gap-2'>
                <span className={`h-3 w-3 rounded-full ${color.bg}`} />
                <h3 className='font-semibold'>{stats.projectName}</h3>
              </div>

              {/* Key Metrics */}
              <div className='grid grid-cols-2 gap-3'>
                <div className='rounded-lg bg-(--surface-muted) p-3'>
                  <div className='flex items-center justify-between'>
                    <MessageSquare className='h-4 w-4 text-(--text-muted)' />
                    <TrendIcon change={5} />
                  </div>
                  <p className='mt-1 text-lg font-bold'>{stats.totalMentions.toLocaleString()}</p>
                  <p className='text-xs text-(--text-muted)'>Mentions</p>
                </div>

                <div className='rounded-lg bg-(--surface-muted) p-3'>
                  <div className='flex items-center justify-between'>
                    <Users className='h-4 w-4 text-(--text-muted)' />
                    <TrendIcon change={12} />
                  </div>
                  <p className='mt-1 text-lg font-bold'>{stats.totalReach.toLocaleString()}</p>
                  <p className='text-xs text-(--text-muted)'>Est. Reach</p>
                </div>
              </div>

              {/* Sentiment Bar */}
              <div className='mt-4'>
                <p className='mb-2 text-xs font-medium text-(--text-muted)'>Sentiment Distribution</p>
                <div className='flex h-2 overflow-hidden rounded-full bg-(--surface-muted)'>
                  {stats.totalMentions > 0 && (
                    <>
                      <div 
                        className='bg-green-500' 
                        style={{ width: `${(stats.sentimentBreakdown.positive / stats.totalMentions) * 100}%` }} 
                      />
                      <div 
                        className='bg-gray-400' 
                        style={{ width: `${(stats.sentimentBreakdown.neutral / stats.totalMentions) * 100}%` }} 
                      />
                      <div 
                        className='bg-red-500' 
                        style={{ width: `${(stats.sentimentBreakdown.negative / stats.totalMentions) * 100}%` }} 
                      />
                    </>
                  )}
                </div>
                <div className='mt-1 flex justify-between text-xs'>
                  <span className='text-green-600'>{stats.sentimentBreakdown.positive} positive</span>
                  <span className='text-red-600'>{stats.sentimentBreakdown.negative} negative</span>
                </div>
              </div>

              {/* Top Sources */}
              <div className='mt-4'>
                <p className='mb-2 text-xs font-medium text-(--text-muted)'>Top Sources</p>
                <div className='space-y-1'>
                  {stats.topSources.slice(0, 3).map(source => (
                    <div key={source.source} className='flex items-center justify-between text-sm'>
                      <span className='truncate'>{source.source}</span>
                      <span className='text-(--text-muted)'>{source.count}</span>
                    </div>
                  ))}
                  {stats.topSources.length === 0 && (
                    <p className='text-sm text-(--text-muted)'>No sources yet</p>
                  )}
                </div>
              </div>

              {/* Engagement */}
              <div className='mt-4 grid grid-cols-3 gap-2 text-center'>
                <div className='rounded-lg bg-(--surface-muted) p-2'>
                  <p className='text-sm font-semibold'>{stats.engagement.likes}</p>
                  <p className='text-xs text-(--text-muted)'>Likes</p>
                </div>
                <div className='rounded-lg bg-(--surface-muted) p-2'>
                  <p className='text-sm font-semibold'>{stats.engagement.comments}</p>
                  <p className='text-xs text-(--text-muted)'>Comments</p>
                </div>
                <div className='rounded-lg bg-(--surface-muted) p-2'>
                  <p className='text-sm font-semibold'>{stats.engagement.shares}</p>
                  <p className='text-xs text-(--text-muted)'>Shares</p>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Comparison Charts */}
      {selectedProjects.length >= 2 && (
        <div className='grid gap-4 lg:grid-cols-2'>
          <ChartCard
            title='Daily Mentions Comparison'
            description='Average daily mentions across selected projects'
            type='bar'
            labels={projectStats.map(ps => ps.projectName)}
            data={comparisonChartData}
          />

          <ChartCard
            title='Reach Comparison'
            description='Total estimated reach for each project'
            type='doughnut'
            labels={projectStats.map(ps => ps.projectName)}
            data={projectStats.map(ps => ps.totalReach)}
          />

          <ChartCard
            title='Total Mentions'
            description='Mention count comparison'
            type='bar'
            labels={projectStats.map(ps => ps.projectName)}
            data={projectStats.map(ps => ps.totalMentions)}
          />

          <ChartCard
            title='Sentiment Score'
            description='Average sentiment (-1 to 1 scale)'
            type='bar'
            labels={projectStats.map(ps => ps.projectName)}
            data={projectStats.map(ps => Math.round(ps.avgSentiment * 100) / 100)}
          />
        </div>
      )}

      {/* Detailed Comparison Table */}
      {selectedProjects.length >= 2 && (
        <div className='overflow-hidden rounded-xl border border-(--border) bg-(--surface-base) shadow-sm'>
          <div className='border-b border-(--border) p-4'>
            <h3 className='font-semibold'>Detailed Metrics Comparison</h3>
          </div>
          <div className='overflow-x-auto'>
            <table className='w-full text-sm'>
              <thead className='bg-(--surface-muted)'>
                <tr>
                  <th className='p-3 text-left font-medium text-(--text-muted)'>Metric</th>
                  {projectStats.map((stats, idx) => (
                    <th key={stats.projectId} className='p-3 text-center font-medium'>
                      <div className='flex items-center justify-center gap-2'>
                        <span className={`h-2 w-2 rounded-full ${PROJECT_COLORS[idx % PROJECT_COLORS.length].bg}`} />
                        {stats.projectName}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className='divide-y divide-(--border)'>
                <tr>
                  <td className='p-3 font-medium'>Total Mentions</td>
                  {projectStats.map(stats => (
                    <td key={stats.projectId} className='p-3 text-center'>{stats.totalMentions.toLocaleString()}</td>
                  ))}
                </tr>
                <tr>
                  <td className='p-3 font-medium'>Estimated Reach</td>
                  {projectStats.map(stats => (
                    <td key={stats.projectId} className='p-3 text-center'>{stats.totalReach.toLocaleString()}</td>
                  ))}
                </tr>
                <tr>
                  <td className='p-3 font-medium'>Positive Mentions</td>
                  {projectStats.map(stats => (
                    <td key={stats.projectId} className='p-3 text-center text-green-600'>{stats.sentimentBreakdown.positive}</td>
                  ))}
                </tr>
                <tr>
                  <td className='p-3 font-medium'>Negative Mentions</td>
                  {projectStats.map(stats => (
                    <td key={stats.projectId} className='p-3 text-center text-red-600'>{stats.sentimentBreakdown.negative}</td>
                  ))}
                </tr>
                <tr>
                  <td className='p-3 font-medium'>Total Likes</td>
                  {projectStats.map(stats => (
                    <td key={stats.projectId} className='p-3 text-center'>{stats.engagement.likes.toLocaleString()}</td>
                  ))}
                </tr>
                <tr>
                  <td className='p-3 font-medium'>Total Comments</td>
                  {projectStats.map(stats => (
                    <td key={stats.projectId} className='p-3 text-center'>{stats.engagement.comments.toLocaleString()}</td>
                  ))}
                </tr>
                <tr>
                  <td className='p-3 font-medium'>Total Shares</td>
                  {projectStats.map(stats => (
                    <td key={stats.projectId} className='p-3 text-center'>{stats.engagement.shares.toLocaleString()}</td>
                  ))}
                </tr>
                <tr>
                  <td className='p-3 font-medium'>Avg. Sentiment</td>
                  {projectStats.map(stats => (
                    <td key={stats.projectId} className={`p-3 text-center ${stats.avgSentiment > 0 ? 'text-green-600' : stats.avgSentiment < 0 ? 'text-red-600' : ''}`}>
                      {stats.avgSentiment > 0 ? '+' : ''}{stats.avgSentiment.toFixed(2)}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
