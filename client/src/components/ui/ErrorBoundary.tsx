import { Component, type ErrorInfo, type ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  error: Error | null
  stack: string | null
}

const CHUNK_ERROR_RE = /dynamically imported module|Loading chunk|Failed to fetch\b|import\(\) .*chunk|loading failed/i

function scheduleAutoReload() {
  if (typeof window === 'undefined') return
  const now = Date.now()
  const min = 10000
  try {
    const last = Number(sessionStorage.getItem('nf-err-reload') || 0)
    if (now - last < min) return
    sessionStorage.setItem('nf-err-reload', String(now))
  } catch {}
  window.location.reload()
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null, stack: null }

  static getDerivedStateFromError(error: Error): State {
    return { error, stack: error?.stack ?? null }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary]', error, info?.componentStack)
    // Self-heal on transient module/chunk load failures (e.g. loading the app
    // before the dev server is ready, or a chunk URL invalidated by a dev
    // restart). Guard with a sessionStorage throttle so rapid loops don't hammer.
    if (CHUNK_ERROR_RE.test(error?.message ?? '')) {
      scheduleAutoReload()
    }
    if (typeof window !== 'undefined') {
      try {
        window.dispatchEvent(new CustomEvent('novaflix:error', { detail: { message: error.message, stack: error.stack, componentStack: info?.componentStack } }))
      } catch {}
    }
  }

  private reset = () => {
    this.setState({ error: null, stack: null })
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem',
          background: '#0b0b0c',
          color: '#f5f5f5',
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}>
          <div style={{ maxWidth: 420, width: '100%', textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>🎬</div>
            <h1 style={{ fontSize: '1.4rem', fontWeight: 700, margin: '0 0 0.5rem' }}>Something went wrong</h1>
            <p style={{ color: '#9ca3af', fontSize: '0.9rem', lineHeight: 1.5, margin: '0 0 1rem' }}>
              An unexpected error stopped this page from rendering.
            </p>
            <button
              onClick={() => { this.reset(); if (typeof window !== 'undefined') window.location.reload() }}
              style={{
                background: '#e11d48',
                color: '#fff',
                border: 'none',
                borderRadius: '10px',
                padding: '0.65rem 1.5rem',
                fontSize: '0.9rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Reload page
            </button>
            {this.state.stack && (
              <pre style={{
                marginTop: '1.25rem',
                textAlign: 'left',
                fontSize: '0.68rem',
                color: '#6b7280',
                maxHeight: 160,
                overflow: 'auto',
                padding: '0.75rem',
                background: 'rgba(255,255,255,0.04)',
                borderRadius: '8px',
              }}>
                {this.state.stack.split('\n').slice(0, 6).join('\n')}
              </pre>
            )}
          </div>
        </div>
      )
    }
    return this.props.children
  }
}