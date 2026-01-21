import { useEffect, useRef } from 'react'
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
  '#1f4b7f', '#2f6ea5', '#8aa6c7', '#e0b84a', '#c96b3a', '#8b3a3a',
])

const TICK_COLOR = '#64748b'
const LINE_BG_COLOR = 'rgba(31, 75, 127, 0.2)'
const TENSION = 0.35
const BORDER_WIDTH = 2

const createChartConfig = (type: ChartType, title: string, labels: string[], data: number[]) => ({
  type,
  data: {
    labels,
    datasets: [
      {
        label: title,
        data,
        borderColor: CHART_PALETTE[0],
        backgroundColor: type === 'doughnut' ? CHART_PALETTE : LINE_BG_COLOR,
        tension: TENSION,
        borderWidth: BORDER_WIDTH,
      },
    ],
  },
  options: {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: type !== 'line',
        position: 'bottom' as const,
      },
    },
    scales:
      type === 'line' || type === 'bar'
        ? {
            x: { ticks: { color: TICK_COLOR } },
            y: { ticks: { color: TICK_COLOR } },
          }
        : undefined,
  },
})

export default function ChartCard({ title, description, type, labels, data }: ChartCardProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const chartRef = useRef<Chart | null>(null)

  useEffect(() => {
    if (!canvasRef.current) return

    chartRef.current?.destroy()
    chartRef.current = new Chart(canvasRef.current, createChartConfig(type, title, labels, data))

    return () => chartRef.current?.destroy()
  }, [title, type, labels, data])

  return (
    <div className='flex flex-col rounded-2xl border border-(--border) bg-(--surface-muted) p-4'>
      <div>
        <h4 className='text-sm font-semibold'>{title}</h4>
        <p className='text-xs text-(--text-muted)'>{description}</p>
      </div>
      <div className='mt-3 h-40'>
        <canvas ref={canvasRef} />
      </div>
    </div>
  )
}
