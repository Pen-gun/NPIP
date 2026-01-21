import { Link } from 'react-router-dom'
import BrandLogo from '../BrandLogo'

interface DashboardHeaderProps {
  userName?: string
  onLogout: () => void
}

export default function DashboardHeader({ userName, onLogout }: DashboardHeaderProps) {
  return (
    <header className='flex flex-wrap items-center justify-between gap-6'>
      <BrandLogo />
      <div className='flex items-center gap-4 text-xs font-semibold uppercase tracking-[0.2em] text-(--text-muted)'>
        <span>{userName}</span>
        <button
          type='button'
          className='rounded-full border border-(--border) px-4 py-2'
          onClick={onLogout}
        >
          Log out
        </button>
        <Link to='/' className='rounded-full border border-(--border) px-4 py-2'>
          Back to site
        </Link>
      </div>
    </header>
  )
}
