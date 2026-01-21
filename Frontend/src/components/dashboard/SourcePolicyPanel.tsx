const POLICY_ITEMS = Object.freeze([
  'Public sources only. Bots must be authorized for Viber.',
  'Meta monitoring is limited to owned assets.',
  'TikTok search is experimental; expect gaps.',
])

export default function SourcePolicyPanel() {
  return (
    <div className='rounded-[28px] border border-(--border) bg-(--surface-base) p-6 shadow-(--shadow)'>
      <h3 className='text-lg font-semibold'>Source policy</h3>
      <ul className='mt-3 space-y-2 text-sm text-(--text-muted)'>
        {POLICY_ITEMS.map((item, index) => (
          <li key={index}>{item}</li>
        ))}
      </ul>
    </div>
  )
}
