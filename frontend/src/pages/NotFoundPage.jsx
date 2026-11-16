import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="wrap page">
      <div className="empty" style={{ padding: 'var(--s-9) var(--s-7)' }}>
        <p className="t-stat">404</p>
        <h1 style={{ fontSize: 'var(--t-h2)' }}>This page isn’t here</h1>
        <p>The link may be old, or the listing may have been taken down.</p>
        <div className="btn-row">
          <Link to="/listings" className="btn btn--primary">Browse leases</Link>
          <Link to="/" className="btn btn--secondary">Go to the home page</Link>
        </div>
      </div>
    </div>
  );
}
