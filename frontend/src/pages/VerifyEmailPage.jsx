import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import axios from 'axios';

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('verifying'); // 'verifying' | 'success' | 'error'
  const [message, setMessage] = useState('');

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) {
      setStatus('error');
      setMessage('No verification token found in the URL.');
      return;
    }
    axios.get(`http://localhost:5001/api/auth/verify-email?token=${encodeURIComponent(token)}`)
      .then(res => {
        setStatus('success');
        setMessage(res.data.message);
      })
      .catch(err => {
        setStatus('error');
        setMessage(err.response?.data?.error || 'Verification failed.');
      });
  }, []);

  const icon = { verifying: '⏳', success: '✅', error: '❌' }[status];
  const color = { verifying: '#6b7280', success: '#059669', error: '#dc2626' }[status];

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ width: '100%', maxWidth: 420, background: '#fff', borderRadius: 14, border: '1px solid #e5e7eb', padding: 40, textAlign: 'center', boxShadow: '0 1px 8px rgba(0,0,0,0.06)' }}>
        <div style={{ fontSize: 52, marginBottom: 20 }}>{icon}</div>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: '#111', margin: '0 0 12px' }}>
          {status === 'verifying' ? 'Verifying your email...' : status === 'success' ? 'Email verified!' : 'Verification failed'}
        </h2>
        <p style={{ color, fontSize: 15, lineHeight: 1.6, margin: '0 0 28px' }}>{message}</p>
        {status === 'success' && (
          <Link to="/login" style={{ background: '#0ea5e9', color: '#fff', textDecoration: 'none', padding: '12px 32px', borderRadius: 10, fontWeight: 700, fontSize: 15 }}>
            Sign in now
          </Link>
        )}
        {status === 'error' && (
          <Link to="/signup" style={{ color: '#0ea5e9', textDecoration: 'none', fontWeight: 700, fontSize: 15 }}>
            Back to sign up
          </Link>
        )}
      </div>
    </div>
  );
}
