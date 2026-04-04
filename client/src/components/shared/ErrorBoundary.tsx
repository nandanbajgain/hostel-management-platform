import { Component, type ErrorInfo, type ReactNode } from 'react'

type Props = {
  children: ReactNode
}

type State = {
  hasError: boolean
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: '100vh',
            display: 'grid',
            placeItems: 'center',
            background: 'var(--bg-primary)',
            padding: '2rem',
          }}
        >
          <div className="card" style={{ maxWidth: 560, textAlign: 'center' }}>
            <h1 style={{ fontFamily: 'Sora', fontSize: 24, marginBottom: 10 }}>
              Something went wrong
            </h1>
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7 }}>
              The app hit an unexpected error while loading data. Refresh the page and
              check that the backend is running.
            </p>
            <button
              className="btn-primary"
              style={{ marginTop: 16 }}
              onClick={() => window.location.reload()}
            >
              Reload
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
