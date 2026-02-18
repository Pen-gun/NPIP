import { Link } from 'react-router-dom'
import type { CSSProperties } from 'react'
import PrimaryButton from '../PrimaryButton'
import type { ContentBlock } from '../../features/adminCms/types'

interface Highlight {
  title: string
  description: string
}

interface WorkflowStep {
  title: string
  description: string
}

interface LandingContentProps {
  heroBlock?: Extract<ContentBlock, { type: 'hero' }>
  highlights: readonly Highlight[]
  workflowSteps: readonly WorkflowStep[]
  constraints: readonly string[]
  dataSources: readonly string[]
  ctaBlock?: Extract<ContentBlock, { type: 'cta_band' }>
}

export default function LandingContent({
  heroBlock,
  highlights,
  workflowSteps,
  constraints,
  dataSources,
  ctaBlock,
}: LandingContentProps) {
  const withDelay = (delay: number): CSSProperties => ({ '--delay': `${delay}ms` } as CSSProperties)

  return (
    <div className='landing-page mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 py-6 sm:gap-14 sm:px-6 sm:py-10'>
      <section
        className='grid items-center gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:gap-10'
        style={withDelay(80)}
      >
        <div className='text-center lg:text-left'>
          <p
            className='landing-reveal text-xs font-semibold uppercase tracking-[0.38em] text-(--brand-accent)'
            style={withDelay(140)}
          >
            Nepal's Public Figure Intelligence Portal
          </p>
          <h1
            className='landing-reveal mt-4 font-display text-3xl font-semibold leading-tight sm:text-4xl lg:text-5xl xl:text-6xl'
            style={withDelay(220)}
          >
            {heroBlock?.title || 'A modern intelligence desk for Nepali media signals.'}
          </h1>
          <p
            className='landing-reveal mx-auto mt-5 max-w-xl text-sm text-(--text-muted) sm:text-base lg:mx-0 lg:text-lg'
            style={withDelay(300)}
          >
            {heroBlock?.subtitle ||
              'Build projects, monitor public mentions, and act on sentiment shifts with an infrastructure tuned for Nepal.'}
          </p>
          <div
            className='landing-reveal mt-6 flex flex-col items-center gap-3 sm:mt-8 sm:flex-row sm:justify-center lg:justify-start'
            style={withDelay(380)}
          >
            <Link to={heroBlock?.ctaLink || '/login'}>
              <PrimaryButton label={heroBlock?.ctaText || 'Start Monitoring'} />
            </Link>
            <Link
              to='/search'
              className='rounded-full border border-(--border) px-5 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-(--text-primary) transition hover:text-(--brand-accent)'
            >
              Quick Search
            </Link>
          </div>
        </div>

        <div className='landing-hero-card landing-reveal' style={withDelay(240)}>
          <div className='grid gap-4 text-left'>
            <div className='landing-reveal-soft' style={withDelay(320)}>
              <p className='text-xs font-semibold uppercase tracking-[0.28em] text-(--brand-accent)'>
                Live monitoring
              </p>
              <h3 className='mt-2 text-base font-semibold sm:mt-3 sm:text-lg'>Project Health</h3>
              <p className='mt-1 text-xs text-(--text-muted) sm:mt-2 sm:text-sm'>
                Connector status and freshness snapshot updated every ingest cycle.
              </p>
            </div>
            <div className='landing-reveal-soft' style={withDelay(380)}>
              <p className='text-xs font-semibold uppercase tracking-[0.28em] text-(--brand-accent)'>
                Insight panel
              </p>
              <h3 className='mt-2 text-base font-semibold sm:mt-3 sm:text-lg'>
                Sentiment mix + volume
              </h3>
              <p className='mt-1 text-xs text-(--text-muted) sm:mt-2 sm:text-sm'>
                Understand mood shifts, top sources, and key mentions instantly.
              </p>
            </div>
            <div className='landing-reveal-soft' style={withDelay(440)}>
              <p className='text-xs font-semibold uppercase tracking-[0.28em] text-(--brand-accent)'>
                Alerts
              </p>
              <h3 className='mt-2 text-base font-semibold sm:mt-3 sm:text-lg'>Spikes in real time</h3>
              <p className='mt-1 text-xs text-(--text-muted) sm:mt-2 sm:text-sm'>
                Get notified when mentions surge or when keywords break out.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section id='features' className='grid gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3'>
        {highlights.map((item, index) => (
          <div
            key={item.title}
            className='landing-reveal rounded-2xl bg-(--surface-muted)/80 p-4 shadow-[0_12px_30px_rgba(15,23,42,0.08)] backdrop-blur-sm'
            style={withDelay(120 + index * 90)}
          >
            <h3 className='text-base font-semibold sm:text-lg'>{item.title}</h3>
            <p className='mt-2 text-xs text-(--text-muted) sm:mt-3 sm:text-sm'>{item.description}</p>
          </div>
        ))}
      </section>

      <section id='sources' className='grid gap-4 sm:gap-6 lg:grid-cols-[0.7fr_1.3fr]'>
        <div
          className='landing-reveal rounded-2xl bg-(--surface-muted)/80 p-4 shadow-[0_12px_30px_rgba(15,23,42,0.08)] backdrop-blur-sm'
          style={withDelay(120)}
        >
          <h3 className='text-base font-semibold sm:text-lg'>Source reality check</h3>
          <ul className='mt-3 space-y-2 text-xs text-(--text-muted) sm:mt-4 sm:space-y-3 sm:text-sm'>
            {constraints.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
        <div className='grid grid-cols-2 gap-3 sm:gap-4'>
          {dataSources.map((item, index) => (
            <div
              key={item}
              className='landing-reveal rounded-2xl bg-(--surface-muted)/80 px-3 py-2 text-xs font-semibold shadow-[0_10px_24px_rgba(15,23,42,0.08)] backdrop-blur-sm sm:text-sm'
              style={withDelay(180 + index * 60)}
            >
              {item}
            </div>
          ))}
        </div>
      </section>

      <section id='workflow' className='landing-reveal' style={withDelay(120)}>
        <div className='grid gap-4 sm:gap-6 lg:grid-cols-3'>
          {workflowSteps.map((step, index) => (
            <div
              key={step.title}
              className='landing-reveal-soft rounded-2xl bg-(--surface-muted)/80 p-4 shadow-[0_12px_30px_rgba(15,23,42,0.08)] backdrop-blur-sm'
              style={withDelay(200 + index * 90)}
            >
              <p className='text-xs font-semibold uppercase tracking-[0.28em] text-(--brand-accent)'>
                Step {index + 1}
              </p>
              <h4 className='mt-2 text-base font-semibold sm:mt-3 sm:text-lg'>{step.title}</h4>
              <p className='mt-1 text-xs text-(--text-muted) sm:mt-2 sm:text-sm'>{step.description}</p>
            </div>
          ))}
        </div>
      </section>

      {ctaBlock && (
        <section className='landing-reveal' style={withDelay(120)}>
          <div className='flex flex-col items-center justify-between gap-4 rounded-2xl border border-(--border) bg-(--surface-muted)/80 p-6 text-center sm:flex-row sm:text-left'>
            <p className='text-sm font-semibold sm:text-base'>{ctaBlock.text}</p>
            <Link to={ctaBlock.buttonLink}>
              <PrimaryButton label={ctaBlock.buttonText} />
            </Link>
          </div>
        </section>
      )}
    </div>
  )
}
