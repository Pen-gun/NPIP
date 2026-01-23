import { Link } from 'react-router-dom'
import type { CSSProperties } from 'react'
import AnimatedShaderBackground from '@/components/ui/animated-shader-background'
import PrimaryButton from '../components/PrimaryButton'

interface Highlight {
  title: string
  description: string
}

const HIGHLIGHTS: readonly Highlight[] = Object.freeze([
  {
    title: 'Public signal intake',
    description: 'Track public mentions across Nepali news, YouTube, Reddit and optional connectors.',
  },
  {
    title: 'Nepali + English sentiment',
    description: 'Devanagari-aware language detection with multilingual sentiment scoring.',
  },
  {
    title: 'Alerts & reports',
    description: 'Real-time spike alerts, email digests, and exportable PDF summaries.',
  },
])

const CONSTRAINTS = Object.freeze([
  'Local news + YouTube + Reddit are the reliable MVP sources.',
  'X, Meta, TikTok, Viber remain gated or best-effort.',
  'Public data only, respecting robots.txt and platform ToS.',
])

const DATA_SOURCES = Object.freeze([
  'Local News RSS',
  'YouTube API',
  'Reddit API',
  'X (paid)',
  'Meta (owned)',
  'TikTok (best-effort)',
])

const WORKFLOW_STEPS = Object.freeze([
  {
    title: 'Create a project',
    description: 'Define keywords, boolean queries, and the sources you want to monitor.',
  },
  {
    title: 'Ingest mentions',
    description: 'Schedule connectors to collect mentions across the supported stack.',
  },
  {
    title: 'Act on insights',
    description: 'Use sentiment, top sources, and alerts to take action quickly.',
  },
])

export default function LandingPage() {
  const withDelay = (delay: number): CSSProperties =>
    ({ '--delay': `${delay}ms` } as CSSProperties)

  return (
    <div className='relative min-h-screen overflow-hidden'>
      <AnimatedShaderBackground className='pointer-events-none absolute inset-0 h-full w-full opacity-70' />
      <div className='landing-page relative z-10 mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 py-6 sm:gap-14 sm:px-6 sm:py-10'>
        <section
          className='grid items-center gap-8 rounded-[28px] border border-(--border) p-4 lg:grid-cols-[1.2fr_0.8fr] lg:gap-10 sm:p-6'
          style={withDelay(80)}
        >
          <div className='text-center lg:text-left'>
            <p
              className='landing-reveal text-xs font-semibold uppercase tracking-[0.38em] text-(--brand-accent)'
              style={withDelay(140)}
            >
              Nepal Social Listening
            </p>
            <h1
              className='landing-reveal mt-4 font-display text-3xl font-semibold leading-tight sm:text-4xl lg:text-5xl xl:text-6xl'
              style={withDelay(220)}
            >
              A modern intelligence desk for Nepali media signals.
            </h1>
            <p
              className='landing-reveal mx-auto mt-5 max-w-xl text-sm text-(--text-muted) sm:text-base lg:mx-0 lg:text-lg'
              style={withDelay(300)}
            >
              Build projects, monitor public mentions, and act on sentiment shifts with an
              infrastructure tuned for Nepal.
            </p>
            <div
              className='landing-reveal mt-6 flex flex-col items-center gap-3 sm:mt-8 sm:flex-row sm:justify-center lg:justify-start'
              style={withDelay(380)}
            >
              <Link to='/login'>
                <PrimaryButton label='Start Monitoring' />
              </Link>
              <Link
                to='/search'
                className='rounded-full border border-(--border) px-5 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-(--text-primary) transition hover:text-(--brand-accent)'
              >
                Quick Search
              </Link>
            </div>
          </div>

          <div
            className='landing-hero-card landing-reveal rounded-[22px] border border-(--border) p-4 sm:p-5'
            style={withDelay(240)}
          >
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

        <section
          id='features'
          className='grid gap-4 rounded-[28px] border border-(--border) p-4 sm:grid-cols-2 sm:gap-6 sm:p-6 lg:grid-cols-3'
        >
          {HIGHLIGHTS.map((item, index) => (
            <div
              key={item.title}
              className='landing-reveal rounded-2xl border border-(--border) p-4'
              style={withDelay(120 + index * 90)}
            >
              <h3 className='text-base font-semibold sm:text-lg'>{item.title}</h3>
              <p className='mt-2 text-xs text-(--text-muted) sm:mt-3 sm:text-sm'>
                {item.description}
              </p>
            </div>
          ))}
        </section>

        <section
          id='sources'
          className='grid gap-4 rounded-[28px] border border-(--border) p-4 sm:gap-6 sm:p-6 lg:grid-cols-[0.7fr_1.3fr]'
        >
          <div className='landing-reveal rounded-2xl border border-(--border) p-4' style={withDelay(120)}>
            <h3 className='text-base font-semibold sm:text-lg'>Source reality check</h3>
            <ul className='mt-3 space-y-2 text-xs text-(--text-muted) sm:mt-4 sm:space-y-3 sm:text-sm'>
              {CONSTRAINTS.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
          <div className='grid grid-cols-2 gap-3 sm:gap-4'>
            {DATA_SOURCES.map((item, index) => (
              <div
                key={item}
                className='landing-reveal rounded-2xl border border-(--border) px-3 py-2 text-xs font-semibold sm:text-sm'
                style={withDelay(180 + index * 60)}
              >
                {item}
              </div>
            ))}
          </div>
        </section>

        <section
          id='workflow'
          className='landing-reveal rounded-[28px] border border-(--border) p-4 sm:p-6'
          style={withDelay(120)}
        >
          <div className='grid gap-4 sm:gap-6 lg:grid-cols-3'>
            {WORKFLOW_STEPS.map((step, index) => (
              <div
                key={step.title}
                className='landing-reveal-soft rounded-2xl border border-(--border) p-4'
                style={withDelay(200 + index * 90)}
              >
                <p className='text-xs font-semibold uppercase tracking-[0.28em] text-(--brand-accent)'>
                  Step {index + 1}
                </p>
                <h4 className='mt-2 text-base font-semibold sm:mt-3 sm:text-lg'>{step.title}</h4>
                <p className='mt-1 text-xs text-(--text-muted) sm:mt-2 sm:text-sm'>
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        <footer
          className='landing-reveal flex flex-col items-center justify-between gap-3 text-xs text-(--text-muted) sm:flex-row sm:gap-4'
          style={withDelay(120)}
        >
          <span>NPIP (c) 2026</span>
          <span className='text-center'>Built for Nepal&apos;s public data ecosystem.</span>
        </footer>
      </div>
    </div>
  )
}
