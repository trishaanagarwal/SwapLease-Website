import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { t } from '../theme';

export default function VerifyEmailPage() {
  const { resendVerification, pendingVerification } = useAuth();
  const [status, setStatus] = useState('');

  const handleResend = async () => {
    setStatus('sending');
    try {
      await resendVerification();
      setStatus('sent');
    } catch {
      setStatus('error');
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: t.cream, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ width: '100%', maxWidth: 440, background: '#fff', borderRadius: t.radiusLg, border: `1px solid ${t.border}`, padding: 44, textAlign: 'center', boxShadow: t.shadow }}>
        <div style={{ fontSize: 56, marginBottom: 20 }}>📬</div>
        <h2 className="font-display" style={{ fontSize: 26, fontWeight: 800, color: t.ink, margin: '0 0 12px' }}>Check your inbox</h2>
        <p style={{ color: t.inkSoft, fontSize: 15, lineHeight: 1.6, margin: '0 0 4px' }}>
          We sent a verification link to
        </p>
        {pendingVerification && (
          <p style={{ color: t.ink, fontWeight: 700, fontSize: 15.5, margin: '0 0 12px' }}>{pendingVerification.email}</p>
        )}
        <p style={{ color: t.inkFaint, fontSize: 13, margin: '0 0 28px', lineHeight: 1.6 }}>
          Click the link to activate your account. Check your spam folder if you don't see it.
        </p>

        <Link to="/login" className="btn btn-coral" style={{ padding: '13px 36px', fontSize: 15.5, marginBottom: 16 }}>
          Go to login
        </Link>

        <div style={{ marginTop: 8 }}>
          {status === 'sent' ? (
            <p style={{ color: t.sage, fontSize: 14, fontWeight: 700 }}>✓ Email resent — check your inbox</p>
          ) : status === 'error' ? (
            <p style={{ color: t.coralDeep, fontSize: 14, fontWeight: 600 }}>Failed to resend. Try again.</p>
          ) : (
            <button onClick={handleResend} disabled={status === 'sending'}
              style={{ background: 'none', border: 'none', color: t.coralDeep, fontSize: 14, fontWeight: 700, cursor: 'pointer', textDecoration: 'underline', padding: 0 }}>
              {status === 'sending' ? 'Resending…' : 'Resend verification email'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
