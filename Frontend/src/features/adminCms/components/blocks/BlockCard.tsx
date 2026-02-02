import { ChevronDown, ChevronUp, Trash2 } from 'lucide-react'
import type { ContentBlock } from '../../types'
import { blockDescriptions, blockLabels } from '../../utils'
import CtaBandBlockEditor from './CtaBandBlockEditor'
import FeatureGridBlockEditor from './FeatureGridBlockEditor'
import GalleryBlockEditor from './GalleryBlockEditor'
import HeroBlockEditor from './HeroBlockEditor'
import RichTextBlockEditor from './RichTextBlockEditor'
import TestimonialsBlockEditor from './TestimonialsBlockEditor'

type BlockCardProps = {
  index: number
  blockType: ContentBlock['type']
  onMoveUp: () => void
  onMoveDown: () => void
  onRemove: () => void
  canMoveUp: boolean
  canMoveDown: boolean
  onPickMedia: (path: string) => void
}

export default function BlockCard({
  index,
  blockType,
  onMoveUp,
  onMoveDown,
  onRemove,
  canMoveUp,
  canMoveDown,
  onPickMedia,
}: BlockCardProps) {
  return (
    <div className='rounded-2xl border border-(--border) bg-white p-5 shadow-sm'>
      <div className='flex flex-wrap items-center justify-between gap-4'>
        <div>
          <p className='text-xs font-semibold uppercase tracking-[0.3em] text-(--text-muted)'>{blockLabels[blockType]}</p>
          <p className='text-xs text-(--text-muted)'>{blockDescriptions[blockType]}</p>
        </div>
        <div className='flex items-center gap-2'>
          <button
            type='button'
            onClick={onMoveUp}
            disabled={!canMoveUp}
            className='rounded-full border border-(--border) p-2 text-(--text-muted) disabled:opacity-40'
            aria-label='Move block up'
          >
            <ChevronUp className='h-3.5 w-3.5' aria-hidden />
          </button>
          <button
            type='button'
            onClick={onMoveDown}
            disabled={!canMoveDown}
            className='rounded-full border border-(--border) p-2 text-(--text-muted) disabled:opacity-40'
            aria-label='Move block down'
          >
            <ChevronDown className='h-3.5 w-3.5' aria-hidden />
          </button>
          <button
            type='button'
            onClick={onRemove}
            className='rounded-full border border-(--border) p-2 text-(--text-muted) hover:text-rose-500'
            aria-label='Delete block'
          >
            <Trash2 className='h-3.5 w-3.5' aria-hidden />
          </button>
        </div>
      </div>

      <div className='mt-5'>
        {blockType === 'hero' && <HeroBlockEditor index={index} onPickMedia={onPickMedia} />}
        {blockType === 'rich_text' && <RichTextBlockEditor index={index} />}
        {blockType === 'feature_grid' && <FeatureGridBlockEditor index={index} />}
        {blockType === 'testimonials' && <TestimonialsBlockEditor index={index} onPickMedia={onPickMedia} />}
        {blockType === 'gallery' && <GalleryBlockEditor index={index} onPickMedia={onPickMedia} />}
        {blockType === 'cta_band' && <CtaBandBlockEditor index={index} />}
      </div>
    </div>
  )
}
