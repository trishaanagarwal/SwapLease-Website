import { Component } from 'react';

// Catches render-time crashes so users see a friendly message, never a blank page.
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    // Surface in console for debugging; could be wired to a logging service later.
    console.error('App error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F8F6F1', padding: 24, textAlign: 'center', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          <div style={{ maxWidth: 420 }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🛠️</div>
            <h1 style={{ fontFamily: "'Fraunces', Georgia, serif", fontSize: 26, fontWeight: 800, color: '#16223B', margin: '0 0 10px' }}>Something went wrong</h1>
            <p style={{ color: '#586079', fontSize: 15, lineHeight: 1.6, margin: '0 0 24px' }}>
              Sorry about that. Try reloading the page, or head back to the homepage.
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
              <button onClick={() => window.location.reload()}
                style={{ background: '#1B3A6B', color: '#fff', border: 'none', borderRadius: 999, padding: '12px 26px', fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                Reload page
              </button>
              <a href="/"
                style={{ background: '#fff', color: '#16223B', border: '1.5px solid #D9D3C6', borderRadius: 999, padding: '12px 26px', fontSize: 15, fontWeight: 700, textDecoration: 'none' }}>
                Go home
              </a>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
