import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import { Search } from 'lucide-react';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import SeekerCard from '../components/SeekerCard';
import { useMessageSeeker } from '../hooks/useMessageSeeker';

export default function SeekersPage() {
  const { user } = useAuth();
  const { messageSeeker: message, busy } = useMessageSeeker();
  const [seekers, setSeekers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [maxBudget, setMaxBudget] = useState(0);

  useEffect(() => {
    getDocs(query(collection(db, 'seekers'), orderBy('updatedAt', 'desc')))
      .then(snap => setSeekers(snap.docs.map(d => ({ id: d.id, ...d.data() }))))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const myPost = user && seekers.find(s => s.userId === user.id);

  const filtered = seekers.filter(s => {
    if (maxBudget > 0 && s.budget && s.budget > maxBudget) return false;
    if (search) {
      const q = search.toLowerCase();
      const hay = [s.userName, s.onBehalfOf, s.about, s.areas, s.unis, s.moveIn].filter(Boolean).join(' ').toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  return (
    <div className="wrap page">
      <header className="page-head">
        <div>
          <h1>Requests from students who need a room</h1>
          <p>Each request has the suburb, the budget and the move-in date. Message anyone directly.</p>
        </div>
        <Link to="/roommates/edit" className="btn btn--primary">{myPost ? 'Edit your request' : 'Post a request'}</Link>
      </header>

      <div className="search-row" style={{ maxWidth: 'none', marginBottom: 'var(--s-6)' }}>
        <label className="field-icon" style={{ flex: 1 }}>
          <Search size={18} aria-hidden="true" />
          <input className="field" type="search" aria-label="Search requests" value={search} onChange={e => setSearch(e.target.value)} placeholder="Name, suburb or uni" />
        </label>
        <select className="field" aria-label="Budget" style={{ maxWidth: 220 }} value={maxBudget} onChange={e => setMaxBudget(Number(e.target.value))}>
          <option value={0}>Any budget</option>
          <option value={250}>Up to $250/wk</option>
          <option value={350}>Up to $350/wk</option>
          <option value={500}>Up to $500/wk</option>
        </select>
      </div>
      <p className="t-small muted" style={{ marginBottom: 'var(--s-4)' }} aria-live="polite">
        {loading ? 'Loading requests' : `${filtered.length} ${filtered.length === 1 ? 'request' : 'requests'}`}
      </p>

      {loading ? (
        <div className="cards">{[...Array(3)].map((_, i) => <div key={i} className="skeleton" style={{ height: 420 }} />)}</div>
      ) : filtered.length > 0 ? (
        <div className="cards">{filtered.map(s => <SeekerCard key={s.id} s={s} user={user} busy={busy} onMessage={message} />)}</div>
      ) : (
        <div className="empty">
          <h3>{seekers.length > 0 ? 'No requests match' : 'No requests yet'}</h3>
          <p>{seekers.length > 0 ? 'Try a wider budget or another search.' : 'Post what you need and students leaving a place can message you first.'}</p>
          {seekers.length === 0 && <Link to="/roommates/edit" className="btn btn--primary">Post a request</Link>}
        </div>
      )}
    </div>
  );
}
