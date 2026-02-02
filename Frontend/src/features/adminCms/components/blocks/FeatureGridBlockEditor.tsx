import { Plus } from 'lucide-react'
import { useFieldArray, useFormContext } from 'react-hook-form'
import type { PageFormValues } from '../../schemas'
import { createId } from '../../utils'
import InputField from '../fields/InputField'

type FeatureGridBlockEditorProps = {
  index: number
}

export default function FeatureGridBlockEditor({ index }: FeatureGridBlockEditorProps) {
  const { control, register } = useFormContext<PageFormValues>()
  const itemsFieldArray = useFieldArray({ control, name: `blocks.${index}.items` })

  return (
    <div className='space-y-4'>
      {itemsFieldArray.fields.map((item, itemIndex) => (
        <div key={item.id} className='rounded-xl border border-(--border) bg-(--surface-muted) p-4'>
          <div className='flex items-center justify-between'>
            <p className='text-xs font-semibold uppercase tracking-[0.2em] text-(--text-muted)'>
              Feature {itemIndex + 1}
            </p>
            <button
              type='button'
              onClick={() => itemsFieldArray.remove(itemIndex)}
              className='text-xs text-rose-500'
            >
              Remove
            </button>
          </div>
          <div className='mt-3 grid gap-3 sm:grid-cols-2'>
            <InputField name={`blocks.${index}.items.${itemIndex}.icon`} label='Icon' placeholder='Sparkles' />
            <InputField name={`blocks.${index}.items.${itemIndex}.title`} label='Title' placeholder='Feature title' />
          </div>
          <label className='mt-3 block text-sm text-(--text-muted)'>
            <span className='text-xs font-semibold uppercase tracking-[0.2em]'>Description</span>
            <textarea
              {...register(`blocks.${index}.items.${itemIndex}.description`)}
              rows={3}
              className='mt-2 w-full rounded-xl border border-(--border) bg-(--surface-base) px-3 py-2 text-sm text-(--text-primary)'
              placeholder='Describe the feature.'
            />
          </label>
        </div>
      ))}
      <button
        type='button'
        onClick={() =>
          itemsFieldArray.append({
            id: createId(),
            icon: 'Sparkles',
            title: 'New feature',
            description: 'Describe the outcome for your users.',
          })
        }
        className='inline-flex items-center gap-2 rounded-full border border-(--border) px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-(--text-muted)'
      >
        <Plus className='h-3.5 w-3.5' aria-hidden />
        Add feature
      </button>
    </div>
  )
}
