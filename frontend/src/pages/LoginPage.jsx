import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import DOMPurify from 'dompurify';
import { sendEmailVerification, signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';
import { useAuth } from '../context/AuthContext';
import logo from '../assets/logo.png';
import { t } from '../theme';

const purify = (str) => DOMPurify.sanitize(str, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [needsVerification, setNeedsVerification] = useState(false);
  const [resendStatus, setResendStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

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
    <div style={{ minHeight: '100vh', background: t.cream, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ width: '100%', maxWidth: 410 }}>

        <div style={{ textAlign: 'center', marginBottom: 30 }}>
          <Link to="/" style={{ textDecoration: 'none', display: 'inline-block' }}>
            <img src={logo} alt="SwapLease" style={{ height: 50, width: 'auto' }} />
          </Link>
          <h1 className="font-display" style={{ fontSize: 30, fontWeight: 800, color: t.ink, margin: '22px 0 6px' }}>Welcome back 👋</h1>
          <p style={{ color: t.inkSoft, fontSize: 15.5, margin: 0 }}>Sign in to your account</p>
        </div>

        <div style={{ background: '#fff', borderRadius: t.radiusLg, border: `1px solid ${t.border}`, padding: 34, boxShadow: t.shadow }}>
          {error && (
            <div style={{ background: t.coralTint, border: `1px solid ${t.coral}`, color: t.coralDeep, borderRadius: 12, padding: '12px 15px', fontSize: 14, marginBottom: 20, fontWeight: 600 }}>
              {error}
              {needsVerification && (
                <div style={{ marginTop: 10 }}>
                  {resendStatus === 'sent' ? (
                    <span style={{ color: t.sage, fontWeight: 700 }}>✓ Verification email resent — check your inbox</span>
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
            <div style={{ marginBottom: 24 }}>
              <label style={lbl}>Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                placeholder="Your password" required style={inputStyle} />
            </div>

            <button type="submit" disabled={loading} className="btn btn-coral"
              style={{ width: '100%', padding: 14, fontSize: 16, opacity: loading ? 0.6 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}>
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: 24, paddingTop: 20, borderTop: `1px solid ${t.border}` }}>
            <span style={{ fontSize: 14, color: t.inkSoft }}>Don't have an account? </span>
            <Link to="/signup" style={{ fontSize: 14, fontWeight: 700, color: t.coralDeep, textDecoration: 'none' }}>Sign up free</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
