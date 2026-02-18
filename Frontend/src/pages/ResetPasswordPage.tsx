import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useState, useEffect } from 'react'
import type { FormEvent } from 'react'
import BrandLogo from '../components/BrandLogo'
import PrimaryButton from '../components/PrimaryButton'
import { resetPassword } from '../features/auth'

export default function ResetPasswordPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!token) {
      setError('Invalid or missing reset token. Please request a new password reset link.')
    }
  }, [token])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!token) return
    
    setError('')
    setBusy(true)

    const form = new FormData(event.currentTarget)
    const newPassword = String(form.get('newPassword') || '')
    const confirmPassword = String(form.get('confirmPassword') || '')

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long')
      setBusy(false)
      return
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match')
      setBusy(false)
      return
    }

    try {
      await resetPassword({ token, newPassword, confirmPassword })
      setSuccess(true)
      // Redirect to login after 3 seconds
      setTimeout(() => navigate('/login', { replace: true }), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reset password')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className='min-h-screen bg-(--surface-background) text-(--text-primary)'>
      <div className='mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-6 px-4 py-6 sm:gap-10 sm:px-6 sm:py-10'>
        <header className='landing-reveal flex items-center justify-between'>
          <BrandLogo />
          <Link to='/login' className='text-xs font-semibold uppercase tracking-[0.2em] text-(--text-muted) transition hover:text-(--text-primary) sm:tracking-[0.3em]'>
            Back to login
          </Link>
        </header>

        <main className='landing-reveal flex flex-1 items-center justify-center'>
          <section className='landing-reveal-soft w-full max-w-md rounded-[28px] border border-(--border) bg-(--surface-base) p-6 shadow-(--shadow) sm:p-8'>
            {success ? (
              <>
                <div className='text-center'>
                  <div className='mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100'>
                    <svg className='h-8 w-8 text-green-600' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                      <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M5 13l4 4L19 7' />
                    </svg>
                  </div>
                  <h1 className='font-display text-2xl font-semibold sm:text-3xl'>Password Reset Successful!</h1>
                  <p className='mt-3 text-sm text-(--text-muted)'>
                    Your password has been reset successfully. Redirecting to login...
                  </p>
                  <Link 
                    to='/login'
                    className='mt-6 inline-block text-sm font-semibold text-(--brand-accent) hover:underline'
                  >
                    Go to login now
                  </Link>
                </div>
              </>
            ) : (
              <>
                <p className='text-xs font-semibold uppercase tracking-[0.2em] text-(--brand-accent) sm:tracking-[0.3em]'>
                  Reset Password
                </p>
                <h1 className='mt-2 font-display text-2xl font-semibold sm:mt-3 sm:text-3xl'>
                  Create a new password
                </h1>
                <p className='mt-2 text-xs text-(--text-muted) sm:mt-3 sm:text-sm'>
                  Enter your new password below. Make sure it's at least 6 characters long.
                </p>

                <form className='mt-5 space-y-3 sm:mt-6 sm:space-y-4' onSubmit={handleSubmit}>
                  <input
                    name='newPassword'
                    type='password'
                    placeholder='New password'
                    autoComplete='new-password'
                    minLength={6}
                    className='w-full rounded-xl border border-(--border) bg-(--surface-muted) px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-(--brand-primary)/20'
                    required
                    disabled={!token}
                  />
                  <input
                    name='confirmPassword'
                    type='password'
                    placeholder='Confirm new password'
                    autoComplete='new-password'
                    minLength={6}
                    className='w-full rounded-xl border border-(--border) bg-(--surface-muted) px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-(--brand-primary)/20'
                    required
                    disabled={!token}
                  />
                  {error && <p className='text-xs text-(--state-error)'>{error}</p>}
                  <PrimaryButton 
                    label='Reset Password' 
                    type='submit' 
                    disabled={busy || !token} 
                  />
                </form>

                <Link 
                  to='/login'
                  className='mt-4 inline-block text-xs font-semibold uppercase tracking-[0.2em] text-(--text-muted) transition hover:text-(--text-primary) sm:tracking-[0.3em]'
                >
                  Back to login
                </Link>
              </>
            )}
          </section>
        </main>
      </div>
    </div>
  )
}

