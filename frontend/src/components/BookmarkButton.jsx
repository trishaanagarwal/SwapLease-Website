import { useNavigate } from 'react-router-dom';
import { Bookmark } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { t } from '../theme';

// Floating save/bookmark toggle. `size` controls the icon; `variant` the chrome.
export default function BookmarkButton({ listingId, size = 18, variant = 'floating' }) {
  const { user, toggleBookmark } = useAuth();
  const navigate = useNavigate();
  const saved = !!user && (user.bookmarks || []).includes(listingId);

  const handle = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) { navigate('/login'); return; }
    toggleBookmark(listingId);
  };

  const base = {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 7,
    cursor: 'pointer', border: 'none', fontFamily: 'inherit', fontWeight: 700,
    transition: 'transform 0.12s ease, background 0.2s ease',
  };

  if (variant === 'button') {
    return (
      <button onClick={handle} aria-label={saved ? 'Remove bookmark' : 'Save listing'}
        style={{ ...base, padding: '11px 20px', borderRadius: t.pill, fontSize: 14.5,
          background: saved ? t.coralTint : '#fff', color: saved ? t.coralDeep : t.ink,
          border: `1.5px solid ${saved ? t.coral : t.borderStrong}` }}>
        <Bookmark size={size} fill={saved ? t.coral : 'none'} color={saved ? t.coral : t.ink} />
        {saved ? 'Saved' : 'Save'}
      </button>
    );
  }

  return (
    <button onClick={handle} aria-label={saved ? 'Remove bookmark' : 'Save listing'}
      style={{ ...base, width: 36, height: 36, borderRadius: '50%',
        background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(4px)',
        boxShadow: '0 2px 8px rgba(16,28,56,0.18)' }}>
      <Bookmark size={size} fill={saved ? t.coral : 'none'} color={saved ? t.coral : t.ink} strokeWidth={2.2} />
    </button>
  );
}
