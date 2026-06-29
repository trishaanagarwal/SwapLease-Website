import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { Bookmark } from 'lucide-react';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import ListingCard from '../components/ListingCard';
import { t } from '../theme';

export default function SavedPage() {
  const { user } = useAuth();
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);

  const ids = (user?.bookmarks || []).join(',');

  useEffect(() => {
    if (!user) return;
    const bookmarkIds = user.bookmarks || [];
    if (bookmarkIds.length === 0) { setListings([]); setLoading(false); return; }
    setLoading(true);
    Promise.all(bookmarkIds.map(id => getDoc(doc(db, 'listings', id))))
      .then(snaps => setListings(
        snaps.filter(s => s.exists()).map(s => ({ id: s.id, ...s.data() }))
      ))
      .catch(() => {})
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ids]);

  return (
    <div style={{ minHeight: '100vh', background: t.cream }}>
      <div style={{ position: 'relative', overflow: 'hidden', background: t.ink, padding: '46px 22px 34px' }}>
        <div className="blob" style={{ width: 340, height: 340, background: t.navy, top: -150, left: -60, opacity: 0.55 }} />
        <div className="blob" style={{ width: 300, height: 300, background: t.green, top: -120, right: -80, opacity: 0.5 }} />
        <div style={{ maxWidth: 1200, margin: '0 auto', position: 'relative', display: 'flex', alignItems: 'center', gap: 12 }}>
          <Bookmark size={26} color={t.gold} fill={t.gold} />
          <div>
            <h1 className="font-display" style={{ fontSize: 'clamp(26px, 4vw, 36px)', fontWeight: 800, color: '#fff', margin: 0 }}>Saved listings</h1>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 15, margin: '4px 0 0' }}>Listings you've bookmarked for later</p>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 22px 64px' }}>
        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 22 }}>
            {[...Array(3)].map((_, i) => <div key={i} style={{ height: 320, background: '#fff', borderRadius: t.radius, border: `1px solid ${t.border}` }} />)}
          </div>
        ) : listings.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 22 }}>
            {listings.map(l => <ListingCard key={l.id} listing={l} />)}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '72px 20px', background: '#fff', borderRadius: t.radiusLg, border: `1px solid ${t.border}`, boxShadow: t.shadowSm }}>
            <div style={{ width: 64, height: 64, background: t.coralTint, borderRadius: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px' }}>
              <Bookmark size={28} color={t.navy} />
            </div>
            <h3 className="font-display" style={{ fontSize: 21, fontWeight: 700, color: t.ink, marginBottom: 8 }}>No saved listings yet</h3>
            <p style={{ color: t.inkSoft, fontSize: 14.5, marginBottom: 18 }}>Tap the bookmark icon on any listing to save it here.</p>
            <Link to="/listings" className="btn btn-coral" style={{ padding: '11px 26px', fontSize: 14.5 }}>Browse listings</Link>
          </div>
        )}
      </div>
    </div>
  );
}
