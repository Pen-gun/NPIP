export default function BrandLogo() {
  return (
    <div className='flex items-center gap-3'>
      <div className='grid h-10 w-10 place-items-center rounded-2xl bg-(--brand-primary) text-white'>
        NP
      </div>
      <div className='leading-tight'>
        <p className='text-sm font-semibold tracking-[0.2em] text-(--brand-accent)'>NPIP</p>
        <p className='text-xs text-(--text-muted)'>Nepal Listening</p>
      </div>
    </div>
  )
}
