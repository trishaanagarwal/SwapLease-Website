import { useState } from 'react';
import { Link } from 'react-router-dom';
import { MailCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

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
    <div className="wrap page auth">
      <div className="auth__card stack-4">
        <span className="action-card__icon" style={{ margin: 0 }}><MailCheck size={22} aria-hidden="true" /></span>
        <h1 style={{ fontSize: 'var(--t-h3)' }}>Check your inbox</h1>
        <p className="muted">We sent a verification link{pendingVerification ? <> to <b style={{ color: 'var(--ink)', fontWeight: 500 }}>{pendingVerification.email}</b></> : null}. Open it to activate your account. If it isn’t there, check the spam folder.</p>
        <div className="btn-row">
          <Link to="/login" className="btn btn--primary">Sign in</Link>
          {status !== 'sent' && <button type="button" onClick={handleResend} disabled={status === 'sending'} className="btn btn--secondary">{status === 'sending' ? 'Sending' : 'Send the link again'}</button>}
        </div>
        {status === 'sent' && <p className="alert alert--ok" role="status">Sent. Check your inbox.</p>}
        {status === 'error' && <p className="alert alert--error" role="alert">The email didn’t send. Try again in a minute.</p>}
      </div>
    </div>
  );
}
