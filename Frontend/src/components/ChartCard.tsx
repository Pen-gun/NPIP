import { useEffect, useRef } from 'react'
import Chart from 'chart.js/auto'

type ChartType = 'line' | 'doughnut' | 'bar'

type ChartCardProps = {
  title: string
  description: string
  type: ChartType
  labels: string[]
  data: number[]
}

const palette = ['#1f4b7f', '#2f6ea5', '#8aa6c7', '#e0b84a', '#c96b3a', '#8b3a3a']

export default function ChartCard({ title, description, type, labels, data }: ChartCardProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const chartRef = useRef<Chart | null>(null)

  useEffect(() => {
    if (!canvasRef.current) return
    if (chartRef.current) {
      chartRef.current.destroy()
    }
    chartRef.current = new Chart(canvasRef.current, {
      type,
      data: {
        labels,
        datasets: [
          {
            label: title,
            data,
            borderColor: palette[0],
            backgroundColor:
              type === 'doughnut' ? palette : 'rgba(31, 75, 127, 0.2)',
            tension: 0.35,
            borderWidth: 2,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: type !== 'line',
            position: 'bottom',
          },
        },
        scales:
          type === 'line' || type === 'bar'
            ? {
                x: { ticks: { color: '#64748b' } },
                y: { ticks: { color: '#64748b' } },
              }
            : undefined,
      },
    })
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
