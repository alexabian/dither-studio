import { Component } from 'react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    console.error('Render error caught by ErrorBoundary:', error, info)
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          height: '100vh', gap: 12, fontFamily: 'monospace', padding: 24, boxSizing: 'border-box',
          background: '#111', color: '#eee'
        }}>
          <div style={{ fontSize: 15, fontWeight: 600 }}>Something went wrong</div>
          <pre style={{
            fontSize: 11, background: '#1e1e1e', padding: 16, borderRadius: 6,
            maxWidth: 600, overflow: 'auto', color: '#f87171', margin: 0
          }}>
            {this.state.error.message}
          </pre>
          <button
            onClick={() => this.setState({ error: null })}
            style={{ padding: '6px 14px', borderRadius: 4, border: '1px solid #555', background: '#222', color: '#eee', cursor: 'pointer', fontSize: 12 }}
          >
            Try again
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
