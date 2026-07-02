import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import ListingCard from '../components/ListingCard';
import { t } from '../theme';
import { PlusCircle, Search, Users, MessageCircle, ArrowRight, Home } from 'lucide-react';

export default function HomePage() {
  const { user } = useAuth();
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDocs(query(collection(db, 'listings'), where('status', '==', 'active'), orderBy('createdAt', 'desc'), limit(6)))
      .then(snap => setListings(snap.docs.map(d => ({ id: d.id, ...d.data() }))))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const actions = [
    { to: '/create-listing', icon: PlusCircle, title: 'List your lease', desc: 'Post your place for someone to take over.' },
    { to: '/listings', icon: Search, title: 'Browse leases', desc: 'Find a place around Melbourne.' },
    { to: '/roommates', icon: Users, title: 'Post a request', desc: "Say what you're after, a place, room or roommate." },
    { to: '/messages', icon: MessageCircle, title: 'Messages', desc: 'Continue your conversations.' },
  ];

  const firstName = user?.name?.split(' ')[0] || 'there';

  return (
    <div style={{ minHeight: '100vh', background: t.cream }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 22px 64px' }}>

        <h1 className="font-display" style={{ fontSize: 'clamp(26px, 4vw, 34px)', fontWeight: 600, color: t.ink, margin: '0 0 4px' }}>
          Welcome back, {firstName}
        </h1>
        <p style={{ color: t.inkSoft, fontSize: 15, margin: '0 0 28px' }}>What would you like to do today?</p>

        {/* Quick actions */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 48 }}>
          {actions.map(a => (
            <Link key={a.to} to={a.to} className="lift" style={{ textDecoration: 'none', background: '#fff', border: `1px solid ${t.border}`, borderRadius: t.radiusLg, padding: '22px 22px' }}>
              <a.icon size={22} color={t.navy} strokeWidth={1.7} />
              <div className="font-display" style={{ fontSize: 18, fontWeight: 600, color: t.ink, margin: '14px 0 6px' }}>{a.title}</div>
              <div style={{ fontSize: 13.5, color: t.inkSoft, lineHeight: 1.5 }}>{a.desc}</div>
            </Link>
          ))}
        </div>

        {/* Freshly listed */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 20 }}>
          <h2 className="font-display" style={{ fontSize: 'clamp(22px, 4vw, 28px)', fontWeight: 600, color: t.ink, margin: 0 }}>Recently added</h2>
          <Link to="/listings" style={{ color: t.navy, textDecoration: 'none', fontSize: 15, fontWeight: 700, whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: 5 }}>Explore more <ArrowRight size={16} /></Link>
        </div>

        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 22 }}>
            {[...Array(3)].map((_, i) => <div key={i} className="skeleton" style={{ borderRadius: t.radius, height: 320 }} />)}
          </div>
        ) : listings.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 22 }}>
            {listings.map(l => <ListingCard key={l.id} listing={l} />)}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '56px 20px', background: '#fff', borderRadius: t.radiusLg, border: `1px solid ${t.border}` }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 14, color: t.inkFaint }}><Home size={40} /></div>
            <p style={{ fontSize: 16, color: t.inkSoft, marginBottom: 8, fontWeight: 600 }}>No listings yet, be the first to post!</p>
            <Link to="/create-listing" style={{ color: t.navy, textDecoration: 'none', fontWeight: 700 }}>List your lease →</Link>
          </div>
        )}
      </div>
    </div>
  );
}
