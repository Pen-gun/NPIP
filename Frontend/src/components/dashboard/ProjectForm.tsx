import type { FormEvent } from 'react'

interface ProjectFormState {
  name: string
  keywords: string
  booleanQuery: string
  scheduleMinutes: number
  geoFocus: string
  sources: Record<string, boolean>
}

interface ProjectFormProps {
  formState: ProjectFormState
  onFormChange: (updater: (prev: ProjectFormState) => ProjectFormState) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  submitting?: boolean
}

const INPUT_CLASS = 'w-full rounded-xl border border-(--border) bg-(--surface-muted) px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-(--brand-primary)/20'

export default function ProjectForm({ formState, onFormChange, onSubmit, submitting }: ProjectFormProps) {
  // Auto-generate project name from keywords if not set
  const handleKeywordsChange = (value: string) => {
    onFormChange((prev) => {
      const newState = { ...prev, keywords: value }
      // Auto-set name from first keyword if name is empty
      if (!prev.name || prev.name === prev.keywords.split(',')[0]?.trim()) {
        const firstKeyword = value.split(',')[0]?.trim()
        if (firstKeyword) {
          newState.name = firstKeyword
        }
      }
      return newState
    })
  }

  return (
    <form className='space-y-4' onSubmit={onSubmit}>
      <div>
        <label className='mb-1.5 block text-sm font-medium'>Keywords to track</label>
        <input
          value={formState.keywords}
          onChange={(event) => handleKeywordsChange(event.target.value)}
          placeholder='e.g., KP Sharma Oli, केपी शर्मा ओली'
          className={INPUT_CLASS}
          required
          autoFocus
        />
        <p className='mt-1.5 text-xs text-(--text-muted)'>
          Enter keywords separated by commas. Use both English and Nepali for better coverage.
        </p>
      </div>
      
      <div className='rounded-lg bg-(--surface-muted) p-3'>
        <p className='text-xs font-medium text-(--text-muted)'>🔍 Will search across all sources:</p>
        <p className='mt-1 text-xs text-(--text-muted)'>
          YouTube, Reddit, X (Twitter), Meta, TikTok, Local News, Viber
        </p>
      </div>

      <button
        className='w-full rounded-xl bg-(--brand-primary) px-4 py-2.5 text-sm font-semibold text-(--text-inverse) transition hover:opacity-90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60'
        type='submit'
        disabled={submitting || !formState.keywords.trim()}
      >
        {submitting ? 'Creating...' : 'Start Tracking'}
      </button>
    </form>
  )
}

export type { ProjectFormState }
