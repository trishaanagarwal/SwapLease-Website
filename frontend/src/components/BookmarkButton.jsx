import { useNavigate } from 'react-router-dom';
import { Bookmark } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { t } from '../theme';

// Save toggle: a round button over a photograph, or a full secondary button (`variant="button"`).
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

  const icon = <Bookmark size={size} fill={saved ? t.coral : 'none'} color={saved ? t.coral : t.ink} strokeWidth={2} aria-hidden="true" />;

  if (variant === 'button') {
    return (
      <button type="button" className="btn btn--secondary" onClick={handle} aria-pressed={saved}>
        {icon}{saved ? 'Saved' : 'Save listing'}
      </button>
    );
  }
  return (
    <button type="button" className="icon-btn" onClick={handle} aria-pressed={saved} aria-label={saved ? 'Remove from saved' : 'Save listing'}>
      {icon}
    </button>
  );
}
