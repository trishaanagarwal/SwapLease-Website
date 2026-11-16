import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import ListingCard from '../components/ListingCard';

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
    <div className="wrap page">
      <header className="page-head">
        <div>
          <h1>Saved leases</h1>
          <p>Leases you saved to come back to.</p>
        </div>
      </header>
      {loading ? (
        <div className="cards">{[...Array(3)].map((_, i) => <div key={i} className="skeleton" style={{ height: 380 }} />)}</div>
      ) : listings.length > 0 ? (
        <div className="cards">{listings.map(l => <ListingCard key={l.id} listing={l} />)}</div>
      ) : (
        <div className="empty">
          <h3>No saved leases yet</h3>
          <p>Tap the bookmark on any lease to keep it here.</p>
          <Link to="/listings" className="btn btn--primary">Browse leases</Link>
        </div>
      )}
    </div>
  );
}
