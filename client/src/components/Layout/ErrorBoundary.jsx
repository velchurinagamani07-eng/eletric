import { Component } from 'react'
import { AlertTriangle, RefreshCcw } from 'lucide-react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary] React render failure:', error, info)
  }

  componentDidUpdate(previousProps) {
    if (this.state.hasError && previousProps.resetKey !== this.props.resetKey) {
      this.setState({ hasError: false, error: null })
    }
  }

  render() {
    if (!this.state.hasError) return this.props.children

    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4 dark:bg-gray-950" role="alert">
        <div className="panel max-w-md p-6 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-amber-700">
            <AlertTriangle size={24} />
          </div>
          <h1 className="mt-4 text-lg font-bold text-gray-950 dark:text-white">We could not load this page.</h1>
          <p className="mt-2 text-sm text-gray-500">
            Please refresh once. If the problem continues, the site shell is still available and the error has been logged for debugging.
          </p>
          {this.state.error?.message && (
            <p className="mt-3 rounded-lg bg-gray-100 px-3 py-2 text-xs font-semibold text-gray-600 dark:bg-white/10 dark:text-gray-300">
              {this.state.error.message}
            </p>
          )}
          <button type="button" className="btn-primary mt-5" onClick={() => window.location.reload()}>
            <RefreshCcw size={17} /> Refresh
          </button>
        </div>
      </main>
    )
  }
}
