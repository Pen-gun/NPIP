import type { FormEvent } from 'react'

interface SourceConfig {
  id: string
  label: string
}

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
}

const SOURCE_OPTIONS: readonly SourceConfig[] = Object.freeze([
  { id: 'localNews', label: 'Local News (RSS)' },
  { id: 'youtube', label: 'YouTube' },
  { id: 'reddit', label: 'Reddit' },
  { id: 'x', label: 'X (Twitter) - paid API' },
  { id: 'meta', label: 'Meta (owned assets)' },
  { id: 'tiktok', label: 'TikTok (experimental)' },
  { id: 'viber', label: 'Viber (bot-only)' },
])

export default function ProjectForm({ formState, onFormChange, onSubmit }: ProjectFormProps) {
  return (
    <div className='rounded-[28px] border border-(--border) bg-(--surface-base) p-6 shadow-(--shadow)'>
      <h2 className='text-lg font-semibold'>Create project</h2>
      <p className='mt-2 text-sm text-(--text-muted)'>
        Define keywords and sources. Boolean query supports AND/OR/NOT + parentheses.
      </p>
      <form className='mt-4 space-y-3' onSubmit={onSubmit}>
        <input
          value={formState.name}
          onChange={(event) => onFormChange((prev) => ({ ...prev, name: event.target.value }))}
          placeholder='Project name'
          className='w-full rounded-xl border border-(--border) bg-(--surface-muted) px-4 py-2 text-sm'
          required
        />
        <input
          value={formState.keywords}
          onChange={(event) => onFormChange((prev) => ({ ...prev, keywords: event.target.value }))}
          placeholder='Keywords (comma separated)'
          className='w-full rounded-xl border border-(--border) bg-(--surface-muted) px-4 py-2 text-sm'
        />
        <input
          value={formState.booleanQuery}
          onChange={(event) => onFormChange((prev) => ({ ...prev, booleanQuery: event.target.value }))}
          placeholder='Boolean query (optional)'
          className='w-full rounded-xl border border-(--border) bg-(--surface-muted) px-4 py-2 text-sm'
        />
        <div className='grid gap-3 md:grid-cols-2'>
          <input
            type='number'
            min={5}
            max={60}
            value={formState.scheduleMinutes}
            onChange={(event) =>
              onFormChange((prev) => ({ ...prev, scheduleMinutes: Number(event.target.value) }))
            }
            className='w-full rounded-xl border border-(--border) bg-(--surface-muted) px-4 py-2 text-sm'
          />
          <input
            value={formState.geoFocus}
            onChange={(event) => onFormChange((prev) => ({ ...prev, geoFocus: event.target.value }))}
            className='w-full rounded-xl border border-(--border) bg-(--surface-muted) px-4 py-2 text-sm'
          />
        </div>
        <div className='grid gap-2 text-sm text-(--text-muted) md:grid-cols-2'>
          {SOURCE_OPTIONS.map((source) => (
            <label key={source.id} className='flex items-center gap-2'>
              <input
                type='checkbox'
                checked={formState.sources[source.id] ?? false}
                onChange={(event) =>
                  onFormChange((prev) => ({
                    ...prev,
                    sources: {
                      ...prev.sources,
                      [source.id]: event.target.checked,
                    },
                  }))
                }
              />
              {source.label}
            </label>
          ))}
        </div>
        <button
          className='w-full rounded-xl bg-(--brand-primary) px-4 py-2 text-sm font-semibold text-(--text-inverse)'
          type='submit'
        >
          Create project
        </button>
      </form>
    </div>
  )
}

export type { ProjectFormState }
