import { Link } from 'react-router-dom'
import BrandLogo from '../components/BrandLogo'
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
  return (
    <div className='min-h-screen text-(--text-primary)'>
      <div className='mx-auto flex w-full max-w-6xl flex-col gap-14 px-6 py-10'>
        <header className='flex flex-wrap items-center justify-between gap-6'>
          <BrandLogo />
          <nav className='flex items-center gap-6 text-xs font-semibold uppercase tracking-[0.28em] text-(--text-muted)'>
            <a href='#features'>Features</a>
            <a href='#sources'>Sources</a>
            <a href='#workflow'>Workflow</a>
            <Link to='/login' className='rounded-full border border-(--border) px-4 py-2'>
              Sign in
            </Link>
          </nav>
        </header>

        <section className='grid items-center gap-10 lg:grid-cols-[1.2fr_0.8fr]'>
          <div>
            <p className='text-xs font-semibold uppercase tracking-[0.38em] text-(--brand-accent)'>
              Nepal Social Listening
            </p>
            <h1 className='mt-4 font-display text-4xl font-semibold leading-tight sm:text-5xl lg:text-6xl'>
              A modern intelligence desk for Nepali media signals.
            </h1>
            <p className='mt-5 max-w-xl text-base text-(--text-muted) sm:text-lg'>
              Build projects, monitor public mentions, and act on sentiment shifts with an
              infrastructure tuned for Nepal.
            </p>
            <div className='mt-8 flex flex-wrap items-center gap-4'>
              <Link to='/login'>
                <PrimaryButton label='Start Monitoring' />
              </Link>
              <Link
                to='/app'
                className='rounded-full border border-(--border) px-5 py-2 text-xs font-semibold uppercase tracking-[0.24em]'
              >
                View dashboard
              </Link>
            </div>
          </div>

          <div className='rounded-[28px] border border-(--border) bg-(--surface-base) p-6 shadow-(--shadow)'>
            <div className='grid gap-4'>
              <div className='rounded-2xl bg-(--surface-muted) p-4'>
                <p className='text-xs font-semibold uppercase tracking-[0.28em] text-(--brand-accent)'>
                  Live monitoring
                </p>
                <h3 className='mt-3 text-lg font-semibold'>Project Health</h3>
                <p className='mt-2 text-sm text-(--text-muted)'>
                  Connector status and freshness snapshot updated every ingest cycle.
                </p>
              </div>
              <div className='rounded-2xl bg-(--surface-muted) p-4'>
                <p className='text-xs font-semibold uppercase tracking-[0.28em] text-(--brand-accent)'>
                  Insight panel
                </p>
                <h3 className='mt-3 text-lg font-semibold'>Sentiment mix + volume</h3>
                <p className='mt-2 text-sm text-(--text-muted)'>
                  Understand mood shifts, top sources, and key mentions instantly.
                </p>
              </div>
              <div className='rounded-2xl bg-(--surface-muted) p-4'>
                <p className='text-xs font-semibold uppercase tracking-[0.28em] text-(--brand-accent)'>
                  Alerts
                </p>
                <h3 className='mt-3 text-lg font-semibold'>Spikes in real time</h3>
                <p className='mt-2 text-sm text-(--text-muted)'>
                  Get notified when mentions surge or when keywords break out.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section id='features' className='grid gap-6 lg:grid-cols-3'>
          {HIGHLIGHTS.map((item) => (
            <div
              key={item.title}
              className='rounded-2xl border border-(--border) bg-(--surface-base) p-6 shadow-(--shadow)'
            >
              <h3 className='text-lg font-semibold'>{item.title}</h3>
              <p className='mt-3 text-sm text-(--text-muted)'>{item.description}</p>
            </div>
          ))}
        </section>

        <section id='sources' className='grid gap-6 lg:grid-cols-[0.7fr_1.3fr]'>
          <div className='rounded-2xl border border-(--border) bg-(--surface-base) p-6 shadow-(--shadow)'>
            <h3 className='text-lg font-semibold'>Source reality check</h3>
            <ul className='mt-4 space-y-3 text-sm text-(--text-muted)'>
              {CONSTRAINTS.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
          <div className='grid gap-4 sm:grid-cols-2'>
            {DATA_SOURCES.map((item) => (
              <div
                key={item}
                className='rounded-2xl border border-(--border) bg-(--surface-muted) p-4 text-sm font-semibold'
              >
                {item}
              </div>
            ))}
          </div>
        </section>

        <section id='workflow' className='rounded-[28px] border border-(--border) bg-(--surface-base) p-8 shadow-(--shadow)'>
          <div className='grid gap-6 lg:grid-cols-3'>
            {WORKFLOW_STEPS.map((step, index) => (
              <div key={step.title} className='rounded-2xl bg-(--surface-muted) p-5'>
                <p className='text-xs font-semibold uppercase tracking-[0.28em] text-(--brand-accent)'>
                  Step {index + 1}
                </p>
                <h4 className='mt-3 text-lg font-semibold'>{step.title}</h4>
                <p className='mt-2 text-sm text-(--text-muted)'>{step.description}</p>
              </div>
            ))}
          </div>
        </section>

        <footer className='flex flex-wrap items-center justify-between gap-4 text-xs text-(--text-muted)'>
          <span>NPIP © 2026</span>
          <span>Built for Nepal&apos;s public data ecosystem.</span>
        </footer>
      </div>
    </div>
  )
}
