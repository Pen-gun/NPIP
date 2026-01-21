interface PrimaryButtonProps {
  label: string
  onClick?: () => void
  type?: 'button' | 'submit'
  disabled?: boolean
}

export default function PrimaryButton({
  label,
  onClick,
  type = 'button',
  disabled = false,
}: PrimaryButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className='rounded-full bg-(--brand-primary) px-5 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-(--text-inverse) shadow-[0_16px_32px_rgba(31,75,127,0.28)] transition hover:-translate-y-px hover:shadow-[0_20px_34px_rgba(31,75,127,0.35)] disabled:cursor-not-allowed disabled:opacity-60'
    >
      {label}
    </button>
  )
}
