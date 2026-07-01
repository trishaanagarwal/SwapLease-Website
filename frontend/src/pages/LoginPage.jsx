import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import DOMPurify from 'dompurify';
import { sendEmailVerification, signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';
import { useAuth } from '../context/AuthContext';
import SocialAuth from '../components/SocialAuth';
import logoMark from '../assets/logo-mark.png';
import { t } from '../theme';

const purify = (str) => DOMPurify.sanitize(str, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [needsVerification, setNeedsVerification] = useState(false);
  const [resendStatus, setResendStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetMsg, setResetMsg] = useState('');
  const { login, resetPassword } = useAuth();
  const navigate = useNavigate();

  const handleForgotPassword = async () => {
    setError(''); setResetMsg('');
    const addr = email.trim().toLowerCase();
    if (!addr.includes('@')) { setError('Enter your email address above first, then click "Forgot password".'); return; }
    try {
      await resetPassword(addr);
      setResetMsg(`If an account exists for ${addr}, a password-reset link has been sent. Check your inbox (and spam).`);
    } catch {
      // Don't reveal whether the email exists, show the same neutral message.
      setResetMsg(`If an account exists for ${addr}, a password-reset link has been sent. Check your inbox (and spam).`);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setNeedsVerification(false);
    setLoading(true);
    try {
      await login(purify(email.trim().toLowerCase()), password);
      navigate('/');
    } catch (err) {
      if (err.needsVerification) {
        setNeedsVerification(true);
        setError('Please verify your email address before logging in.');
      } else if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found') {
        setError('Invalid email or password.');
      } else {
        setError(err.message || 'Sign in failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const resendVerification = async () => {
    setResendStatus('sending');
    try {
      const cred = await signInWithEmailAndPassword(auth, email.trim().toLowerCase(), password);
      await sendEmailVerification(cred.user);
      await auth.signOut();
      setResendStatus('sent');
    } catch {
      setResendStatus('error');
    }
  };

  const inputStyle = {
    display: 'block', width: '100%', border: `1.5px solid ${t.borderStrong}`, borderRadius: 14,
    padding: '12px 16px', fontSize: 15, color: t.ink, outline: 'none',
    boxSizing: 'border-box', background: '#fff', marginTop: 7, fontFamily: 'inherit',
  };
  const lbl = { fontSize: 14, fontWeight: 700, color: t.ink };

  return (
    <div style={{ minHeight: '100vh', background: t.cream, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, position: 'relative', overflow: 'hidden' }}>
      <div className="blob floaty" style={{ width: 380, height: 380, background: t.navy, top: -140, left: -100 }} />
      <div className="blob floaty-slow" style={{ width: 340, height: 340, background: t.green, bottom: -130, right: -90 }} />

      <div className="fade-up" style={{ width: '100%', maxWidth: 410, position: 'relative' }}>

        <div style={{ textAlign: 'center', marginBottom: 30 }}>
          <Link to="/" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 10 }}>
            <img src={logoMark} alt="" style={{ height: 38, width: 'auto' }} />
            <span className="font-display" style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.02em' }}>
              <span style={{ color: t.navy }}>Swap</span><span style={{ color: t.green }}>Lease</span>
            </span>
          </Link>
          <h1 className="font-display" style={{ fontSize: 32, fontWeight: 800, margin: '24px 0 6px' }}><span className="grad-text">Welcome back</span></h1>
          <p style={{ color: t.inkSoft, fontSize: 15.5, margin: 0 }}>Sign in to your account</p>
        </div>

        <div className="glass" style={{ borderRadius: t.radiusLg, padding: 34, boxShadow: t.shadowLg }}>
          {error && (
            <div style={{ background: t.coralTint, border: `1px solid ${t.coral}`, color: t.coralDeep, borderRadius: 12, padding: '12px 15px', fontSize: 14, marginBottom: 20, fontWeight: 600 }}>
              {error}
              {needsVerification && (
                <div style={{ marginTop: 10 }}>
                  {resendStatus === 'sent' ? (
                    <span style={{ color: t.sage, fontWeight: 700 }}>✓ Verification email resent, check your inbox</span>
                  ) : (
                    <button onClick={resendVerification} disabled={resendStatus === 'sending'}
                      style={{ background: 'none', border: 'none', color: t.coralDeep, fontWeight: 700, textDecoration: 'underline', cursor: 'pointer', padding: 0, fontSize: 14 }}>
                      {resendStatus === 'sending' ? 'Resending...' : 'Resend verification email'}
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 18 }}>
              <label style={lbl}>Email address</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com" required style={inputStyle} />
            </div>
            <div style={{ marginBottom: 10 }}>
              <label style={lbl}>Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                placeholder="Your password" required style={inputStyle} />
            </div>

            <div style={{ textAlign: 'right', marginBottom: 20 }}>
              <button type="button" onClick={handleForgotPassword}
                style={{ background: 'none', border: 'none', color: t.coralDeep, fontSize: 13, fontWeight: 700, cursor: 'pointer', padding: 0 }}>
                Forgot password?
              </button>
            </div>

            {resetMsg && (
              <div style={{ background: t.sageTint, border: `1px solid ${t.sage}`, color: t.sage, borderRadius: 12, padding: '11px 14px', fontSize: 13.5, marginBottom: 18, fontWeight: 600, lineHeight: 1.5 }}>
                {resetMsg}
              </div>
            )}

            <button type="submit" disabled={loading} className="btn btn-coral"
              style={{ width: '100%', padding: 14, fontSize: 16, opacity: loading ? 0.6 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}>
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <SocialAuth label="Sign in" />

          <div style={{ textAlign: 'center', marginTop: 24, paddingTop: 20, borderTop: `1px solid ${t.border}` }}>
            <span style={{ fontSize: 14, color: t.inkSoft }}>Don't have an account? </span>
            <Link to="/signup" style={{ fontSize: 14, fontWeight: 700, color: t.coralDeep, textDecoration: 'none' }}>Sign up free</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
