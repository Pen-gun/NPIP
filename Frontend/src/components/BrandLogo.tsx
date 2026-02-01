import { usePublicSiteSettings } from '../hooks/useSiteSettings'

export default function BrandLogo() {
  const { data } = usePublicSiteSettings()
  const brandName = data?.brandName || 'NPIP'
  const tagline = data?.tagline || 'Nepal is listening'
  const logoUrl = data?.logoUrl || '/NPIP.png'

  return (
    <div className='flex items-center gap-3'>
      <div className='grid h-10 w-10 place-items-center overflow-hidden rounded-2xl bg-(--surface-muted)'>
        <img src={logoUrl} alt={`${brandName} logo`} className='h-full w-full object-cover' />
      </div>
      <div className='leading-tight'>
        <p className='text-sm font-semibold tracking-[0.2em] text-(--brand-accent)'>{brandName}</p>
        <p className='text-xs text-(--text-muted)'>{tagline}</p>
      </div>
    </div>
  )
}
