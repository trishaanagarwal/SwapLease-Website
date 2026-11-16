import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import ListingCard from '../components/ListingCard';
import SeekerCard from '../components/SeekerCard';
import { useMessageSeeker } from '../hooks/useMessageSeeker';
import { PlusCircle, Search, Users, MessageCircle } from 'lucide-react';

export default function HomePage() {
  const { user } = useAuth();
  const { messageSeeker, busy } = useMessageSeeker();
  const [listings, setListings] = useState([]);
  const [seekers, setSeekers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [seekersLoading, setSeekersLoading] = useState(true);

  useEffect(() => {
    getDocs(query(collection(db, 'listings'), where('status', '==', 'active'), orderBy('createdAt', 'desc'), limit(6)))
      .then(snap => setListings(snap.docs.map(d => ({ id: d.id, ...d.data() }))))
      .catch(() => {})
      .finally(() => setLoading(false));
    getDocs(query(collection(db, 'seekers'), orderBy('updatedAt', 'desc'), limit(3)))
      .then(snap => setSeekers(snap.docs.map(d => ({ id: d.id, ...d.data() }))))
      .catch(() => {})
      .finally(() => setSeekersLoading(false));
  }, []);

  const actions = [
    { to: '/create-listing', icon: PlusCircle, title: 'List your lease', desc: 'Hand your place to another student.' },
    { to: '/listings', icon: Search, title: 'Browse leases', desc: 'Places across Melbourne, by suburb.' },
    { to: '/roommates/edit', icon: Users, title: 'Post a request', desc: 'Say what you need: a place, a room or a roommate.' },
    { to: '/messages', icon: MessageCircle, title: 'Messages', desc: 'Pick up your conversations.' },
  ];

  const firstName = user?.name?.split(' ')[0] || 'there';

  return (
    <div className="wrap page">
      <header className="page-head">
        <div>
          <h1>Welcome back, {firstName}</h1>
          <p>New leases and requests from students, newest first.</p>
        </div>
      </header>

      <div className="grid">
        {actions.map(a => (
          <Link key={a.to} to={a.to} className="lcard action-card span-3">
            <span className="action-card__icon"><a.icon size={20} aria-hidden="true" /></span>
            <span className="lcard__title">{a.title}</span>
            <span className="muted t-small">{a.desc}</span>
          </Link>
        ))}
      </div>

      <div className="head-row">
        <h2>New leases</h2>
        <Link to="/listings" className="link">Browse leases</Link>
      </div>
      {loading ? (
        <div className="cards">{[...Array(3)].map((_, i) => <div key={i} className="skeleton" style={{ height: 380 }} />)}</div>
      ) : listings.length > 0 ? (
        <div className="cards">{listings.map(l => <ListingCard key={l.id} listing={l} />)}</div>
      ) : (
        <div className="empty">
          <h3>No leases listed yet</h3>
          <p>Early listings carry a permanent Founding lister badge.</p>
          <Link to="/create-listing" className="btn btn--primary">List your lease</Link>
        </div>
      )}

      <div className="head-row">
        <h2>New requests</h2>
        <Link to="/roommates" className="link">Browse requests</Link>
      </div>
      {seekersLoading ? (
        <div className="cards">{[...Array(3)].map((_, i) => <div key={i} className="skeleton" style={{ height: 420 }} />)}</div>
      ) : seekers.length > 0 ? (
        <div className="cards">{seekers.map(s => <SeekerCard key={s.id} s={s} user={user} busy={busy} onMessage={messageSeeker} />)}</div>
      ) : (
        <div className="empty">
          <h3>No requests yet</h3>
          <p>Post what you need and students leaving a place can message you first.</p>
          <Link to="/roommates/edit" className="btn btn--primary">Post a request</Link>
        </div>
      )}
    </div>
  );
}
