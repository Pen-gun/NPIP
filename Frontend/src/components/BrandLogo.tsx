export default function BrandLogo() {
  return (
    <div className='flex items-center gap-3'>
      <div className='grid h-10 w-10 place-items-center overflow-hidden rounded-2xl bg-(--surface-muted)'>
        <img src='/NPIP.png' alt='NPIP logo' className='h-full w-full object-cover' />
      </div>
      <div className='leading-tight'>
        <p className='text-sm font-semibold tracking-[0.2em] text-(--brand-accent)'>NPIP</p>
        <p className='text-xs text-(--text-muted)'>Nepal is listening</p>
      </div>
    </div>
  )
}
