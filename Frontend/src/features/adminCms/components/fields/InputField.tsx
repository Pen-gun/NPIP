import { useFormContext } from 'react-hook-form'
import type { PageFormValues } from '../../schemas'

type InputFieldProps = {
  name: string
  label: string
  placeholder?: string
}

export default function InputField({ name, label, placeholder }: InputFieldProps) {
  const {
    register,
    formState: { errors },
  } = useFormContext<PageFormValues>()
  const fieldError = name
    .split('.')
    .reduce((acc, key) => (acc ? (acc as Record<string, unknown>)[key] : null), errors as unknown)
  const message = (fieldError as { message?: string } | null)?.message

  return (
    <label className='text-sm text-(--text-muted)'>
      <span className='text-xs font-semibold uppercase tracking-[0.2em]'>{label}</span>
      <input
        {...register(name as never)}
        placeholder={placeholder}
        className='mt-2 w-full rounded-xl border border-(--border) bg-(--surface-muted) px-3 py-2 text-sm text-(--text-primary) placeholder:text-(--text-muted) focus:border-(--brand-accent) focus:outline-none'
      />
      {message && <span className='mt-1 block text-xs text-amber-700'>{message}</span>}
    </label>
  )
}
