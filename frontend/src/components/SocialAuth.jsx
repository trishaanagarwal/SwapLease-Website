import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

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

  const handle = async (provider) => {
    setError('');
    setBusy(provider);
    try {
      await socialLogin(provider);
      navigate('/');
    } catch (err) {
      if (err.code === 'auth/account-exists-with-different-credential') {
        setError('An account already exists with this email. Sign in with email and password instead.');
      } else if (err.code === 'auth/unauthorized-domain') {
        setError('This site is not authorised for Google sign-in yet.');
      } else {
        // Any other failure (commonly a popup blocked by Brave/Safari):
        // fall back to a full-page redirect, which browsers don't block.
        try {
          await socialLoginRedirect(provider);
          return; // page navigates away to Google
        } catch (e2) {
          setError(`Could not start Google sign-in (${e2.code || err.code || 'blocked'}). Try Chrome, or allow popups for this site.`);
        }
      }
    } finally {
      setBusy('');
    }
  };

  return (
    <div className="stack-4" style={{ marginTop: 'var(--s-5)' }}>
      <div className="or-rule"><span>or</span></div>
      {error && <p className="alert alert--error" role="alert">{error}</p>}
      <button type="button" onClick={() => handle('google')} disabled={!!busy} className="btn btn--secondary btn--block btn--plain">
        <GoogleIcon /> {busy === 'google' ? 'Connecting to Google' : `${label} with Google`}
      </button>
    </div>
  );
}
