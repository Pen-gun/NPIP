import { Plus } from 'lucide-react'
import { useFieldArray, useFormContext, type FieldPath } from 'react-hook-form'
import type { PageFormValues } from '../../schemas'
import { createId } from '../../utils'

type GalleryBlockEditorProps = {
  index: number
  onPickMedia: (path: FieldPath<PageFormValues>) => void
}

export default function GalleryBlockEditor({ index, onPickMedia }: GalleryBlockEditorProps) {
  const { control, register, watch } = useFormContext<PageFormValues>()
  const itemsFieldArray = useFieldArray({ control, name: `blocks.${index}.items` })

  return (
    <div className='space-y-4'>
      {itemsFieldArray.fields.map((item, itemIndex) => {
        const imageValue = watch(`blocks.${index}.items.${itemIndex}.image`)
        return (
          <div key={item.id} className='rounded-xl border border-(--border) bg-(--surface-muted) p-4'>
            <div className='flex items-center justify-between'>
              <p className='text-xs font-semibold uppercase tracking-[0.2em] text-(--text-muted)'>
                Image {itemIndex + 1}
              </p>
              <button
                type='button'
                onClick={() => itemsFieldArray.remove(itemIndex)}
                className='text-xs text-rose-500'
              >
                Remove
              </button>
            </div>
            <div className='mt-3 rounded-xl border border-dashed border-(--border) bg-(--surface-base) p-3'>
              <div className='flex items-center justify-between'>
                <p className='text-xs font-semibold uppercase tracking-[0.2em] text-(--text-muted)'>Image</p>
                <button
                  type='button'
                  onClick={() => onPickMedia(`blocks.${index}.items.${itemIndex}.image`)}
                  className='rounded-full bg-(--brand-accent) px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-white'
                >
                  Choose image
                </button>
              </div>
              {imageValue ? (
                <img src={imageValue} alt='Gallery' className='mt-3 h-32 w-full rounded-lg object-cover' />
              ) : (
                <div className='mt-3 flex h-32 items-center justify-center rounded-lg border border-dashed border-(--border) text-xs text-(--text-muted)'>
                  No image selected
                </div>
              )}
            </div>
            <label className='mt-3 block text-sm text-(--text-muted)'>
              <span className='text-xs font-semibold uppercase tracking-[0.2em]'>Caption</span>
              <input
                {...register(`blocks.${index}.items.${itemIndex}.caption`)}
                className='mt-2 w-full rounded-xl border border-(--border) bg-(--surface-base) px-3 py-2 text-sm text-(--text-primary)'
                placeholder='Caption'
              />
            </label>
          </div>
        )
      })}
      <button
        type='button'
        onClick={() =>
          itemsFieldArray.append({
            id: createId(),
            image: '',
            caption: 'Caption',
          })
        }
        className='inline-flex items-center gap-2 rounded-full border border-(--border) px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-(--text-muted)'
      >
        <Plus className='h-3.5 w-3.5' aria-hidden />
        Add image
      </button>
    </div>
  )
}
