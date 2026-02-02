import { Shield } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function AdminQuickAccess() {
  const { user, isAuthenticated, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading || !isAuthenticated) return null
  const isAdmin = Boolean(user?.isAdmin || user?.role === 'admin')
  if (!isAdmin) return null
  if (location.pathname.startsWith('/admin')) return null

  return (
    <div className='fixed bottom-6 right-6 z-40'>
      <Link
        to='/admin/cms'
        className='inline-flex items-center gap-2 rounded-full border border-(--border) bg-(--surface-base) px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-(--text-muted) shadow-sm transition hover:text-(--text-primary)'
        aria-label='Open admin CMS'
      >
        <Shield className='h-4 w-4' aria-hidden />
        Admin
      </Link>
    </div>
  )
}
