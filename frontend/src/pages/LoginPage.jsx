import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { sendEmailVerification, signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';
import { useAuth } from '../context/AuthContext';
import SocialAuth from '../components/SocialAuth';

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
      await login(email.trim().toLowerCase(), password);
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

  return (
    <div className="wrap page auth">
      <div className="auth__card">
        <header className="auth__head">
          <h1>Sign in to SwapLease</h1>
          <p className="muted">Message listers, save leases and post your own.</p>
        </header>

        {error && (
          <div className="alert alert--error" role="alert">
            {error}
            {needsVerification && (
              <div style={{ marginTop: 8 }}>
                {resendStatus === 'sent'
                  ? <span>Verification email sent. Check your inbox.</span>
                  : <button type="button" className="link" onClick={resendVerification} disabled={resendStatus === 'sending'}>{resendStatus === 'sending' ? 'Sending' : 'Send the verification email again'}</button>}
                {resendStatus === 'error' && <span> The email didn’t send. Try again in a minute.</span>}
              </div>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="form-grid">
          <div>
            <label className="label" htmlFor="email">Email</label>
            <input id="email" className="field" type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@student.unimelb.edu.au" required />
          </div>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <label className="label" htmlFor="password">Password</label>
              <button type="button" className="link t-small" onClick={handleForgotPassword}>Forgot password?</button>
            </div>
            <input id="password" className="field" type="password" autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} required />
          </div>
          {resetMsg && <p className="alert alert--ok" role="status">{resetMsg}</p>}
          <button type="submit" disabled={loading} className="btn btn--primary btn--block">{loading ? 'Signing in' : 'Sign in'}</button>
        </form>

        <SocialAuth label="Sign in" />

        <p className="auth__foot">New to SwapLease? <Link className="link" to="/signup">Create an account</Link></p>
      </div>
    </div>
  );
}
