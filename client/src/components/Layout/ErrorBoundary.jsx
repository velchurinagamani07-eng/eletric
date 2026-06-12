import { Component } from 'react'
import { AlertTriangle, RefreshCcw } from 'lucide-react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  render() {
    if (!this.state.hasError) return this.props.children

    return (
      <main className="flex min-h-[70vh] items-center justify-center bg-gray-50 px-4 dark:bg-gray-950">
        <div className="panel max-w-md p-6 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-amber-700">
            <AlertTriangle size={24} />
          </div>
          <h1 className="mt-4 text-lg font-bold text-gray-950 dark:text-white">Something went wrong.</h1>
          <p className="mt-2 text-sm text-gray-500">Try refreshing the page or return to the dashboard.</p>
          <button type="button" className="btn-primary mt-5" onClick={() => window.location.reload()}>
            <RefreshCcw size={17} /> Refresh
          </button>
        </div>
      </main>
    )
  }
}

