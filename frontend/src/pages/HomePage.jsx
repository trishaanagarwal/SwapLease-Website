import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';
import logo from '../assets/logo.png';

const typeLabels = { apartment: 'Apartment', house: 'House', studio: 'Studio', student_accom: 'Student Accom' };

function MiniCard({ listing }) {
  const image = listing.images?.[0] || `https://picsum.photos/seed/${listing.id}/600/400`;
  return (
    <Link to={`/listings/${listing.id}`} style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
      <div style={{ background: '#fff', borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', transition: 'box-shadow 0.2s' }}
        onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.14)'}
        onMouseLeave={e => e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.08)'}
      >
        <div style={{ position: 'relative', height: 180, overflow: 'hidden', background: '#e5e7eb' }}>
          <img src={image} alt={listing.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            onError={e => { e.target.src = `https://picsum.photos/seed/${listing.id}b/600/400`; }} />
          <div style={{ position: 'absolute', top: 10, left: 10, background: 'rgba(255,255,255,0.92)', borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 600, color: '#374151' }}>
            {typeLabels[listing.type] || listing.type}
          </div>
        </div>
        <div style={{ padding: '14px 16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#111', lineHeight: 1.3, flex: 1 }}>{listing.title}</div>
            <div style={{ whiteSpace: 'nowrap' }}>
              <span style={{ fontSize: 16, fontWeight: 800, color: '#111' }}>${listing.rent}</span>
              <span style={{ fontSize: 12, color: '#6b7280' }}>pw</span>
            </div>
          </div>
          <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>{listing.suburb}, {listing.city}</div>
          <div style={{ display: 'flex', gap: 12, marginTop: 8, fontSize: 12, color: '#6b7280' }}>
            <span>🛏 {listing.bedrooms} bed</span>
            <span>🚿 {listing.bathrooms} bath</span>
            {listing.furnished ? <span>✓ Furnished</span> : null}
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function HomePage() {
  const [search, setSearch] = useState('');
  const [listings, setListings] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/listings').then(res => setListings(res.data.slice(0, 6))).catch(() => {});
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    navigate(`/listings${search ? `?search=${encodeURIComponent(search)}` : ''}`);
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5' }}>

      {/* Hero */}
      <section style={{ background: '#FFF8E7', borderBottom: '1px solid #f0e9d2', padding: '60px 20px 70px' }}>
        <div style={{ maxWidth: 800, margin: '0 auto', textAlign: 'center' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 20, padding: '4px 14px', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 20 }}>
            <span>📍</span> Melbourne, Victoria
          </div>
          <h1 style={{ fontSize: 'clamp(36px, 6vw, 62px)', fontWeight: 900, color: '#111', lineHeight: 1.1, margin: '0 0 20px', letterSpacing: '-1.5px' }}>
            Transfer your lease.<br />Find your next home.
          </h1>
          <p style={{ fontSize: 17, color: '#555', margin: '0 0 32px', lineHeight: 1.6 }}>
            Melbourne's student lease exchange — peer-to-peer, no agents, no fees.
          </p>

          <form onSubmit={handleSearch} style={{ display: 'flex', gap: 8, maxWidth: 540, margin: '0 auto 24px', background: '#fff', borderRadius: 12, padding: 6, boxShadow: '0 2px 12px rgba(0,0,0,0.1)' }}>
            <input
              type="text"
              placeholder="Search by Melbourne suburb or university..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ flex: 1, border: 'none', outline: 'none', padding: '10px 14px', fontSize: 15, background: 'transparent', color: '#111' }}
            />
            <button type="submit" style={{ background: '#0ea5e9', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 24px', fontWeight: 700, fontSize: 15, cursor: 'pointer', whiteSpace: 'nowrap' }}>
              Search
            </button>
          </form>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/create-listing" style={{ background: '#111', color: '#fff', textDecoration: 'none', padding: '12px 28px', borderRadius: 10, fontWeight: 700, fontSize: 15 }}>
              List your lease
            </Link>
            <Link to="/listings" style={{ background: '#fff', color: '#111', textDecoration: 'none', padding: '12px 28px', borderRadius: 10, fontWeight: 700, fontSize: 15, border: '2px solid #e5e7eb' }}>
              Find a place
            </Link>
          </div>

          {/* Quick suburb links */}
          <div style={{ marginTop: 28, display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
            {['Carlton', 'Fitzroy', 'Southbank', 'Parkville', 'Brunswick', 'Clayton', 'Richmond', 'St Kilda'].map(s => (
              <button key={s} onClick={() => navigate(`/listings?search=${s}`)}
                style={{ background: 'transparent', border: '1px solid #d1d5db', borderRadius: 20, padding: '5px 14px', fontSize: 13, color: '#555', cursor: 'pointer' }}>
                {s}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Recently added */}
      <section style={{ maxWidth: 1200, margin: '0 auto', padding: '48px 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h2 style={{ fontSize: 24, fontWeight: 800, color: '#111', margin: 0 }}>Recently added</h2>
          <Link to="/listings" style={{ color: '#0ea5e9', textDecoration: 'none', fontSize: 14, fontWeight: 600 }}>
            Explore more →
          </Link>
        </div>

        {listings.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
            {listings.map(l => <MiniCard key={l.id} listing={l} />)}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#9ca3af' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🏠</div>
            <p style={{ fontSize: 16 }}>No listings yet — be the first to post!</p>
            <Link to="/create-listing" style={{ color: '#0ea5e9', textDecoration: 'none', fontWeight: 600 }}>List your lease →</Link>
          </div>
        )}
      </section>

      {/* How it works */}
      <section style={{ background: '#fff', borderTop: '1px solid #e5e7eb', padding: '60px 20px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontSize: 28, fontWeight: 800, color: '#111', marginBottom: 48 }}>How SwapLease works</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 40 }}>
            {[
              { icon: '📝', title: 'List your lease', desc: 'Post your property in minutes — add photos, rent, dates and nearby uni.' },
              { icon: '🔍', title: 'Browse & filter', desc: 'Search by suburb, price or property type to find your perfect student home.' },
              { icon: '💬', title: 'Message & swap', desc: 'Chat directly with listers, arrange inspections and transfer your lease.' },
            ].map((step, i) => (
              <div key={i} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 40, marginBottom: 16 }}>{step.icon}</div>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: '#111', marginBottom: 10 }}>{step.title}</h3>
                <p style={{ fontSize: 14, color: '#6b7280', lineHeight: 1.6 }}>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ background: '#1f2937', color: '#9ca3af', padding: '40px 20px', marginTop: 0 }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', flexWrap: 'wrap', gap: 32, justifyContent: 'space-between' }}>
          <div>
            <img src={logo} alt="SwapLease" style={{ height: 36, width: 'auto', marginBottom: 8, filter: 'brightness(0) invert(1)' }} />
            <p style={{ fontSize: 13, lineHeight: 1.6, maxWidth: 260 }}>
              Melbourne's student lease transfer platform. Peer-to-peer, free to use.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 48 }}>
            <div>
              <div style={{ color: '#fff', fontWeight: 600, fontSize: 13, marginBottom: 12 }}>Browse suburbs</div>
              {['Carlton', 'Fitzroy', 'Southbank', 'Parkville', 'Brunswick', 'Clayton', 'Richmond', 'St Kilda'].map(c => (
                <div key={c}><Link to={`/listings?search=${c}`} style={{ color: '#9ca3af', textDecoration: 'none', fontSize: 13, lineHeight: 2 }}>{c}</Link></div>
              ))}
            </div>
            <div>
              <div style={{ color: '#fff', fontWeight: 600, fontSize: 13, marginBottom: 12 }}>Platform</div>
              {[['Browse leases', '/listings'], ['List a lease', '/create-listing'], ['Sign up', '/signup'], ['Sign in', '/login']].map(([label, path]) => (
                <div key={path}><Link to={path} style={{ color: '#9ca3af', textDecoration: 'none', fontSize: 13, lineHeight: 2 }}>{label}</Link></div>
              ))}
            </div>
          </div>
        </div>
        <div style={{ maxWidth: 1200, margin: '28px auto 0', paddingTop: 20, borderTop: '1px solid #374151', fontSize: 12, color: '#6b7280' }}>
          © {new Date().getFullYear()} SwapLease. Made for students, by students.
        </div>
      </footer>
    </div>
  );
}
