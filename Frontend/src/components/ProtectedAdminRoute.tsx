import type { ReactNode } from 'react'
import { Link, Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../features/auth'

interface ProtectedAdminRouteProps {
  children: ReactNode
}

const isAdminUser = (role?: string, isAdmin?: boolean) => Boolean(isAdmin || role === 'admin')

export default function ProtectedAdminRoute({ children }: ProtectedAdminRouteProps) {
  const location = useLocation()
  const { isLoading, isAuthenticated, user } = useAuth()

  if (isLoading) {
    return (
      <div className='flex min-h-screen items-center justify-center text-(--text-primary)'>
        <div className='flex flex-col items-center gap-4'>
          <div className='h-8 w-8 animate-spin rounded-full border-4 border-(--brand-primary) border-t-transparent' />
          <p className='text-sm text-(--text-muted)'>Loading...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to='/login' state={{ from: location }} replace />
  }

  if (!isAdminUser(user?.role, user?.isAdmin)) {
    return (
      <div className='flex min-h-screen items-center justify-center bg-(--surface-background) px-4 text-(--text-primary)'>
        <div className='w-full max-w-md rounded-2xl border border-(--border) bg-(--surface-base) p-6 text-center shadow-sm'>
          <p className='text-sm font-semibold uppercase tracking-[0.2em] text-(--text-muted)'>Access denied</p>
          <h1 className='mt-3 text-2xl font-semibold text-(--text-primary)'>Admins only</h1>
          <p className='mt-2 text-sm text-(--text-muted)'>
            You need an admin role to access the CMS. If you believe this is a mistake,
            contact your administrator.
          </p>
          <div className='mt-6'>
            <Link
              to='/app'
              className='inline-flex items-center justify-center rounded-full border border-(--border) px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-(--text-muted) transition hover:text-(--text-primary)'
            >
              Go to dashboard
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return <>{children}</>
}

