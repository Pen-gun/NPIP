import { useFormContext } from 'react-hook-form'
import type { PageFormValues } from '../../schemas'
import InputField from '../fields/InputField'

type HeroBlockEditorProps = {
  index: number
  onPickMedia: (path: string) => void
}

export default function HeroBlockEditor({ index, onPickMedia }: HeroBlockEditorProps) {
  const { register, watch } = useFormContext<PageFormValues>()
  const imageValue = watch(`blocks.${index}.backgroundImage`)

  return (
    <div className='grid gap-4 lg:grid-cols-[1.2fr_0.8fr]'>
      <div className='space-y-4'>
        <InputField name={`blocks.${index}.title`} label='Headline' placeholder='Headline' />
        <label className='text-sm text-(--text-muted)'>
          <span className='text-xs font-semibold uppercase tracking-[0.2em]'>Subtitle</span>
          <textarea
            {...register(`blocks.${index}.subtitle`)}
            rows={3}
            className='mt-2 w-full rounded-xl border border-(--border) bg-(--surface-muted) px-3 py-2 text-sm text-(--text-primary) placeholder:text-(--text-muted) focus:border-(--brand-accent) focus:outline-none'
            placeholder='Supportive copy for the hero.'
          />
        </label>
        <div className='grid gap-4 sm:grid-cols-2'>
          <InputField name={`blocks.${index}.ctaText`} label='CTA text' placeholder='Book demo' />
          <InputField name={`blocks.${index}.ctaLink`} label='CTA link' placeholder='/contact' />
        </div>
      </div>
      <div className='rounded-xl border border-dashed border-(--border) bg-(--surface-muted) p-4'>
        <div className='flex items-center justify-between'>
          <p className='text-xs font-semibold uppercase tracking-[0.2em] text-(--text-muted)'>Background</p>
          <button
            type='button'
            onClick={() => onPickMedia(`blocks.${index}.backgroundImage`)}
            className='rounded-full bg-(--brand-accent) px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-white'
          >
            Choose image
          </button>
        </div>
        {imageValue ? (
          <img src={imageValue} alt='Hero background' className='mt-4 h-40 w-full rounded-lg object-cover' />
        ) : (
          <div className='mt-4 flex h-40 items-center justify-center rounded-lg border border-dashed border-(--border) text-xs text-(--text-muted)'>
            No image selected
          </div>
        )}
        <input type='hidden' {...register(`blocks.${index}.backgroundImage`)} />
      </div>
    </div>
  )
}
