import { useEffect, useState } from 'react'
import type { SiteSettings } from '../../api/settings'
import type { ToastInput } from '../uiTypes'

type SettingsPanelProps = {
  settings?: SiteSettings
  loading: boolean
  saving: boolean
  onSave: (payload: SiteSettings) => Promise<unknown>
  pushToast: (toast: ToastInput) => void
}

export default function SettingsPanel({
  settings,
  loading,
  saving,
  onSave,
  pushToast,
}: SettingsPanelProps) {
  const [formState, setFormState] = useState({
    brandName: settings?.brandName || '',
    tagline: settings?.tagline || '',
    logoUrl: settings?.logoUrl || '',
    accentColor: settings?.accentColor || '',
    socialLinks: settings?.socialLinks || [],
  })

  useEffect(() => {
    if (!settings) return
    setFormState({
      brandName: settings.brandName || '',
      tagline: settings.tagline || '',
      logoUrl: settings.logoUrl || '',
      accentColor: settings.accentColor || '',
      socialLinks: settings.socialLinks || [],
    })
  }, [settings])

  const handleChange = (key: keyof typeof formState, value: string) => {
    setFormState((prev) => ({ ...prev, [key]: value }))
  }

  const updateSocialLink = (index: number, key: 'label' | 'href', value: string) => {
    setFormState((prev) => ({
      ...prev,
      socialLinks: prev.socialLinks.map((item, i) => (i === index ? { ...item, [key]: value } : item)),
    }))
  }

  const addSocialLink = () => {
    setFormState((prev) => ({
      ...prev,
      socialLinks: [...prev.socialLinks, { label: 'X', href: 'https://x.com' }],
    }))
  }

  const handleSubmit = async () => {
    try {
      await onSave(formState)
      pushToast({ title: 'Settings saved', tone: 'success' })
    } catch (error) {
      pushToast({
        title: 'Failed to save settings',
        message: error instanceof Error ? error.message : 'Something went wrong.',
        tone: 'error',
      })
    }
  }

  return (
    <div className='space-y-6'>
      <div className='rounded-2xl border border-(--border) bg-(--surface-base) p-6 shadow-sm'>
        <div className='flex items-center justify-between'>
          <div>
            <p className='text-xs font-semibold uppercase tracking-[0.3em] text-(--text-muted)'>Brand</p>
            <h2 className='text-xl font-semibold'>Site settings</h2>
          </div>
          <button
            type='button'
            onClick={handleSubmit}
            disabled={saving}
            className='rounded-full bg-(--brand-accent) px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white'
          >
            {saving ? 'Saving...' : 'Save settings'}
          </button>
        </div>
        {loading ? (
          <div className='mt-6 grid gap-4 lg:grid-cols-2'>
            {[0, 1, 2, 3].map((item) => (
              <div key={item} className='h-12 animate-pulse rounded-xl bg-(--surface-muted)' />
            ))}
          </div>
        ) : (
          <div className='mt-6 grid gap-4 lg:grid-cols-2'>
            <label className='text-sm text-(--text-muted)'>
              <span className='text-xs font-semibold uppercase tracking-[0.2em]'>Brand name</span>
              <input
                value={formState.brandName}
                onChange={(event) => handleChange('brandName', event.target.value)}
                className='mt-2 w-full rounded-xl border border-(--border) bg-(--surface-muted) px-3 py-2 text-sm'
              />
            </label>
            <label className='text-sm text-(--text-muted)'>
              <span className='text-xs font-semibold uppercase tracking-[0.2em]'>Tagline</span>
              <input
                value={formState.tagline}
                onChange={(event) => handleChange('tagline', event.target.value)}
                className='mt-2 w-full rounded-xl border border-(--border) bg-(--surface-muted) px-3 py-2 text-sm'
              />
            </label>
            <label className='text-sm text-(--text-muted)'>
              <span className='text-xs font-semibold uppercase tracking-[0.2em]'>Logo URL</span>
              <input
                value={formState.logoUrl}
                onChange={(event) => handleChange('logoUrl', event.target.value)}
                className='mt-2 w-full rounded-xl border border-(--border) bg-(--surface-muted) px-3 py-2 text-sm'
                placeholder='https://...'
              />
            </label>
            <label className='text-sm text-(--text-muted)'>
              <span className='text-xs font-semibold uppercase tracking-[0.2em]'>Accent color</span>
              <input
                value={formState.accentColor}
                onChange={(event) => handleChange('accentColor', event.target.value)}
                className='mt-2 w-full rounded-xl border border-(--border) bg-(--surface-muted) px-3 py-2 text-sm'
                placeholder='#d86b2c'
              />
            </label>
            <div className='lg:col-span-2'>
              <div className='flex items-center justify-between'>
                <p className='text-xs font-semibold uppercase tracking-[0.2em] text-(--text-muted)'>Social links</p>
                <button
                  type='button'
                  onClick={addSocialLink}
                  className='text-xs font-semibold text-(--brand-accent)'
                >
                  Add social
                </button>
              </div>
              <div className='mt-3 space-y-3'>
                {formState.socialLinks.map((link, index) => (
                  <div key={`social-${index}`} className='grid gap-2 sm:grid-cols-2'>
                    <input
                      value={link.label}
                      onChange={(event) => updateSocialLink(index, 'label', event.target.value)}
                      className='rounded-xl border border-(--border) bg-(--surface-muted) px-3 py-2 text-sm'
                      placeholder='Label (X, LinkedIn)'
                    />
                    <input
                      value={link.href}
                      onChange={(event) => updateSocialLink(index, 'href', event.target.value)}
                      className='rounded-xl border border-(--border) bg-(--surface-muted) px-3 py-2 text-sm'
                      placeholder='https://'
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
