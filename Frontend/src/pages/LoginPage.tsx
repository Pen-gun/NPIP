import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'
import type { FormEvent } from 'react'
import BrandLogo from '../components/BrandLogo'
import PrimaryButton from '../components/PrimaryButton'
import { useAuth } from '../contexts/AuthContext'
import { forgotPassword } from '../api/auth'

type AuthMode = 'login' | 'register' | 'forgot'

const DEFAULT_ERROR_MESSAGE = 'Unable to authenticate'

const FEATURES = Object.freeze([
  'Private project dashboards with filters.',
  'Connector health, alerts, and exportable reports.',
  'Real-time Socket.io updates for spikes.',
  'Plan-aware usage safeguards built-in.',
])

export default function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { login, register, isAuthenticated, isLoading } = useAuth()
  const [mode, setMode] = useState<AuthMode>('login')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [busy, setBusy] = useState(false)

  // Redirect if already authenticated
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      const from = (location.state as { from?: Location })?.from?.pathname || '/app'
      navigate(from, { replace: true })
    }
  }, [isAuthenticated, isLoading, navigate, location])

  const isLogin = mode === 'login'
  const isRegister = mode === 'register'
  const isForgot = mode === 'forgot'
  const toggleMode = () => {
    setMode(isLogin ? 'register' : 'login')
    setError('')
    setSuccess('')
  }
  const toggleForgot = () => {
    setMode(isForgot ? 'login' : 'forgot')
    setError('')
    setSuccess('')
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    setSuccess('')
    setBusy(true)

    const form = new FormData(event.currentTarget)
    
    // Handle forgot password
    if (isForgot) {
      const email = String(form.get('email') || '').trim()
      try {
        await forgotPassword({ email })
        setSuccess('If an account exists with this email, you will receive a password reset link.')
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to send reset email')
      } finally {
        setBusy(false)
      }
      return
    }

    const payload = {
      fullName: String(form.get('fullName') || ''),
      username: String(form.get('username') || ''),
      email: String(form.get('email') || ''),
      password: String(form.get('password') || ''),
    }
    const loginIdentifier =
      String(form.get('identifier') || '').trim() || payload.email.trim() || payload.username.trim()

    try {
      if (isRegister) {
        await register(payload)
      }
      await login({
        identifier: loginIdentifier,
        password: payload.password,
      })
      const from = (location.state as { from?: Location })?.from?.pathname || '/app'
      navigate(from, { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : DEFAULT_ERROR_MESSAGE)
    } finally {
      setBusy(false)
    }
  }

  // Show loading state while checking auth
  if (isLoading) {
    return (
      <div className='flex min-h-screen items-center justify-center bg-(--surface-background) text-(--text-primary)'>
        <div className='h-8 w-8 animate-spin rounded-full border-4 border-(--brand-primary) border-t-transparent' />
      </div>
    )
  }

  return (
    <div className='min-h-screen bg-(--surface-background) text-(--text-primary)'>
      <div className='mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-6 px-4 py-6 sm:gap-10 sm:px-6 sm:py-10'>
        <header className='landing-reveal flex items-center justify-between'>
          <BrandLogo />
          <Link to='/' className='text-xs font-semibold uppercase tracking-[0.2em] text-(--text-muted) transition hover:text-(--text-primary) sm:tracking-[0.3em]'>
            Back to site
          </Link>
        </header>

        <main className='landing-reveal flex flex-1 flex-col items-center justify-center gap-6 lg:flex-row lg:items-stretch lg:gap-8'>
          <section className='landing-reveal-soft w-full max-w-md rounded-[28px] border border-(--border) bg-(--surface-base) p-6 shadow-(--shadow) sm:p-8 lg:max-w-none lg:flex-1'>
            <p className='text-xs font-semibold uppercase tracking-[0.2em] text-(--brand-accent) sm:tracking-[0.3em]'>
              Welcome
            </p>
            <h1 className='mt-2 font-display text-2xl font-semibold sm:mt-3 sm:text-3xl'>
              {isForgot ? 'Reset your password' : isLogin ? 'Sign in to your workspace' : 'Create your monitoring workspace'}
            </h1>
            <p className='mt-2 text-xs text-(--text-muted) sm:mt-3 sm:text-sm'>
              {isForgot 
                ? 'Enter your email address and we\'ll send you a link to reset your password.'
                : 'Access real-time alerts, sentiment tracking, and project dashboards in one place.'
              }
            </p>

            <form className='mt-5 space-y-3 sm:mt-6 sm:space-y-4' onSubmit={handleSubmit}>
              {isForgot ? (
                <input
                  name='email'
                  type='email'
                  placeholder='Email address'
                  autoComplete='email'
                  className='w-full rounded-xl border border-(--border) bg-(--surface-muted) px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-(--brand-primary)/20'
                  required
                />
              ) : (
                <>
                  {isRegister && (
                    <input
                      name='fullName'
                      placeholder='Full name'
                      autoComplete='name'
                      className='w-full rounded-xl border border-(--border) bg-(--surface-muted) px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-(--brand-primary)/20'
                      required
                    />
                  )}
                  {isLogin ? (
                    <input
                      name='identifier'
                      placeholder='Email or username'
                      autoComplete='username'
                      className='w-full rounded-xl border border-(--border) bg-(--surface-muted) px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-(--brand-primary)/20'
                      required
                    />
                  ) : (
                    <>
                      <input
                        name='username'
                        placeholder='Username'
                        autoComplete='username'
                        className='w-full rounded-xl border border-(--border) bg-(--surface-muted) px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-(--brand-primary)/20'
                        required
                      />
                      <input
                        name='email'
                        type='email'
                        placeholder='Email'
                        autoComplete='email'
                        className='w-full rounded-xl border border-(--border) bg-(--surface-muted) px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-(--brand-primary)/20'
                        required
                      />
                    </>
                  )}
                  <input
                    name='password'
                    type='password'
                    placeholder='Password'
                    autoComplete={isLogin ? 'current-password' : 'new-password'}
                    className='w-full rounded-xl border border-(--border) bg-(--surface-muted) px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-(--brand-primary)/20'
                    required
                  />
                </>
              )}
              {error && <p className='text-xs text-(--state-error)'>{error}</p>}
              {success && <p className='text-xs text-green-600'>{success}</p>}
              <PrimaryButton 
                label={isForgot ? 'Send reset link' : isLogin ? 'Sign in' : 'Create account'} 
                type='submit' 
                disabled={busy} 
              />
            </form>

            <div className='mt-4 flex flex-wrap items-center justify-between gap-2'>
              <button
                type='button'
                onClick={toggleMode}
                className='text-xs font-semibold uppercase tracking-[0.2em] text-(--text-muted) transition hover:text-(--text-primary) sm:tracking-[0.3em]'
              >
                {isLogin ? 'Need an account?' : isForgot ? 'Back to login' : 'Already have an account?'}
              </button>
              {isLogin && (
                <button
                  type='button'
                  onClick={toggleForgot}
                  className='text-xs font-semibold text-(--brand-accent) transition hover:underline'
                >
                  Forgot password?
                </button>
              )}
              {isForgot && (
                <button
                  type='button'
                  onClick={toggleForgot}
                  className='text-xs font-semibold text-(--brand-accent) transition hover:underline'
                >
                  Back to login
                </button>
              )}
            </div>
          </section>

          <aside className='landing-reveal-soft hidden w-full max-w-md rounded-[28px] border border-(--border) bg-(--surface-base) p-6 shadow-(--shadow) sm:p-8 lg:block lg:max-w-none lg:flex-1'>
            <h2 className='text-lg font-semibold'>What you get</h2>
            <ul className='mt-4 space-y-3 text-sm text-(--text-muted)'>
              {FEATURES.map((feature) => (
                <li key={feature} className='flex items-start gap-2'>
                  <span className='mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-(--brand-accent)' />
                  {feature}
                </li>
              ))}
            </ul>
            <div className='mt-6 rounded-2xl bg-(--surface-muted) p-4 text-xs text-(--text-muted)'>
              Tip: Use boolean queries like <strong>brand AND (nepal OR kathmandu)</strong> to
              reduce noise.
            </div>
          </aside>
        </main>
      </div>
    </div>
  )
}
