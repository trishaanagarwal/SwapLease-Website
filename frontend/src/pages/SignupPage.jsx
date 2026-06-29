import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import DOMPurify from 'dompurify';
import { useAuth } from '../context/AuthContext';
import { UNIVERSITIES } from '../constants';
import logo from '../assets/logo.png';
import { t } from '../theme';

const purify = (str) => DOMPurify.sanitize(str, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });

function validate(form) {
  const errors = {};
  const name = purify(form.name.trim());
  if (name.length < 2) errors.name = 'Name must be at least 2 characters';
  if (!/^[\p{L}\s'\-\.]+$/u.test(name)) errors.name = 'Name may only contain letters and spaces';
  if (!form.email.includes('@')) errors.email = 'Enter a valid email address';
  if (form.email.toLowerCase() !== form.confirmEmail.toLowerCase()) errors.confirmEmail = 'Email addresses do not match';
  if (form.password.length < 8) errors.password = 'Password must be at least 8 characters';
  if (!/[A-Z]/.test(form.password)) errors.password = 'Password must contain an uppercase letter';
  if (!/[0-9]/.test(form.password)) errors.password = 'Password must contain a number';
  return errors;
}

export default function SignupPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', confirmEmail: '', password: '', university: '' });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const set = (k, v) => {
    setForm(f => ({ ...f, [k]: v }));
    if (errors[k]) setErrors(e => ({ ...e, [k]: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');
    const validationErrors = validate(form);
    if (Object.keys(validationErrors).length > 0) { setErrors(validationErrors); return; }
    setLoading(true);
    try {
      await register(purify(form.name.trim()), form.email.trim().toLowerCase(), form.password, form.university || '');
      setSuccess(true);
    } catch (err) {
      if (err.code === 'auth/email-already-in-use') setServerError('An account with this email already exists.');
      else if (err.code === 'auth/weak-password') setServerError('Password is too weak. Use at least 8 characters with uppercase and numbers.');
      else setServerError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const lbl = { fontSize: 14, fontWeight: 700, color: t.ink };
  const errStyle = { fontSize: 12.5, color: t.coralDeep, marginTop: 5, fontWeight: 600 };
  const fieldStyle = (hasError) => ({
    width: '100%', fontFamily: 'inherit', fontSize: 15, color: t.ink, marginTop: 7,
    background: hasError ? t.coralTint : '#fff', border: `1.5px solid ${hasError ? t.coral : t.borderStrong}`,
    borderRadius: 14, padding: '12px 16px', outline: 'none', boxSizing: 'border-box',
  });

  if (success) return (
    <div style={{ minHeight: '100vh', background: t.cream, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ width: '100%', maxWidth: 440, background: '#fff', borderRadius: t.radiusLg, border: `1px solid ${t.border}`, padding: 44, textAlign: 'center', boxShadow: t.shadow }}>
        <div style={{ fontSize: 56, marginBottom: 20 }}>📬</div>
        <h2 className="font-display" style={{ fontSize: 26, fontWeight: 800, color: t.ink, margin: '0 0 12px' }}>Check your email</h2>
        <p style={{ color: t.inkSoft, fontSize: 15, lineHeight: 1.65, margin: '0 0 8px' }}>
          We sent a verification link to <strong style={{ color: t.ink }}>{form.email}</strong>.
        </p>
        <p style={{ color: t.inkFaint, fontSize: 13, lineHeight: 1.6, margin: '0 0 26px' }}>
          Click it to activate your account, then come back to sign in. Check your spam folder if you don't see it.
        </p>
        <button onClick={() => navigate('/login')} className="btn btn-coral" style={{ padding: '13px 36px', fontSize: 15.5 }}>
          Go to login
        </button>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: t.cream, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ width: '100%', maxWidth: 460 }}>

        <div style={{ textAlign: 'center', marginBottom: 30 }}>
          <Link to="/" style={{ textDecoration: 'none', display: 'inline-block' }}>
            <img src={logo} alt="SwapLease" style={{ height: 50, width: 'auto' }} />
          </Link>
          <h1 className="font-display" style={{ fontSize: 30, fontWeight: 800, color: t.ink, margin: '22px 0 6px' }}>Create your account</h1>
          <p style={{ color: t.inkSoft, fontSize: 15.5, margin: 0 }}>Join Melbourne students transferring leases 🌿</p>
        </div>

        <div style={{ background: '#fff', borderRadius: t.radiusLg, border: `1px solid ${t.border}`, padding: 34, boxShadow: t.shadow }}>
          {serverError && (
            <div style={{ background: t.coralTint, border: `1px solid ${t.coral}`, color: t.coralDeep, borderRadius: 12, padding: '11px 15px', fontSize: 14, marginBottom: 20, fontWeight: 600 }}>
              {serverError}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 16 }}>
              <label style={lbl}>Full name</label>
              <input value={form.name} onChange={e => set('name', e.target.value)} placeholder="Jane Smith" required style={fieldStyle(!!errors.name)} />
              {errors.name && <div style={errStyle}>{errors.name}</div>}
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={lbl}>Email address</label>
              <input type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="jane@example.com" required style={fieldStyle(!!errors.email)} />
              {errors.email && <div style={errStyle}>{errors.email}</div>}
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={lbl}>
                Confirm email address
                <span style={{ fontWeight: 400, color: t.inkFaint, fontSize: 12, marginLeft: 6 }}>must match above</span>
              </label>
              <input type="email" value={form.confirmEmail} onChange={e => set('confirmEmail', e.target.value)}
                placeholder="jane@example.com" required style={fieldStyle(!!errors.confirmEmail)}
                onPaste={e => e.preventDefault()} />
              {errors.confirmEmail && <div style={errStyle}>{errors.confirmEmail}</div>}
              {!errors.confirmEmail && form.confirmEmail && form.email && form.email.toLowerCase() === form.confirmEmail.toLowerCase() && (
                <div style={{ fontSize: 12.5, color: t.sage, marginTop: 5, fontWeight: 600 }}>✓ Emails match</div>
              )}
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={lbl}>Password</label>
              <input type="password" value={form.password} onChange={e => set('password', e.target.value)}
                placeholder="Min 8 chars, 1 uppercase, 1 number" required style={fieldStyle(!!errors.password)} />
              {errors.password && <div style={errStyle}>{errors.password}</div>}
              {form.password.length > 0 && (
                <div style={{ marginTop: 8, display: 'flex', gap: 6 }}>
                  {[
                    { label: '8+ chars', ok: form.password.length >= 8 },
                    { label: 'Uppercase', ok: /[A-Z]/.test(form.password) },
                    { label: 'Number', ok: /[0-9]/.test(form.password) },
                  ].map(({ label, ok }) => (
                    <span key={label} style={{ fontSize: 11.5, padding: '3px 10px', borderRadius: 999, background: ok ? t.sageTint : '#F1EADF', color: ok ? t.sage : t.inkFaint, fontWeight: 700 }}>
                      {ok ? '✓' : '○'} {label}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div style={{ marginBottom: 26 }}>
              <label style={lbl}>University <span style={{ color: t.inkFaint, fontWeight: 400 }}>(optional)</span></label>
              <select value={form.university} onChange={e => set('university', e.target.value)}
                style={{ ...fieldStyle(false), cursor: 'pointer', appearance: 'auto' }}>
                <option value="">Select your university...</option>
                {UNIVERSITIES.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>

            <button type="submit" disabled={loading} className="btn btn-coral"
              style={{ width: '100%', padding: 14, fontSize: 16, opacity: loading ? 0.6 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}>
              {loading ? 'Creating account…' : 'Create account'}
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: 24, paddingTop: 20, borderTop: `1px solid ${t.border}` }}>
            <span style={{ fontSize: 14, color: t.inkSoft }}>Already have an account? </span>
            <Link to="/login" style={{ fontSize: 14, fontWeight: 700, color: t.coralDeep, textDecoration: 'none' }}>Sign in</Link>
          </div>
        </div>

        <p style={{ fontSize: 12, color: t.inkFaint, textAlign: 'center', marginTop: 16 }}>
          By signing up you agree to our{' '}
          <Link to="/terms" style={{ color: t.coralDeep, fontWeight: 700, textDecoration: 'none' }}>Terms &amp; Conditions</Link>
          {' '}and{' '}
          <Link to="/privacy" style={{ color: t.coralDeep, fontWeight: 700, textDecoration: 'none' }}>Privacy Policy</Link>.
        </p>
      </div>
    </div>
  );
}
