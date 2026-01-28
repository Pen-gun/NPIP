import type { ReactNode } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import BrandLogo from './BrandLogo'

interface LayoutProps {
  children: ReactNode
}

export default function Layout({ children }: LayoutProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, isAuthenticated, isLoading, logout } = useAuth()

  const isLandingPage = location.pathname === '/'
  const isDashboard = location.pathname === '/app'
  const isLoginPage = location.pathname === '/login'

  const handleLogout = async () => {
    await logout()
    navigate('/')
  }

  // Don't show navbar on login page
  if (isLoginPage) {
    return <>{children}</>
  }

  return (
    <div className='min-h-screen bg-(--surface-background) text-(--text-primary)'>
      <header className='sticky top-0 z-50 border-b border-(--border) bg-(--surface-background)/80 backdrop-blur-sm'>
        <nav className='mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6'>
          <Link to='/' aria-label='Go to home'>
            <BrandLogo />
          </Link>

          <div className='flex items-center gap-4 text-xs font-semibold uppercase tracking-[0.15em] text-(--text-muted) sm:gap-6 sm:tracking-[0.2em]'>
            {/* Public links - show on landing page */}
            {isLandingPage && (
              <>
                <Link to='/search' className='hidden transition hover:text-(--text-primary) sm:block'>
                  Search
                </Link>
                <a href='#features' className='hidden transition hover:text-(--text-primary) md:block'>
                  Features
                </a>
                <a href='#sources' className='hidden transition hover:text-(--text-primary) md:block'>
                  Sources
                </a>
              </>
            )}

            {/* Search page link when not on landing */}
            {!isLandingPage && !isDashboard && (
              <Link to='/search' className='transition hover:text-(--text-primary)'>
                Search
              </Link>
            )}

            {/* Home link when on dashboard or search */}
            {(isDashboard || location.pathname === '/search') && null}

            {/* Auth section */}
            {isLoading ? (
              <div className='h-4 w-16 animate-pulse rounded bg-(--surface-muted)' />
            ) : isAuthenticated ? (
              <>
                <span className='hidden text-(--text-primary) sm:block'>
                  {user?.fullName || user?.username}
                </span>
                {!isDashboard && (
                  <Link
                    to='/app'
                    className='rounded-full border border-(--border) px-3 py-1.5 transition hover:bg-(--surface-muted) sm:px-4 sm:py-2'
                  >
                    Dashboard
                  </Link>
                )}
                <button
                  type='button'
                  onClick={handleLogout}
                  className='rounded-full border border-(--border) px-3 py-1.5 transition hover:bg-(--surface-muted) sm:px-4 sm:py-2'
                >
                  Sign out
                </button>
              </>
            ) : (
              <Link
                to='/login'
                className='rounded-full border border-(--border) px-3 py-1.5 transition hover:bg-(--surface-muted) sm:px-4 sm:py-2'
              >
                Sign in
              </Link>
            )}
          </div>
        </nav>
      </header>

      <main>{children}</main>
    </div>
  )
}
