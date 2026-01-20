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
      <div className='min-h-screen px-6 py-12 text-(--text-primary)'>
        <div className='mx-auto max-w-lg rounded-2xl border border-(--border) bg-(--surface-base) p-6 shadow-(--shadow)'>
          <h3 className='text-lg font-semibold'>Something went wrong</h3>
          <p className='mt-2 text-sm text-(--text-muted)'>{this.state.message}</p>
          <button
            className='mt-4 rounded-xl bg-(--brand-accent) px-4 py-2 text-sm font-semibold text-(--text-inverse) transition hover:-translate-y-0.5 hover:shadow-lg'
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

