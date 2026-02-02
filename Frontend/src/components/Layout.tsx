import type { ReactNode, CSSProperties } from 'react'
import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import BrandLogo from './BrandLogo'
import AdminQuickAccess from './AdminQuickAccess'
import { usePublicSiteSettings } from '../hooks/useSiteSettings'

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
  const isAdminPage = location.pathname.startsWith('/admin')
  const { data: settings } = usePublicSiteSettings()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleLogout = async () => {
    await logout()
    navigate('/')
  }

  // Don't show navbar on login page
  if (isLoginPage || isAdminPage) {
    return <>{children}</>
  }

  return (
    <div
      className='min-h-screen bg-(--surface-background) text-(--text-primary)'
      style={settings?.accentColor ? ({ '--brand-accent': settings.accentColor } as CSSProperties) : undefined}
    >
      <header className='sticky top-0 z-50 border-b border-(--border) bg-(--surface-background)/80 backdrop-blur-sm'>
        <nav className='mx-auto flex w-full max-w-none flex-wrap items-center justify-between gap-3 px-4 py-4 sm:flex-nowrap sm:gap-4 sm:px-6'>
          <Link to='/' aria-label='Go to home'>
            <BrandLogo />
          </Link>

          <button
            type='button'
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            className='ml-auto inline-flex h-10 w-10 items-center justify-center rounded-full border border-(--border) text-(--text-muted) transition hover:text-(--text-primary) sm:hidden'
            aria-label='Toggle menu'
            aria-expanded={mobileMenuOpen}
          >
            <span className='sr-only'>Menu</span>
            <div className='flex flex-col gap-1.5'>
              <span className='h-0.5 w-5 rounded bg-current' />
              <span className='h-0.5 w-5 rounded bg-current' />
              <span className='h-0.5 w-5 rounded bg-current' />
            </div>
          </button>

          <div className='hidden w-full flex-wrap items-center justify-end gap-3 text-xs font-semibold uppercase tracking-[0.15em] text-(--text-muted) sm:flex sm:w-auto sm:gap-6 sm:tracking-[0.2em]'>
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
        {mobileMenuOpen && (
          <div className='absolute left-0 right-0 top-full px-4 pb-4 sm:hidden'>
            <div className='flex flex-col gap-3 rounded-2xl border border-(--border) bg-(--surface-base) p-4 text-xs font-semibold uppercase tracking-[0.18em] text-(--text-muted) shadow-sm'>
              {isLandingPage && (
                <>
                  <Link to='/search' className='transition hover:text-(--text-primary)'>
                    Search
                  </Link>
                  <a href='#features' className='transition hover:text-(--text-primary)'>
                    Features
                  </a>
                  <a href='#sources' className='transition hover:text-(--text-primary)'>
                    Sources
                  </a>
                </>
              )}

              {!isLandingPage && !isDashboard && (
                <Link to='/search' className='transition hover:text-(--text-primary)'>
                  Search
                </Link>
              )}

              {isLoading ? (
                <div className='h-4 w-16 animate-pulse rounded bg-(--surface-muted)' />
              ) : isAuthenticated ? (
                <>
                  <span className='text-(--text-primary)'>
                    {user?.fullName || user?.username}
                  </span>
                  {!isDashboard && (
                    <Link
                      to='/app'
                      className='rounded-full border border-(--border) px-3 py-1.5 text-center transition hover:bg-(--surface-muted)'
                    >
                      Dashboard
                    </Link>
                  )}
                  <button
                    type='button'
                    onClick={handleLogout}
                    className='rounded-full border border-(--border) px-3 py-1.5 transition hover:bg-(--surface-muted)'
                  >
                    Sign out
                  </button>
                </>
              ) : (
                <Link
                  to='/login'
                  className='rounded-full border border-(--border) px-3 py-1.5 text-center transition hover:bg-(--surface-muted)'
                >
                  Sign in
                </Link>
              )}
            </div>
          </div>
        )}
      </header>

      <main>{children}</main>
      <AdminQuickAccess />
    </div>
  )
}
