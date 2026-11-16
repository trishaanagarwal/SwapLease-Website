import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UNIVERSITIES } from '../constants';
import { MailCheck, Check } from 'lucide-react';
import SocialAuth from '../components/SocialAuth';

function validate(form) {
  const errors = {};
  const name = form.name.trim();
  if (name.length < 2) errors.name = 'Name must be at least 2 characters';
  if (!/^[\p{L}\s'.-]+$/u.test(name)) errors.name = 'Name may only contain letters and spaces';
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
  const [agreed, setAgreed] = useState(false);
  const [agreeError, setAgreeError] = useState(false);

  const set = (k, v) => {
    setForm(f => ({ ...f, [k]: v }));
    if (errors[k]) setErrors(e => ({ ...e, [k]: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');
    const validationErrors = validate(form);
    if (Object.keys(validationErrors).length > 0) { setErrors(validationErrors); return; }
    if (!agreed) { setAgreeError(true); return; }
    setLoading(true);
    try {
      await register(form.name.trim(), form.email.trim().toLowerCase(), form.password, form.university || '');
      setSuccess(true);
    } catch (err) {
      if (err.code === 'auth/email-already-in-use') setServerError('An account with this email already exists.');
      else if (err.code === 'auth/weak-password') setServerError('Password is too weak. Use at least 8 characters with uppercase and numbers.');
      else setServerError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const err = (k) => errors[k] && <p className="field-err" id={`${k}-err`}>{errors[k]}</p>;
  const bad = (k) => ({ 'aria-invalid': !!errors[k] || undefined, 'aria-describedby': errors[k] ? `${k}-err` : undefined });

  if (success) return (
    <div className="wrap page auth">
      <div className="auth__card stack-4">
        <span className="action-card__icon" style={{ margin: 0 }}><MailCheck size={22} aria-hidden="true" /></span>
        <h1 style={{ fontSize: 'var(--t-h3)' }}>Check your email</h1>
        <p className="muted">We sent a verification link to <b style={{ color: 'var(--ink)', fontWeight: 500 }}>{form.email}</b>. You can browse now. Verify before you list a lease or message anyone.</p>
        <p className="alert alert--note">If the email isn’t in your inbox, check the spam folder.</p>
        <button type="button" onClick={() => navigate('/')} className="btn btn--primary">Browse leases</button>
      </div>
    </div>
  );

  const checks = [
    { label: '8+ characters', ok: form.password.length >= 8 },
    { label: 'An uppercase letter', ok: /[A-Z]/.test(form.password) },
    { label: 'A number', ok: /[0-9]/.test(form.password) },
  ];

  return (
    <div className="wrap page auth">
      <div className="auth__card">
        <header className="auth__head">
          <h1>Create your SwapLease account</h1>
          <p className="muted">For Melbourne students passing on or taking over a lease.</p>
        </header>

        {serverError && <p className="alert alert--error" role="alert">{serverError}</p>}

        <form onSubmit={handleSubmit} className="form-grid" noValidate>
          <div>
            <label className="label" htmlFor="name">Full name</label>
            <input id="name" className="field" autoComplete="name" value={form.name} onChange={e => set('name', e.target.value)} required {...bad('name')} />
            {err('name')}
          </div>
          <div>
            <label className="label" htmlFor="email">Email</label>
            <input id="email" className="field" type="email" autoComplete="email" value={form.email} onChange={e => set('email', e.target.value)} required {...bad('email')} />
            {err('email')}
          </div>
          <div>
            <label className="label" htmlFor="confirmEmail">Confirm email</label>
            <input id="confirmEmail" className="field" type="email" value={form.confirmEmail} onChange={e => set('confirmEmail', e.target.value)} onPaste={e => e.preventDefault()} required {...bad('confirmEmail')} />
            {err('confirmEmail')}
            {!errors.confirmEmail && form.confirmEmail && form.email && form.email.toLowerCase() === form.confirmEmail.toLowerCase() && <p className="hint" style={{ color: 'var(--action)' }}>The emails match.</p>}
          </div>
          <div>
            <label className="label" htmlFor="password">Password</label>
            <input id="password" className="field" type="password" autoComplete="new-password" value={form.password} onChange={e => set('password', e.target.value)} required {...bad('password')} />
            {err('password')}
            <div className="chips" style={{ marginTop: 'var(--s-2)' }}>
              {checks.map(c => <span key={c.label} className={`pill ${c.ok ? 'pill--accent' : 'pill--quiet'}`}>{c.ok && <Check aria-hidden="true" />}{c.label}</span>)}
            </div>
          </div>
          <div>
            <label className="label" htmlFor="university">University <span className="muted" style={{ fontWeight: 400 }}>(optional)</span></label>
            <select id="university" className="field" value={form.university} onChange={e => set('university', e.target.value)}>
              <option value="">Choose your university</option>
              {UNIVERSITIES.map(u => <option key={u} value={u}>{u}</option>)}
            </select>
          </div>
          <label className="check" style={{ alignItems: 'flex-start' }}>
            <input type="checkbox" checked={agreed} style={{ marginTop: 3 }} onChange={e => { setAgreed(e.target.checked); if (e.target.checked) setAgreeError(false); }} />
            <span className="t-small">I agree to the <Link className="link" to="/terms" target="_blank">Terms</Link> and the <Link className="link" to="/privacy" target="_blank">Privacy Policy</Link>.</span>
          </label>
          {agreeError && <p className="field-err">Tick the box to accept the Terms and the Privacy Policy.</p>}
          <button type="submit" disabled={loading} className="btn btn--primary btn--block">{loading ? 'Creating your account' : 'Create account'}</button>
        </form>

        <SocialAuth label="Sign up" />
        <p className="t-small muted" style={{ marginTop: 'var(--s-3)' }}>Signing up with Google means you agree to the <Link className="link" to="/terms" target="_blank">Terms</Link> and the <Link className="link" to="/privacy" target="_blank">Privacy Policy</Link>.</p>

        <p className="auth__foot">Already have an account? <Link className="link" to="/login">Sign in</Link></p>
      </div>
    </div>
  );
}
