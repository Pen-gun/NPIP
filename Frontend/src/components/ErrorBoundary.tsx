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
      <div className='app'>
        <div className='card card--error'>
          <h3>Something went wrong</h3>
          <p>{this.state.message}</p>
          <button className='button-inline' type='button' onClick={this.handleReload}>
            Reload
          </button>
        </div>
      </div>
    )
  }
}
