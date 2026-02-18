import { useEffect, useMemo, useState } from 'react'

const ONBOARDING_STEPS = Object.freeze([
  {
    title: 'Create your first project',
    description: 'Use "Create new project", add keywords and boolean query, then save it.',
  },
  {
    title: 'Run ingestion',
    description: 'Open a project and click "Run ingestion" to collect the first mentions.',
  },
  {
    title: 'Read insights',
    description: 'Use the Mentions and Analysis views to track source trends and sentiment shifts.',
  },
  {
    title: 'Save useful filters',
    description: 'Set date/source/sentiment filters, then use "Save filters" for faster daily review.',
  },
])

interface DashboardOnboardingGuideProps {
  userId?: string
}

export default function DashboardOnboardingGuide({ userId }: DashboardOnboardingGuideProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [stepIndex, setStepIndex] = useState(0)

  const storageKey = useMemo(
    () => (userId ? `npip_onboarding_seen_v1_${userId}` : ''),
    [userId],
  )

  useEffect(() => {
    if (!storageKey) {
      setIsOpen(false)
      setStepIndex(0)
      return
    }
    const onboardingSeen = localStorage.getItem(storageKey)
    if (!onboardingSeen) {
      setIsOpen(true)
      setStepIndex(0)
    }
  }, [storageKey])

  const closeOnboarding = () => {
    if (storageKey) {
      localStorage.setItem(storageKey, 'true')
    }
    setIsOpen(false)
    setStepIndex(0)
  }

  const nextStep = () => {
    if (stepIndex >= ONBOARDING_STEPS.length - 1) {
      closeOnboarding()
      return
    }
    setStepIndex((prev) => prev + 1)
  }

  if (!userId) return null

  return (
    <>
      {isOpen && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 px-4'>
          <div className='w-full max-w-lg rounded-2xl border border-(--border) bg-(--surface-base) p-6 shadow-xl'>
            <p className='text-[11px] font-semibold uppercase tracking-[0.2em] text-(--brand-accent)'>
              Getting started
            </p>
            <h2 className='mt-2 text-xl font-semibold text-(--text-primary)'>
              {ONBOARDING_STEPS[stepIndex].title}
            </h2>
            <p className='mt-3 text-sm text-(--text-muted)'>
              {ONBOARDING_STEPS[stepIndex].description}
            </p>

            <div className='mt-6 flex items-center justify-between'>
              <span className='text-xs text-(--text-muted)'>
                Step {stepIndex + 1} of {ONBOARDING_STEPS.length}
              </span>
              <div className='flex items-center gap-2'>
                <button
                  type='button'
                  onClick={closeOnboarding}
                  className='rounded-lg border border-(--border) px-3 py-1.5 text-xs font-semibold text-(--text-muted) hover:text-(--text-primary)'
                >
                  Skip
                </button>
                <button
                  type='button'
                  onClick={nextStep}
                  className='rounded-lg bg-(--brand-accent) px-3 py-1.5 text-xs font-semibold text-white'
                >
                  {stepIndex === ONBOARDING_STEPS.length - 1 ? 'Finish' : 'Next'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {!isOpen && (
        <button
          type='button'
          onClick={() => {
            setIsOpen(true)
            setStepIndex(0)
          }}
          className='fixed bottom-5 right-5 z-40 rounded-full border border-(--border) bg-(--surface-base) px-4 py-2 text-xs font-semibold uppercase tracking-[0.08em] text-(--text-primary) shadow-md hover:border-(--brand-accent) hover:text-(--brand-accent)'
        >
          Help
        </button>
      )}
    </>
  )
}

