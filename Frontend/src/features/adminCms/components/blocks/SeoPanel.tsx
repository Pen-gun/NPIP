import { useFormContext } from 'react-hook-form'
import type { PageFormValues } from '../../schemas'
import InputField from '../fields/InputField'

type SeoPanelProps = {
  onPickMedia: (path: string) => void
}

export default function SeoPanel({ onPickMedia }: SeoPanelProps) {
  const { watch } = useFormContext<PageFormValues>()
  const metaTitle = watch('seo.metaTitle')
  const metaDescription = watch('seo.metaDescription')
  const slug = watch('slug')
  const ogImage = watch('seo.ogImage')

  return (
    <div className='rounded-2xl border border-(--border) bg-(--surface-base) p-6 shadow-sm'>
      <div className='flex flex-wrap items-center justify-between gap-4'>
        <div>
          <h3 className='text-lg font-semibold'>SEO settings</h3>
          <p className='text-xs text-(--text-muted)'>Control how this page appears on search engines.</p>
        </div>
        <button
          type='button'
          onClick={() => onPickMedia('seo.ogImage')}
          className='rounded-full border border-(--border) px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-(--text-muted)'
        >
          Pick OG image
        </button>
      </div>
      <div className='mt-4 grid gap-4 lg:grid-cols-2'>
        <InputField name='seo.metaTitle' label='Meta title' placeholder='Meta title' />
        <InputField name='seo.metaDescription' label='Meta description' placeholder='Meta description' />
        <InputField name='seo.canonical' label='Canonical URL' placeholder='https://npip.ai/page' />
        <InputField name='seo.ogImage' label='OG image URL' placeholder='https://...' />
      </div>
      <div className='mt-6 rounded-2xl border border-(--border) bg-(--surface-muted) p-4'>
        <p className='text-xs font-semibold uppercase tracking-[0.25em] text-(--text-muted)'>Preview</p>
        <div className='mt-3 space-y-1'>
          <p className='text-sm font-semibold text-blue-700'>{metaTitle || 'Meta title preview'}</p>
          <p className='text-xs text-green-700'>https://npip.ai/{slug || 'slug'}</p>
          <p className='text-xs text-(--text-muted)'>{metaDescription || 'Meta description preview goes here.'}</p>
        </div>
        {ogImage && (
          <img src={ogImage} alt='Open Graph preview' className='mt-3 h-32 w-full rounded-xl object-cover' />
        )}
      </div>
    </div>
  )
}
