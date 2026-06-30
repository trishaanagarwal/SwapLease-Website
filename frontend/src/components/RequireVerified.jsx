import { useState } from 'react';
import { MailCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { t } from '../theme';

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
    <div style={{ minHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: t.cream, padding: 24 }}>
      <div style={{ maxWidth: 460, width: '100%', background: '#fff', borderRadius: t.radiusLg, border: `1px solid ${t.border}`, boxShadow: t.shadow, padding: 40, textAlign: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 18, color: t.coral }}><MailCheck size={48} /></div>
        <h1 className="font-display" style={{ fontSize: 25, fontWeight: 800, color: t.ink, margin: '0 0 10px' }}>Verify your email first</h1>
        <p style={{ color: t.inkSoft, fontSize: 15, lineHeight: 1.6, margin: '0 0 6px' }}>
          To {action}, please verify your email address. We sent a link to <strong style={{ color: t.ink }}>{user?.email}</strong>.
        </p>
        <p style={{ color: t.inkFaint, fontSize: 13.5, lineHeight: 1.6, margin: '0 0 24px', fontWeight: 700 }}>
          Can’t find it? Please check your spam or junk folder.
        </p>

        {status === 'sent' && <div style={{ color: t.sage, fontWeight: 700, fontSize: 14, marginBottom: 16 }}>✓ Verification email sent — check your inbox and spam.</div>}
        {status === 'error' && <div style={{ color: t.coralDeep, fontWeight: 700, fontSize: 14, marginBottom: 16 }}>Couldn’t send right now. Try again in a moment.</div>}
        {status === 'still' && <div style={{ color: t.coralDeep, fontWeight: 700, fontSize: 14, marginBottom: 16 }}>Not verified yet — click the link in your email, then try again.</div>}

        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button onClick={recheck} disabled={checking} className="btn btn-coral" style={{ padding: '12px 24px', fontSize: 15 }}>
            {checking ? 'Checking…' : 'I’ve verified'}
          </button>
          <button onClick={resend} disabled={status === 'sending'} className="btn btn-soft" style={{ padding: '12px 24px', fontSize: 15 }}>
            {status === 'sending' ? 'Sending…' : 'Resend email'}
          </button>
        </div>
      </div>
    </div>
  );
}
