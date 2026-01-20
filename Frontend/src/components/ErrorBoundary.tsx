import type { ReactNode } from 'react'
import { Component } from 'react'

type ErrorBoundaryProps = {
  children: ReactNode
}

type ErrorBoundaryState = {
  hasError: boolean
  message: string
}

export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = {
    hasError: false,
    message: '',
  }

  static getDerivedStateFromError(error: Error) {
    return {
      hasError: true,
      message: error.message || 'Unexpected error',
    }
  }

  handleReload = () => {
    window.location.reload()
  }

  render() {
    if (!this.state.hasError) {
      return this.props.children
    }

    return (
      <div className='min-h-screen px-6 py-12 text-[color:var(--text-primary)]'>
        <div className='mx-auto max-w-lg rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface-base)] p-6 shadow-[var(--shadow)]'>
          <h3 className='text-lg font-semibold'>Something went wrong</h3>
          <p className='mt-2 text-sm text-[color:var(--text-muted)]'>{this.state.message}</p>
          <button
            className='mt-4 rounded-xl bg-[color:var(--brand-accent)] px-4 py-2 text-sm font-semibold text-[color:var(--text-inverse)] transition hover:-translate-y-0.5 hover:shadow-lg'
            type='button'
            onClick={this.handleReload}
          >
            Reload
          </button>
        </div>
      </div>
    )
  }
}
