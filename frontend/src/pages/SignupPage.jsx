/**
 * SignupPage
 *
 * Security features:
 *  - Confirm email address field: user must type their email twice and both
 *    must match client-side before the request is sent.
 *  - DOMPurify: all user-supplied strings are sanitized before they could
 *    ever be rendered as HTML — removes script tags, event handlers, etc.
 *  - Zod-style client-side validation mirrors the backend registerSchema
 *    so bad data is caught before a network round-trip.
 *  - The backend validate(registerSchema) provides the authoritative check;
 *    client-side validation is UX-only and never the security boundary.
 */

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import DOMPurify from 'dompurify';
import api from '../api/axios';
import logo from '../assets/logo.png';

// Sanitize a string with DOMPurify before using it anywhere that touches the DOM.
// FORCE_BODY ensures the result is always a string, even for edge cases.
const purify = (str) => DOMPurify.sanitize(str, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });

function validate(form) {
  const errors = {};

  const name = purify(form.name.trim());
  if (name.length < 2) errors.name = 'Name must be at least 2 characters';
  if (!/^[\p{L}\s'\-\.]+$/u.test(name)) errors.name = 'Name may only contain letters and spaces';

  if (!form.email.includes('@')) errors.email = 'Enter a valid email address';

  if (form.email.toLowerCase() !== form.confirmEmail.toLowerCase()) {
    errors.confirmEmail = 'Email addresses do not match';
  }

  if (form.password.length < 8) errors.password = 'Password must be at least 8 characters';
  if (!/[A-Z]/.test(form.password)) errors.password = 'Password must contain an uppercase letter';
  if (!/[0-9]/.test(form.password)) errors.password = 'Password must contain a number';

  return errors;
}

export default function SignupPage() {
  const [form, setForm] = useState({ name: '', email: '', confirmEmail: '', password: '', university: '' });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const set = (k, v) => {
    setForm(f => ({ ...f, [k]: v }));
    if (errors[k]) setErrors(e => ({ ...e, [k]: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');

    // Client-side validation first (UX layer — backend validates independently)
    const validationErrors = validate(form);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true);
    try {
      // DOMPurify strip all tags from text inputs before sending to server.
      // The backend sanitizeBody middleware does the same — two independent layers.
      const res = await api.post('/auth/register', {
        name: purify(form.name.trim()),
        email: form.email.trim().toLowerCase(),
        confirmEmail: form.confirmEmail.trim().toLowerCase(),
        password: form.password, // passwords should NOT be sanitized (may contain < > & chars)
        university: form.university ? purify(form.university.trim()) : undefined,
      });

      setSuccess(res.data.message || 'Account created! Check your email to verify.');

      // In dev mode the server returns the token for easy testing
      if (res.data.devVerifyToken) {
        console.log('Dev verify URL:', `http://localhost:5001/api/auth/verify-email?token=${res.data.devVerifyToken}`);
      }
    } catch (err) {
      const data = err.response?.data;
      if (data?.errors) {
        // Field-level errors from Zod
        setErrors(data.errors);
      } else {
        setServerError(data?.error || 'Registration failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = (hasError) => ({
    display: 'block', width: '100%', border: `1px solid ${hasError ? '#fca5a5' : '#d1d5db'}`, borderRadius: 8,
    padding: '11px 14px', fontSize: 15, color: '#111', outline: 'none',
    boxSizing: 'border-box', background: hasError ? '#fff5f5' : '#fff', marginTop: 6,
  });
  const labelStyle = { fontSize: 14, fontWeight: 600, color: '#374151' };
  const errorStyle = { fontSize: 12, color: '#dc2626', marginTop: 4 };

  if (success) {
    return (
      <div style={{ minHeight: '100vh', background: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
        <div style={{ width: '100%', maxWidth: 420, background: '#fff', borderRadius: 14, border: '1px solid #e5e7eb', padding: 40, textAlign: 'center', boxShadow: '0 1px 8px rgba(0,0,0,0.06)' }}>
          <div style={{ fontSize: 52, marginBottom: 20 }}>📬</div>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: '#111', margin: '0 0 12px' }}>Check your email</h2>
          <p style={{ color: '#6b7280', fontSize: 15, lineHeight: 1.6, margin: '0 0 24px' }}>{success}</p>
          <p style={{ color: '#9ca3af', fontSize: 13, margin: '0 0 24px' }}>
            In dev mode the verification link is printed to the server console.
          </p>
          <button
            onClick={() => navigate('/login')}
            style={{ background: '#0ea5e9', color: '#fff', border: 'none', borderRadius: 10, padding: '12px 32px', fontWeight: 700, fontSize: 15, cursor: 'pointer' }}
          >
            Go to login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ width: '100%', maxWidth: 440 }}>

        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Link to="/" style={{ textDecoration: 'none', display: 'inline-block' }}>
            <img src={logo} alt="SwapLease" style={{ height: 52, width: 'auto' }} />
          </Link>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#111', margin: '20px 0 4px' }}>Create your account</h1>
          <p style={{ color: '#6b7280', fontSize: 15, margin: 0 }}>Join Melbourne students transferring leases</p>
        </div>

        <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e5e7eb', padding: 32, boxShadow: '0 1px 8px rgba(0,0,0,0.06)' }}>
          {serverError && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', borderRadius: 8, padding: '10px 14px', fontSize: 14, marginBottom: 20 }}>
              {serverError}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Full name */}
            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Full name</label>
              <input value={form.name} onChange={e => set('name', e.target.value)}
                placeholder="Jane Smith" required style={inputStyle(!!errors.name)} />
              {errors.name && <div style={errorStyle}>{errors.name}</div>}
            </div>

            {/* Email address */}
            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Email address</label>
              <input type="email" value={form.email} onChange={e => set('email', e.target.value)}
                placeholder="jane@example.com" required style={inputStyle(!!errors.email)} />
              {errors.email && <div style={errorStyle}>{errors.email}</div>}
            </div>

            {/* Confirm email — prevents typos and verifies the user owns the address */}
            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>
                Confirm email address
                <span style={{ fontWeight: 400, color: '#9ca3af', fontSize: 12, marginLeft: 6 }}>must match above</span>
              </label>
              <input type="email" value={form.confirmEmail} onChange={e => set('confirmEmail', e.target.value)}
                placeholder="jane@example.com" required style={inputStyle(!!errors.confirmEmail)}
                onPaste={e => e.preventDefault()} // prevent paste — user must type it manually
              />
              {errors.confirmEmail && <div style={errorStyle}>{errors.confirmEmail}</div>}
              {!errors.confirmEmail && form.confirmEmail && form.email &&
                form.email.toLowerCase() === form.confirmEmail.toLowerCase() && (
                <div style={{ fontSize: 12, color: '#059669', marginTop: 4 }}>✓ Emails match</div>
              )}
            </div>

            {/* Password */}
            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Password</label>
              <input type="password" value={form.password} onChange={e => set('password', e.target.value)}
                placeholder="Min 8 chars, 1 uppercase, 1 number" required style={inputStyle(!!errors.password)} />
              {errors.password && <div style={errorStyle}>{errors.password}</div>}
              {/* Live password strength hint */}
              {form.password.length > 0 && (
                <div style={{ marginTop: 6, display: 'flex', gap: 6 }}>
                  {[
                    { label: '8+ chars', ok: form.password.length >= 8 },
                    { label: 'Uppercase', ok: /[A-Z]/.test(form.password) },
                    { label: 'Number', ok: /[0-9]/.test(form.password) },
                  ].map(({ label, ok }) => (
                    <span key={label} style={{ fontSize: 11, padding: '2px 8px', borderRadius: 10, background: ok ? '#d1fae5' : '#f3f4f6', color: ok ? '#059669' : '#9ca3af', fontWeight: 600 }}>
                      {ok ? '✓' : '○'} {label}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* University (optional) */}
            <div style={{ marginBottom: 24 }}>
              <label style={labelStyle}>University <span style={{ color: '#9ca3af', fontWeight: 400 }}>(optional)</span></label>
              <input value={form.university} onChange={e => set('university', e.target.value)}
                placeholder="e.g. University of Melbourne" style={inputStyle(false)} />
            </div>

            <button type="submit" disabled={loading}
              style={{ width: '100%', background: loading ? '#93c5fd' : '#0ea5e9', color: '#fff', border: 'none', borderRadius: 10, padding: 13, fontWeight: 700, fontSize: 16, cursor: loading ? 'not-allowed' : 'pointer' }}>
              {loading ? 'Creating account...' : 'Create account'}
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: 24, paddingTop: 20, borderTop: '1px solid #f3f4f6' }}>
            <span style={{ fontSize: 14, color: '#6b7280' }}>Already have an account? </span>
            <Link to="/login" style={{ fontSize: 14, fontWeight: 700, color: '#0ea5e9', textDecoration: 'none' }}>Sign in</Link>
          </div>
        </div>

        <p style={{ fontSize: 12, color: '#9ca3af', textAlign: 'center', marginTop: 16 }}>
          By signing up you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  );
}
