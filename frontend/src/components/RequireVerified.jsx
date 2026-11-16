import { useState } from 'react';
import { MailCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

// Gates an action behind email verification. Verified users (incl. Google)
// pass straight through; unverified users see a prompt to verify.
export default function RequireVerified({ children, action = 'do this' }) {
  const { user, resendVerification, refreshUser } = useAuth();
  const [status, setStatus] = useState('');
  const [checking, setChecking] = useState(false);

  if (user?.emailVerified) return children;

  const resend = async () => {
    setStatus('sending');
    try { await resendVerification(); setStatus('sent'); }
    catch { setStatus('error'); }
  };

  const recheck = async () => {
    setChecking(true);
    const ok = await refreshUser();
    setChecking(false);
    if (!ok) setStatus('still');
  };

  return (
    <div className="wrap page">
      <div className="sheet sheet--pad narrow stack-4">
        <span className="action-card__icon" style={{ margin: 0 }}><MailCheck size={22} aria-hidden="true" /></span>
        <h1 style={{ fontSize: 'var(--t-h3)' }}>Verify your email to {action}</h1>
        <p className="muted">We sent a link to <b style={{ color: 'var(--ink)', fontWeight: 500 }}>{user?.email}</b>. If it isn’t in your inbox, check the spam folder.</p>
        {status === 'sent' && <p className="alert alert--ok" role="status">Sent. Check your inbox and your spam folder.</p>}
        {status === 'error' && <p className="alert alert--error" role="alert">The email didn’t send. Wait a minute, then try again.</p>}
        {status === 'still' && <p className="alert alert--error" role="alert">Your email isn’t verified yet. Open the link in the email, then try again.</p>}
        <div className="btn-row">
          <button type="button" onClick={recheck} disabled={checking} className="btn btn--primary">{checking ? 'Checking' : 'I’ve verified my email'}</button>
          <button type="button" onClick={resend} disabled={status === 'sending'} className="btn btn--secondary">{status === 'sending' ? 'Sending' : 'Send the link again'}</button>
        </div>
      </div>
    </div>
  );
}
