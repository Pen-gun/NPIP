import { useRef } from 'react'
import { useFormContext } from 'react-hook-form'
import type { PageFormValues } from '../../schemas'

type RichTextBlockEditorProps = {
  index: number
}

export default function RichTextBlockEditor({ index }: RichTextBlockEditorProps) {
  const { register, setValue, getValues } = useFormContext<PageFormValues>()
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)
  const { ref: contentRef, ...contentField } = register(`blocks.${index}.content`)

  const insertSnippet = (prefix: string, suffix = '') => {
    const textarea = textareaRef.current
    if (!textarea) return
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const currentValue = getValues(`blocks.${index}.content`) ?? ''
    const nextValue =
      currentValue.substring(0, start) + prefix + currentValue.substring(start, end) + suffix + currentValue.substring(end)
    setValue(`blocks.${index}.content`, nextValue, { shouldDirty: true })
    window.requestAnimationFrame(() => {
      textarea.focus()
      textarea.setSelectionRange(start + prefix.length, end + prefix.length)
    })
  }

  return (
    <div>
      <div className='flex flex-wrap gap-2'>
        <button
          type='button'
          onClick={() => insertSnippet('### ')}
          className='rounded-full border border-(--border) px-3 py-1 text-xs text-(--text-muted)'
        >
          Heading
        </button>
        <button
          type='button'
          onClick={() => insertSnippet('**', '**')}
          className='rounded-full border border-(--border) px-3 py-1 text-xs text-(--text-muted)'
        >
          Bold
        </button>
        <button
          type='button'
          onClick={() => insertSnippet('- ')}
          className='rounded-full border border-(--border) px-3 py-1 text-xs text-(--text-muted)'
        >
          List
        </button>
        <button
          type='button'
          onClick={() => insertSnippet('[link text](', ')')}
          className='rounded-full border border-(--border) px-3 py-1 text-xs text-(--text-muted)'
        >
          Link
        </button>
      </div>
      <textarea
        {...contentField}
        ref={(element) => {
          contentRef(element)
          textareaRef.current = element
        }}
        rows={6}
        className='mt-3 w-full rounded-xl border border-(--border) bg-(--surface-muted) px-3 py-2 text-sm text-(--text-primary) placeholder:text-(--text-muted) focus:border-(--brand-accent) focus:outline-none'
        placeholder='Write using Markdown-like formatting...'
      />
      <p className='mt-2 text-xs text-(--text-muted)'>
        Supports headings, bold, lists, and links. Content renders as rich text on the site.
      </p>
    </div>
  )
}
