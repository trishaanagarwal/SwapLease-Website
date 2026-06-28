/**
 * LoginPage
 * DOMPurify sanitizes the email input before sending (strips any injected markup).
 * The server's loginSchema provides the authoritative validation.
 */

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import DOMPurify from 'dompurify';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import logo from '../assets/logo.png';

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
      const data = err.response?.data;
      if (data?.needsVerification) {
        setNeedsVerification(true);
        setError('Please verify your email address before logging in.');
      } else {
        setError(data?.error || 'Invalid email or password.');
      }
    } finally {
      setLoading(false);
    }
  };

  const resendVerification = async () => {
    setResendStatus('sending');
    try {
      await api.post('/auth/resend-verification', { email: purify(email.trim().toLowerCase()) });
      setResendStatus('sent');
    } catch {
      setResendStatus('error');
    }
  };

  const inputStyle = {
    display: 'block', width: '100%', border: '1px solid #d1d5db', borderRadius: 8,
    padding: '11px 14px', fontSize: 15, color: '#111', outline: 'none',
    boxSizing: 'border-box', background: '#fff', marginTop: 6,
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ width: '100%', maxWidth: 400 }}>

        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Link to="/" style={{ textDecoration: 'none', display: 'inline-block' }}>
            <img src={logo} alt="SwapLease" style={{ height: 52, width: 'auto' }} />
          </Link>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#111', margin: '20px 0 4px' }}>Welcome back</h1>
          <p style={{ color: '#6b7280', fontSize: 15, margin: 0 }}>Sign in to your account</p>
        </div>

        <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e5e7eb', padding: 32, boxShadow: '0 1px 8px rgba(0,0,0,0.06)' }}>
          {error && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', borderRadius: 8, padding: '12px 14px', fontSize: 14, marginBottom: 20 }}>
              {error}
              {needsVerification && (
                <div style={{ marginTop: 10 }}>
                  {resendStatus === 'sent' ? (
                    <span style={{ color: '#059669', fontWeight: 600 }}>✓ Verification email resent — check the server console</span>
                  ) : (
                    <button
                      onClick={resendVerification}
                      disabled={resendStatus === 'sending'}
                      style={{ background: 'none', border: 'none', color: '#dc2626', fontWeight: 700, textDecoration: 'underline', cursor: 'pointer', padding: 0, fontSize: 14 }}
                    >
                      {resendStatus === 'sending' ? 'Resending...' : 'Resend verification email'}
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 18 }}>
              <label style={{ fontSize: 14, fontWeight: 600, color: '#374151' }}>Email address</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com" required style={inputStyle}
                onFocus={e => e.target.style.borderColor = '#0ea5e9'}
                onBlur={e => e.target.style.borderColor = '#d1d5db'} />
            </div>
            <div style={{ marginBottom: 24 }}>
              <label style={{ fontSize: 14, fontWeight: 600, color: '#374151' }}>Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                placeholder="Your password" required style={inputStyle}
                onFocus={e => e.target.style.borderColor = '#0ea5e9'}
                onBlur={e => e.target.style.borderColor = '#d1d5db'} />
            </div>

            <button type="submit" disabled={loading}
              style={{ width: '100%', background: loading ? '#93c5fd' : '#0ea5e9', color: '#fff', border: 'none', borderRadius: 10, padding: 13, fontWeight: 700, fontSize: 16, cursor: loading ? 'not-allowed' : 'pointer' }}>
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: 24, paddingTop: 20, borderTop: '1px solid #f3f4f6' }}>
            <span style={{ fontSize: 14, color: '#6b7280' }}>Don't have an account? </span>
            <Link to="/signup" style={{ fontSize: 14, fontWeight: 700, color: '#0ea5e9', textDecoration: 'none' }}>Sign up free</Link>
          </div>

          <div style={{ marginTop: 20, background: '#f8fafc', borderRadius: 8, padding: '10px 14px', textAlign: 'center' }}>
            <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 4 }}>Demo account</div>
            <div style={{ fontSize: 13, color: '#374151', fontWeight: 600 }}>sarah@example.com / password123</div>
          </div>
        </div>
      </div>
    </div>
  );
}
