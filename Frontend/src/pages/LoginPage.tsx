import { Link, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import type { FormEvent } from 'react'
import BrandLogo from '../components/BrandLogo'
import PrimaryButton from '../components/PrimaryButton'
import { loginUser, registerUser } from '../api/auth'

type AuthMode = 'login' | 'register'

const DEFAULT_ERROR_MESSAGE = 'Unable to authenticate'

const FEATURES = Object.freeze([
  'Private project dashboards with filters.',
  'Connector health, alerts, and exportable reports.',
  'Real-time Socket.io updates for spikes.',
  'Plan-aware usage safeguards built-in.',
])

export default function LoginPage() {
  const navigate = useNavigate()
  const [mode, setMode] = useState<AuthMode>('login')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const isLogin = mode === 'login'
  const toggleMode = () => setMode(isLogin ? 'register' : 'login')

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    setBusy(true)

    const form = new FormData(event.currentTarget)
    const payload = {
      fullName: String(form.get('fullName') || ''),
      username: String(form.get('username') || ''),
      email: String(form.get('email') || ''),
      password: String(form.get('password') || ''),
    }

    try {
      if (!isLogin) {
        await registerUser(payload)
      }
      await loginUser({
        username: payload.username,
        email: payload.email,
        password: payload.password,
      })
      navigate('/app')
    } catch (err) {
      setError(err instanceof Error ? err.message : DEFAULT_ERROR_MESSAGE)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className='min-h-screen bg-(--surface-background) text-(--text-primary)'>
      <div className='mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-6 px-4 py-6 sm:gap-10 sm:px-6 sm:py-10'>
        <header className='flex items-center justify-between'>
          <BrandLogo />
          <Link to='/' className='text-xs font-semibold uppercase tracking-[0.2em] text-(--text-muted) transition hover:text-(--text-primary) sm:tracking-[0.3em]'>
            Back to site
          </Link>
        </header>

        <main className='flex flex-1 flex-col items-center justify-center gap-6 lg:flex-row lg:items-stretch lg:gap-8'>
          <section className='w-full max-w-md rounded-[28px] border border-(--border) bg-(--surface-base) p-6 shadow-(--shadow) sm:p-8 lg:max-w-none lg:flex-1'>
            <p className='text-xs font-semibold uppercase tracking-[0.2em] text-(--brand-accent) sm:tracking-[0.3em]'>
              Welcome
            </p>
            <h1 className='mt-2 font-display text-2xl font-semibold sm:mt-3 sm:text-3xl'>
              {isLogin ? 'Sign in to your workspace' : 'Create your monitoring workspace'}
            </h1>
            <p className='mt-2 text-xs text-(--text-muted) sm:mt-3 sm:text-sm'>
              Access real-time alerts, sentiment tracking, and project dashboards in one place.
            </p>

            <form className='mt-5 space-y-3 sm:mt-6 sm:space-y-4' onSubmit={handleSubmit}>
              {!isLogin && (
                <input
                  name='fullName'
                  placeholder='Full name'
                  autoComplete='name'
                  className='w-full rounded-xl border border-(--border) bg-(--surface-muted) px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-(--brand-primary)/20'
                  required
                />
              )}
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
              <input
                name='password'
                type='password'
                placeholder='Password'
                autoComplete={isLogin ? 'current-password' : 'new-password'}
                className='w-full rounded-xl border border-(--border) bg-(--surface-muted) px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-(--brand-primary)/20'
                required
              />
              {error && <p className='text-xs text-(--state-error)'>{error}</p>}
              <PrimaryButton label={isLogin ? 'Sign in' : 'Create account'} type='submit' disabled={busy} />
            </form>

            <button
              type='button'
              onClick={toggleMode}
              className='mt-4 text-xs font-semibold uppercase tracking-[0.2em] text-(--text-muted) transition hover:text-(--text-primary) sm:tracking-[0.3em]'
            >
              {isLogin ? 'Need an account?' : 'Already have an account?'}
            </button>
          </section>

          <aside className='hidden w-full max-w-md rounded-[28px] border border-(--border) bg-(--surface-base) p-6 shadow-(--shadow) sm:p-8 lg:block lg:max-w-none lg:flex-1'>
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
