import { Link, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import BrandLogo from '../components/BrandLogo'
import PrimaryButton from '../components/PrimaryButton'
import { loginUser, registerUser } from '../api/auth'

export default function LoginPage() {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
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
      if (mode === 'register') {
        await registerUser(payload)
      }
      await loginUser({
        username: payload.username,
        email: payload.email,
        password: payload.password,
      })
      navigate('/app')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to authenticate')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className='min-h-screen bg-(--surface-background) text-(--text-primary)'>
      <div className='mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-10 px-6 py-10'>
        <header className='flex items-center justify-between'>
          <BrandLogo />
          <Link to='/' className='text-xs font-semibold uppercase tracking-[0.3em] text-(--text-muted)'>
            Back to site
          </Link>
        </header>

        <main className='grid items-center gap-8 lg:grid-cols-[1.1fr_0.9fr]'>
          <section className='rounded-[28px] border border-(--border) bg-(--surface-base) p-8 shadow-(--shadow)'>
            <p className='text-xs font-semibold uppercase tracking-[0.3em] text-(--brand-accent)'>
              Welcome
            </p>
            <h1 className='mt-3 font-display text-3xl font-semibold'>
              {mode === 'login' ? 'Sign in to your workspace' : 'Create your monitoring workspace'}
            </h1>
            <p className='mt-3 text-sm text-(--text-muted)'>
              Access real-time alerts, sentiment tracking, and project dashboards in one place.
            </p>

            <form className='mt-6 space-y-4' onSubmit={handleSubmit}>
              {mode === 'register' && (
                <input
                  name='fullName'
                  placeholder='Full name'
                  className='w-full rounded-xl border border-(--border) bg-(--surface-muted) px-4 py-2 text-sm'
                  required
                />
              )}
              <input
                name='username'
                placeholder='Username'
                className='w-full rounded-xl border border-(--border) bg-(--surface-muted) px-4 py-2 text-sm'
                required
              />
              <input
                name='email'
                type='email'
                placeholder='Email'
                className='w-full rounded-xl border border-(--border) bg-(--surface-muted) px-4 py-2 text-sm'
                required
              />
              <input
                name='password'
                type='password'
                placeholder='Password'
                className='w-full rounded-xl border border-(--border) bg-(--surface-muted) px-4 py-2 text-sm'
                required
              />
              {error && <p className='text-xs text-(--state-error)'>{error}</p>}
              <PrimaryButton label={mode === 'login' ? 'Sign in' : 'Create account'} type='submit' disabled={busy} />
            </form>

            <button
              type='button'
              onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
              className='mt-4 text-xs font-semibold uppercase tracking-[0.3em] text-(--text-muted)'
            >
              {mode === 'login' ? 'Need an account?' : 'Already have an account?'}
            </button>
          </section>

          <aside className='rounded-[28px] border border-(--border) bg-(--surface-base) p-8 shadow-(--shadow)'>
            <h2 className='text-lg font-semibold'>What you get</h2>
            <ul className='mt-4 space-y-3 text-sm text-(--text-muted)'>
              <li>Private project dashboards with filters.</li>
              <li>Connector health, alerts, and exportable reports.</li>
              <li>Real-time Socket.io updates for spikes.</li>
              <li>Plan-aware usage safeguards built-in.</li>
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
