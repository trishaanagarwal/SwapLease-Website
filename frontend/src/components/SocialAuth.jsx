import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { t } from '../theme';

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
    <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8a12 12 0 1 1 7.9-21l5.7-5.7A20 20 0 1 0 24 44c11 0 20-8 20-20 0-1.3-.1-2.3-.4-3.5z"/>
    <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8A12 12 0 0 1 24 12c3 0 5.8 1.1 7.9 3l5.7-5.7A20 20 0 0 0 6.3 14.7z"/>
    <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2A12 12 0 0 1 12.7 28l-6.6 5.1A20 20 0 0 0 24 44z"/>
    <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3a12 12 0 0 1-4.1 5.6l6.2 5.2C39.9 35.6 44 30.4 44 24c0-1.3-.1-2.3-.4-3.5z"/>
  </svg>
);

export default function SocialAuth({ label = 'Continue' }) {
  const { socialLogin, socialLoginRedirect } = useAuth();
  const navigate = useNavigate();
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');

  // Errors that mean the popup couldn't run (blocked by the browser) — retry via redirect.
  const POPUP_FALLBACK = new Set([
    'auth/popup-blocked',
    'auth/cancelled-popup-request',
    'auth/popup-closed-by-user',
    'auth/web-storage-unsupported',
    'auth/operation-not-supported-in-this-environment',
    'auth/internal-error',
  ]);

  const handle = async (provider) => {
    setError('');
    setBusy(provider);
    try {
      await socialLogin(provider);
      navigate('/');
    } catch (err) {
      if (err.code === 'auth/account-exists-with-different-credential') {
        setError('An account already exists with this email. Try signing in with email and password instead.');
      } else if (err.code === 'auth/unauthorized-domain') {
        setError('This site is not authorised for Google sign-in yet. Please contact support.');
      } else if (POPUP_FALLBACK.has(err.code)) {
        // Popup was blocked (common in Brave/Safari) — switch to full-page redirect.
        try {
          await socialLoginRedirect(provider);
          return; // page will navigate away to Google
        } catch {
          setError('Your browser blocked the sign-in window. Please allow popups or try another browser.');
        }
      } else {
        setError(`Could not sign in (${err.code || 'unknown error'}). Please try again.`);
      }
    } finally {
      setBusy('');
    }
  };

  const btn = {
    width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
    padding: '12px 16px', borderRadius: 14, fontSize: 14.5, fontWeight: 700, cursor: 'pointer',
    fontFamily: 'inherit', marginBottom: 10, transition: 'opacity 0.15s ease',
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '20px 0' }}>
        <div style={{ flex: 1, height: 1, background: t.border }} />
        <span style={{ fontSize: 12.5, color: t.inkFaint, fontWeight: 600 }}>or</span>
        <div style={{ flex: 1, height: 1, background: t.border }} />
      </div>

      {error && (
        <div style={{ background: t.coralTint, border: `1px solid ${t.coral}`, color: t.coralDeep, borderRadius: 12, padding: '10px 14px', fontSize: 13.5, marginBottom: 12, fontWeight: 600 }}>
          {error}
        </div>
      )}

      <button onClick={() => handle('google')} disabled={!!busy}
        style={{ ...btn, background: '#fff', color: t.ink, border: `1.5px solid ${t.borderStrong}`, opacity: busy === 'google' ? 0.6 : 1 }}>
        <GoogleIcon /> {busy === 'google' ? 'Connecting…' : `${label} with Google`}
      </button>
    </div>
  );
}
