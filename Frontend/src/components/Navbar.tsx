import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import BrandLogo from './BrandLogo'

interface NavLink {
  href: string
  label: string
  isExternal?: boolean
}

interface NavbarProps {
  links?: NavLink[]
  showAuth?: boolean
  userName?: string
  onLogout?: () => void
}

const DEFAULT_LINKS: NavLink[] = [
  { href: '#features', label: 'Features', isExternal: true },
  { href: '#sources', label: 'Sources', isExternal: true },
  { href: '#workflow', label: 'Workflow', isExternal: true },
]

export default function Navbar({ links = DEFAULT_LINKS, showAuth = true, userName, onLogout }: NavbarProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const location = useLocation()
  const isDashboard = location.pathname === '/app'

  const toggleMenu = () => setIsMenuOpen((prev) => !prev)
  const closeMenu = () => setIsMenuOpen(false)

  return (
    <header className='relative'>
      <nav className='flex items-center justify-between gap-4'>
        <BrandLogo />

        {/* Desktop Navigation */}
        <div className='hidden items-center gap-6 text-xs font-semibold uppercase tracking-[0.2em] text-(--text-muted) md:flex'>
          {!isDashboard &&
            links.map((link) =>
              link.isExternal ? (
                <a key={link.href} href={link.href} className='transition hover:text-(--text-primary)'>
                  {link.label}
                </a>
              ) : (
                <Link key={link.href} to={link.href} className='transition hover:text-(--text-primary)'>
                  {link.label}
                </Link>
              ),
            )}
          {userName && <span className='text-(--text-primary)'>{userName}</span>}
          {showAuth && !userName && (
            <Link to='/login' className='rounded-full border border-(--border) px-4 py-2 transition hover:bg-(--surface-muted)'>
              Sign in
            </Link>
          )}
          {userName && onLogout && (
            <>
              <button
                type='button'
                className='rounded-full border border-(--border) px-4 py-2 transition hover:bg-(--surface-muted)'
                onClick={onLogout}
              >
                Log out
              </button>
              <Link to='/' className='rounded-full border border-(--border) px-4 py-2 transition hover:bg-(--surface-muted)'>
                Home
              </Link>
            </>
          )}
          {isDashboard && !userName && (
            <Link to='/' className='rounded-full border border-(--border) px-4 py-2 transition hover:bg-(--surface-muted)'>
              Home
            </Link>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          type='button'
          onClick={toggleMenu}
          className='flex h-10 w-10 items-center justify-center rounded-full border border-(--border) md:hidden'
          aria-label='Toggle menu'
        >
          {isMenuOpen ? (
            <svg className='h-5 w-5' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' />
            </svg>
          ) : (
            <svg className='h-5 w-5' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M4 6h16M4 12h16M4 18h16' />
            </svg>
          )}
        </button>
      </nav>

      {/* Mobile Menu Dropdown */}
      {isMenuOpen && (
        <div className='absolute left-0 right-0 top-full z-50 mt-4 rounded-2xl border border-(--border) bg-(--surface-base) p-4 shadow-lg md:hidden'>
          <div className='flex flex-col gap-3'>
            {!isDashboard &&
              links.map((link) =>
                link.isExternal ? (
                  <a
                    key={link.href}
                    href={link.href}
                    onClick={closeMenu}
                    className='rounded-xl px-4 py-3 text-sm font-semibold uppercase tracking-[0.15em] transition hover:bg-(--surface-muted)'
                  >
                    {link.label}
                  </a>
                ) : (
                  <Link
                    key={link.href}
                    to={link.href}
                    onClick={closeMenu}
                    className='rounded-xl px-4 py-3 text-sm font-semibold uppercase tracking-[0.15em] transition hover:bg-(--surface-muted)'
                  >
                    {link.label}
                  </Link>
                ),
              )}
            {userName && (
              <div className='border-t border-(--border) pt-3'>
                <p className='px-4 py-2 text-sm text-(--text-muted)'>Signed in as <strong>{userName}</strong></p>
              </div>
            )}
            <div className='flex flex-col gap-2 border-t border-(--border) pt-3'>
              {showAuth && !userName && (
                <Link
                  to='/login'
                  onClick={closeMenu}
                  className='rounded-xl bg-(--brand-primary) px-4 py-3 text-center text-sm font-semibold text-(--text-inverse)'
                >
                  Sign in
                </Link>
              )}
              {userName && onLogout && (
                <button
                  type='button'
                  onClick={() => {
                    onLogout()
                    closeMenu()
                  }}
                  className='rounded-xl border border-(--border) px-4 py-3 text-sm font-semibold transition hover:bg-(--surface-muted)'
                >
                  Log out
                </button>
              )}
              <Link
                to={isDashboard ? '/' : '/app'}
                onClick={closeMenu}
                className='rounded-xl border border-(--border) px-4 py-3 text-center text-sm font-semibold transition hover:bg-(--surface-muted)'
              >
                {isDashboard ? 'Back to Home' : 'View Dashboard'}
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
