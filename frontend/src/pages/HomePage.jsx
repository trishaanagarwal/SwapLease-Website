import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import ListingCard from '../components/ListingCard';
import logo from '../assets/logo.png';
import { t } from '../theme';
import { Search } from 'lucide-react';

const SUBURBS = ['Carlton', 'Fitzroy', 'Southbank', 'Parkville', 'Brunswick', 'Clayton', 'Richmond', 'St Kilda'];

export default function HomePage() {
  const [search, setSearch] = useState('');
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    getDocs(query(collection(db, 'listings'), where('status', '==', 'active'), orderBy('createdAt', 'desc'), limit(6)))
      .then(snap => setListings(snap.docs.map(d => ({ id: d.id, ...d.data() }))))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    navigate(`/listings${search ? `?search=${encodeURIComponent(search)}` : ''}`);
  };

  return (
    <div style={{ minHeight: '100vh', background: t.cream }}>

      {/* Hero */}
      <section style={{ position: 'relative', overflow: 'hidden', padding: '72px 22px 88px' }}>
        {/* warm gradient blobs */}
        <div className="blob floaty" style={{ width: 420, height: 420, background: t.coral, top: -120, right: -80 }} />
        <div className="blob floaty" style={{ width: 360, height: 360, background: t.honey, bottom: -140, left: -100, animationDelay: '2s' }} />

        <div style={{ maxWidth: 880, margin: '0 auto', textAlign: 'center', position: 'relative' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: '#fff', border: `1px solid ${t.border}`, borderRadius: t.pill, padding: '6px 16px', fontSize: 13.5, fontWeight: 700, color: t.inkSoft, marginBottom: 26, boxShadow: t.shadowSm }}>
            <span>📍</span> Melbourne, Victoria
          </div>

          <h1 className="font-display" style={{ fontSize: 'clamp(40px, 7vw, 76px)', fontWeight: 900, color: t.ink, lineHeight: 1.02, margin: '0 0 22px' }}>
            Find your next home<br />
            <span style={{ color: t.coral, fontStyle: 'italic' }}>without the agent.</span>
          </h1>

          <p style={{ fontSize: 18.5, color: t.inkSoft, margin: '0 auto 36px', lineHeight: 1.6, maxWidth: 560, fontWeight: 500 }}>
            Melbourne's cosy student lease exchange — swap leases peer-to-peer. No agents, no fees, no stress. 🌿
          </p>

          <form onSubmit={handleSearch} style={{ display: 'flex', gap: 8, maxWidth: 560, margin: '0 auto 22px', background: '#fff', borderRadius: t.pill, padding: 7, boxShadow: t.shadow, border: `1px solid ${t.border}` }}>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, paddingLeft: 16 }}>
              <Search size={19} color={t.inkFaint} />
              <input type="text" placeholder="Search by suburb or university…" value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ flex: 1, border: 'none', outline: 'none', padding: '12px 4px', fontSize: 15.5, background: 'transparent', color: t.ink, fontFamily: 'inherit' }} />
            </div>
            <button type="submit" className="btn btn-coral" style={{ padding: '12px 28px', fontSize: 15.5 }}>Search</button>
          </form>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 30 }}>
            <Link to="/create-listing" className="btn btn-ink" style={{ padding: '13px 30px', fontSize: 15.5 }}>List your lease</Link>
            <Link to="/listings" className="btn btn-soft" style={{ padding: '13px 30px', fontSize: 15.5 }}>Browse leases</Link>
          </div>

          <div style={{ display: 'flex', gap: 9, justifyContent: 'center', flexWrap: 'wrap' }}>
            {SUBURBS.map(s => (
              <button key={s} onClick={() => navigate(`/listings?search=${s}`)}
                style={{ background: 'rgba(255,255,255,0.7)', border: `1px solid ${t.border}`, borderRadius: t.pill, padding: '7px 16px', fontSize: 13.5, color: t.inkSoft, cursor: 'pointer', fontWeight: 600 }}>
                {s}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Recently added */}
      <section style={{ maxWidth: 1200, margin: '0 auto', padding: '20px 22px 56px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 26 }}>
          <div>
            <h2 className="font-display" style={{ fontSize: 32, fontWeight: 800, color: t.ink, margin: 0 }}>Freshly listed</h2>
            <p style={{ color: t.inkSoft, margin: '6px 0 0', fontSize: 15 }}>New leases from students around Melbourne</p>
          </div>
          <Link to="/listings" style={{ color: t.coralDeep, textDecoration: 'none', fontSize: 15, fontWeight: 700, whiteSpace: 'nowrap' }}>Explore all →</Link>
        </div>

        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 22 }}>
            {[...Array(3)].map((_, i) => (
              <div key={i} style={{ background: '#fff', borderRadius: t.radius, height: 320, border: `1px solid ${t.border}` }} />
            ))}
          </div>
        ) : listings.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 22 }}>
            {listings.map(l => <ListingCard key={l.id} listing={l} />)}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '64px 20px', background: '#fff', borderRadius: t.radiusLg, border: `1px solid ${t.border}` }}>
            <div style={{ fontSize: 46, marginBottom: 14 }}>🏠</div>
            <p style={{ fontSize: 17, color: t.inkSoft, marginBottom: 8, fontWeight: 600 }}>No listings yet — be the first to post!</p>
            <Link to="/create-listing" style={{ color: t.coralDeep, textDecoration: 'none', fontWeight: 700 }}>List your lease →</Link>
          </div>
        )}
      </section>

      {/* How it works */}
      <section style={{ background: t.creamDeep, padding: '72px 22px' }}>
        <div style={{ maxWidth: 980, margin: '0 auto', textAlign: 'center' }}>
          <h2 className="font-display" style={{ fontSize: 34, fontWeight: 800, color: t.ink, marginBottom: 8 }}>How SwapLease works</h2>
          <p style={{ color: t.inkSoft, fontSize: 16, marginBottom: 52 }}>Three friendly steps from listed to leased.</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 26 }}>
            {[
              { icon: '📝', tint: t.coralTint, title: 'List your lease', desc: 'Post your place in minutes — add photos, rent, dates and your nearby uni.' },
              { icon: '🔍', tint: t.honeyTint, title: 'Browse & filter', desc: 'Search by suburb, price or property type to find your perfect student home.' },
              { icon: '💬', tint: t.sageTint, title: 'Message & swap', desc: 'Chat directly with listers, arrange inspections and transfer your lease.' },
            ].map((step, i) => (
              <div key={i} style={{ background: '#fff', borderRadius: t.radiusLg, padding: '34px 26px', border: `1px solid ${t.border}`, boxShadow: t.shadowSm }}>
                <div style={{ width: 64, height: 64, borderRadius: 20, background: step.tint, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 30, margin: '0 auto 18px' }}>{step.icon}</div>
                <h3 className="font-display" style={{ fontSize: 21, fontWeight: 700, color: t.ink, marginBottom: 10 }}>{step.title}</h3>
                <p style={{ fontSize: 14.5, color: t.inkSoft, lineHeight: 1.6, margin: 0 }}>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ background: t.ink, color: '#C9BCAD', padding: '52px 22px 36px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', flexWrap: 'wrap', gap: 40, justifyContent: 'space-between' }}>
          <div style={{ maxWidth: 280 }}>
            <img src={logo} alt="SwapLease" style={{ height: 38, width: 'auto', marginBottom: 12, filter: 'brightness(0) invert(1)' }} />
            <p style={{ fontSize: 13.5, lineHeight: 1.7, margin: 0 }}>
              Melbourne's student lease transfer platform. Peer-to-peer, warm, and free to use. 🌿
            </p>
          </div>
          <div style={{ display: 'flex', gap: 56, flexWrap: 'wrap' }}>
            <div>
              <div style={{ color: '#fff', fontWeight: 700, fontSize: 13.5, marginBottom: 14 }}>Browse suburbs</div>
              {SUBURBS.map(c => (
                <div key={c}><Link to={`/listings?search=${c}`} style={{ color: '#C9BCAD', textDecoration: 'none', fontSize: 13.5, lineHeight: 2.1 }}>{c}</Link></div>
              ))}
            </div>
            <div>
              <div style={{ color: '#fff', fontWeight: 700, fontSize: 13.5, marginBottom: 14 }}>Platform</div>
              {[['Browse leases', '/listings'], ['List a lease', '/create-listing'], ['Sign up', '/signup'], ['Sign in', '/login'], ['Terms & Conditions', '/terms'], ['Privacy Policy', '/privacy']].map(([label, path]) => (
                <div key={path}><Link to={path} style={{ color: '#C9BCAD', textDecoration: 'none', fontSize: 13.5, lineHeight: 2.1 }}>{label}</Link></div>
              ))}
            </div>
          </div>
        </div>
        <div style={{ maxWidth: 1200, margin: '32px auto 0', paddingTop: 22, borderTop: '1px solid rgba(255,255,255,0.12)', fontSize: 12.5, color: '#9A8D7E' }}>
          © {new Date().getFullYear()} SwapLease. Made for students, by students.
        </div>
      </footer>
    </div>
  );
}
