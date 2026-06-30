import { Link } from 'react-router-dom';
import { t } from '../theme';

export default function NotFoundPage() {
  return (
    <div style={{ minHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: t.cream, padding: 24, textAlign: 'center' }}>
      <div style={{ maxWidth: 440 }}>
        <div className="font-display" style={{ fontSize: 80, fontWeight: 900, lineHeight: 1 }}><span className="grad-text">404</span></div>
        <h1 className="font-display" style={{ fontSize: 26, fontWeight: 800, color: t.ink, margin: '16px 0 10px' }}>Page not found</h1>
        <p style={{ color: t.inkSoft, fontSize: 15, lineHeight: 1.6, margin: '0 0 24px' }}>
          The page you're looking for doesn't exist or may have moved.
        </p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link to="/" className="btn btn-coral" style={{ padding: '12px 26px', fontSize: 15 }}>Go home</Link>
          <Link to="/listings" className="btn btn-soft" style={{ padding: '12px 26px', fontSize: 15 }}>Browse listings</Link>
        </div>
      </div>
    </div>
  );
}
