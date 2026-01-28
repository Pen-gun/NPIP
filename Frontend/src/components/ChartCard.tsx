import { useEffect, useRef, useState } from 'react'
import Chart from 'chart.js/auto'

type ChartType = 'line' | 'doughnut' | 'bar'

interface ChartCardProps {
  title: string
  description: string
  type: ChartType
  labels: string[]
  data: number[]
}

const CHART_PALETTE = Object.freeze([
  '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899',
])

const TICK_COLOR = '#64748b'
const LINE_BG_COLOR = 'rgba(59, 130, 246, 0.15)'
const LINE_BORDER_COLOR = '#3b82f6'
const TENSION = 0.4
const BORDER_WIDTH = 2
const FONT_SIZE = 11

const createChartConfig = (
  type: ChartType,
  title: string,
  labels: string[],
  data: number[],
  compactLegend: boolean,
) => ({
  type,
  data: {
    labels,
    datasets: [
      {
        label: title,
        data,
        borderColor: type === 'doughnut' ? CHART_PALETTE : LINE_BORDER_COLOR,
        backgroundColor: type === 'doughnut' ? CHART_PALETTE : LINE_BG_COLOR,
        tension: TENSION,
        borderWidth: BORDER_WIDTH,
        fill: type === 'line',
        pointRadius: type === 'line' ? 3 : undefined,
        pointHoverRadius: type === 'line' ? 5 : undefined,
      },
    ],
  },
  options: {
    responsive: true,
    maintainAspectRatio: false,
    layout: {
      padding: type === 'doughnut' ? { bottom: 8 } : 0,
    },
    plugins: {
      legend: {
        display: type === 'doughnut',
        position: compactLegend ? ('bottom' as const) : ('right' as const),
        labels: {
          boxWidth: 12,
          padding: 8,
          font: { size: FONT_SIZE },
          usePointStyle: true,
        },
      },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.9)',
        titleFont: { size: 12 },
        bodyFont: { size: 11 },
        padding: 10,
        cornerRadius: 8,
      },
    },
    scales:
      type === 'line' || type === 'bar'
        ? {
            x: {
              ticks: { color: TICK_COLOR, font: { size: FONT_SIZE }, maxRotation: 45, minRotation: 0 },
              grid: { display: false },
            },
            y: {
              ticks: { color: TICK_COLOR, font: { size: FONT_SIZE } },
              grid: { color: 'rgba(100, 116, 139, 0.1)' },
              beginAtZero: true,
            },
          }
        : undefined,
  },
})

export default function ChartCard({ title, description, type, labels, data }: ChartCardProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const chartRef = useRef<Chart | null>(null)
  const chartTypeRef = useRef<ChartType | null>(null)
  const [compactLegend, setCompactLegend] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth < 640 : false,
  )

  useEffect(() => {
    const updateCompactLegend = () => {
      if (typeof window === 'undefined') return
      const next = window.innerWidth < 640
      setCompactLegend((prev) => (prev === next ? prev : next))
    }
    updateCompactLegend()
    window.addEventListener('resize', updateCompactLegend)
    return () => window.removeEventListener('resize', updateCompactLegend)
  }, [])

  useEffect(() => {
    if (!canvasRef.current) return

    const config = createChartConfig(type, title, labels, data, compactLegend)
    const chart = chartRef.current

    if (!chart) {
      chartRef.current = new Chart(canvasRef.current, config)
      chartTypeRef.current = type
      return
    }

    if (chartTypeRef.current !== type) {
      chart.destroy()
      chartRef.current = new Chart(canvasRef.current, config)
      chartTypeRef.current = type
      return
    }

    chart.data = config.data
    chart.options = config.options
    chart.update()
  }, [title, type, labels, data, compactLegend])

  useEffect(() => {
    return () => {
      chartRef.current?.destroy()
      chartRef.current = null
      chartTypeRef.current = null
    }
  }, [])

  return (
    <div className='flex min-w-0 flex-col overflow-hidden rounded-2xl border border-(--border) bg-(--surface-base) p-4 shadow-sm'>
      <div className='mb-3'>
        <h4 className='text-sm font-semibold'>{title}</h4>
        <p className='text-xs text-(--text-muted)'>{description}</p>
      </div>
      <div className='relative min-h-40 flex-1'>
        <canvas ref={canvasRef} className='block h-full w-full max-w-full' />
      </div>
    </div>
  )
}
