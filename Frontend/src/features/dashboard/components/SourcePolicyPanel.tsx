const POLICY_ITEMS = Object.freeze([
  'Public sources only. Bots must be authorized for Viber.',
  'Meta monitoring is limited to owned assets.',
  'TikTok search is experimental; expect gaps.',
])

export default function SourcePolicyPanel() {
  return (
    <div className='rounded-2xl border border-(--border) bg-(--surface-base) p-4 shadow-sm sm:p-6'>
      <h3 className='text-base font-semibold sm:text-lg'>Source policy</h3>
      <ul className='mt-2 space-y-1.5 text-xs text-(--text-muted) sm:mt-3 sm:space-y-2 sm:text-sm'>
        {POLICY_ITEMS.map((item, index) => (
          <li key={index}>{item}</li>
        ))}
      </ul>
    </div>
  )
}

