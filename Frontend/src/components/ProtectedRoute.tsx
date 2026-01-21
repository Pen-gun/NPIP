import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { getCurrentUser } from '../api/auth'

interface ProtectedRouteProps {
  children: ReactNode
}

type AuthState = 'loading' | 'authenticated' | 'unauthenticated'

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const location = useLocation()
  const [authState, setAuthState] = useState<AuthState>('loading')

  useEffect(() => {
    let cancelled = false

    getCurrentUser()
      .then(() => {
        if (cancelled) return
        setAuthState('authenticated')
      })
      .catch(() => {
        if (cancelled) return
        setAuthState('unauthenticated')
      })

    return () => {
      cancelled = true
    }
  }, [])

  if (authState === 'loading') {
    return (
      <div className='flex min-h-screen items-center justify-center text-(--text-primary)'>
        <div className='flex flex-col items-center gap-4'>
          <div className='h-8 w-8 animate-spin rounded-full border-4 border-(--brand-primary) border-t-transparent' />
          <p className='text-sm text-(--text-muted)'>Loading...</p>
        </div>
      </div>
    )
  }

  if (authState === 'unauthenticated') {
    return <Navigate to='/login' state={{ from: location }} replace />
  }

  return <>{children}</>
}
