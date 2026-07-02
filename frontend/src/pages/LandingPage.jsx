import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import ListingCard from '../components/ListingCard';
import logoMark from '../assets/logo-mark.png';
import { t } from '../theme';
import { Search, ShieldCheck, Users, Sparkles, MapPin, ArrowRight, Home, FileText, MessageCircle } from 'lucide-react';

const SUBURBS = ['Carlton', 'Fitzroy', 'Southbank', 'Parkville', 'Brunswick', 'Clayton', 'Richmond', 'St Kilda'];

export default function LandingPage() {
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
    <div style={{ minHeight: '100vh', background: t.cream, overflow: 'hidden' }}>

      {/* ===== HERO ===== */}
      <section style={{ borderBottom: `1px solid ${t.border}`, padding: 'clamp(40px, 6vw, 72px) 22px clamp(44px, 6vw, 72px)' }}>
        <div style={{ maxWidth: 760, margin: '0 auto' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, border: `1px solid ${t.border}`, borderRadius: t.radiusSm, padding: '6px 12px', fontSize: 12.5, fontWeight: 700, color: t.inkSoft, marginBottom: 24, letterSpacing: '0.01em' }}>
            <MapPin size={14} color={t.gold} /> Melbourne, Victoria · student-to-student
          </div>

          <h1 className="font-display" style={{ fontSize: 'clamp(34px, 7vw, 64px)', fontWeight: 600, color: t.ink, lineHeight: 1.08, margin: '0 0 20px', letterSpacing: '-0.02em' }}>
            Transfer your lease,<br />
            <span style={{ fontStyle: 'italic', color: t.navy }}>without the agent.</span>
          </h1>

          <p style={{ fontSize: 'clamp(16px, 2.4vw, 18.5px)', color: t.inkSoft, margin: '0 0 30px', lineHeight: 1.65, maxWidth: 560, fontWeight: 500 }}>
            The easiest way for Melbourne students to take over or pass on a lease. List your place in minutes, post what you're looking for, and message other students directly, no agents, no fees.
          </p>

          <form onSubmit={handleSearch} style={{ display: 'flex', gap: 8, maxWidth: 540, marginBottom: 18 }}>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, paddingLeft: 14, background: '#fff', border: `1.5px solid ${t.borderStrong}`, borderRadius: t.radius }}>
              <Search size={18} color={t.inkFaint} />
              <input type="text" placeholder="Search by suburb or university…" value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ flex: 1, border: 'none', outline: 'none', padding: '12px 4px', fontSize: 15.5, background: 'transparent', color: t.ink, fontFamily: 'inherit' }} />
            </div>
            <button type="submit" className="btn btn-coral" style={{ padding: '12px 26px', fontSize: 15.5 }}>Search</button>
          </form>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 32 }}>
            <Link to="/create-listing" className="btn btn-coral" style={{ padding: '12px 24px', fontSize: 15 }}>List your lease <ArrowRight size={16} /></Link>
            <Link to="/listings" className="btn btn-soft" style={{ padding: '12px 24px', fontSize: 15 }}>Browse leases</Link>
            <Link to="/roommates" className="btn btn-soft" style={{ padding: '12px 24px', fontSize: 15 }}>Browse requests</Link>
          </div>

          <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
            {[
              { icon: <ShieldCheck size={16} color={t.inkSoft} />, label: 'Email-verified members' },
              { icon: <Users size={16} color={t.inkSoft} />, label: 'Direct peer-to-peer' },
              { icon: <Sparkles size={16} color={t.inkSoft} />, label: '100% free to use' },
            ].map(item => (
              <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 13.5, fontWeight: 600, color: t.inkSoft }}>
                {item.icon} {item.label}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== Freshly listed ===== */}
      <section style={{ maxWidth: 1200, margin: '0 auto', padding: '14px 22px 56px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 28 }}>
          <div>
            <h2 className="font-display" style={{ fontSize: 'clamp(26px, 4vw, 32px)', fontWeight: 600, color: t.ink, margin: 0 }}>Recently added</h2>
            <p style={{ color: t.inkSoft, margin: '6px 0 0', fontSize: 15 }}>New leases from students around Melbourne</p>
          </div>
          <Link to="/listings" style={{ color: t.navy, textDecoration: 'none', fontSize: 15, fontWeight: 700, whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: 5 }}>Explore all <ArrowRight size={16} /></Link>
        </div>

        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 22 }}>
            {[...Array(3)].map((_, i) => (
              <div key={i} className="skeleton" style={{ borderRadius: t.radius, height: 320 }} />
            ))}
          </div>
        ) : listings.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 22 }}>
            {listings.map(l => <ListingCard key={l.id} listing={l} />)}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '64px 20px', background: '#fff', borderRadius: t.radiusLg, border: `1px solid ${t.border}`, boxShadow: t.shadowSm }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 14, color: t.inkFaint }}><Home size={42} /></div>
            <p style={{ fontSize: 17, color: t.inkSoft, marginBottom: 8, fontWeight: 600 }}>No listings yet, be the first to post!</p>
            <Link to="/create-listing" style={{ color: t.navy, textDecoration: 'none', fontWeight: 700 }}>List your lease →</Link>
          </div>
        )}
      </section>

      {/* ===== Roommate finder banner ===== */}
      <section style={{ maxWidth: 1200, margin: '0 auto', padding: '0 22px 56px' }}>
        <div style={{ background: '#fff', border: `1px solid ${t.border}`, borderRadius: t.radiusLg, padding: 'clamp(24px, 4vw, 36px)', display: 'flex', flexWrap: 'wrap', gap: 20, alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ maxWidth: 560 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <Users size={20} color={t.navy} />
              <h2 className="font-display" style={{ fontSize: 'clamp(22px, 4vw, 28px)', fontWeight: 600, color: t.ink, margin: 0 }}>Looking for a place or a roommate?</h2>
            </div>
            <p style={{ color: t.inkSoft, fontSize: 15, lineHeight: 1.6, margin: 0 }}>
              Post a short request with a few photos so people can see what you're after, then message each other directly. Great for finding a room, someone to share a place with, or someone to take over your lease.
            </p>
          </div>
          <Link to="/roommates" className="btn btn-coral" style={{ padding: '13px 26px', fontSize: 15 }}>Browse requests <ArrowRight size={16} /></Link>
        </div>
      </section>

      {/* ===== How it works ===== */}
      <section style={{ background: t.creamDeep, borderTop: `1px solid ${t.border}`, borderBottom: `1px solid ${t.border}`, padding: '64px 22px' }}>
        <div style={{ maxWidth: 1040, margin: '0 auto' }}>
          <div style={{ marginBottom: 40 }}>
            <span style={{ color: t.gold, fontSize: 12.5, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>How it works</span>
            <h2 className="font-display" style={{ fontSize: 'clamp(26px, 4vw, 34px)', fontWeight: 600, color: t.ink, margin: '10px 0 0' }}>Listed to leased in three steps</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20 }}>
            {[
              { n: '01', icon: FileText, title: 'List your lease', desc: 'Add your photos, rent, dates and nearby uni. It only takes a few minutes.' },
              { n: '02', icon: Search, title: 'Browse & filter', desc: 'Search by suburb, price or property type until you find a place that fits.' },
              { n: '03', icon: MessageCircle, title: 'Message & swap', desc: 'Chat directly, sort out an inspection, and take over the lease.' },
            ].map((step) => (
              <div key={step.n} style={{ background: '#fff', borderRadius: t.radiusLg, padding: '26px 24px', border: `1px solid ${t.border}` }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                  <step.icon size={22} color={t.navy} strokeWidth={1.6} />
                  <span style={{ fontSize: 13, fontWeight: 700, color: t.inkFaint, letterSpacing: '0.05em' }}>{step.n}</span>
                </div>
                <h3 className="font-display" style={{ fontSize: 19, fontWeight: 600, color: t.ink, marginBottom: 8 }}>{step.title}</h3>
                <p style={{ fontSize: 14, color: t.inkSoft, lineHeight: 1.6, margin: 0 }}>{step.desc}</p>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 36 }}>
            <Link to="/signup" className="btn btn-coral" style={{ padding: '13px 30px', fontSize: 15 }}>Get started for free <ArrowRight size={17} /></Link>
          </div>
        </div>
      </section>

      {/* ===== Footer ===== */}
      <footer style={{ background: t.ink, color: 'rgba(255,255,255,0.62)', padding: '56px 22px 36px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', flexWrap: 'wrap', gap: 44, justifyContent: 'space-between' }}>
          <div style={{ maxWidth: 300 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 11, marginBottom: 14 }}>
              <span style={{ display: 'inline-flex', background: '#fff', borderRadius: t.radiusSm, padding: 8 }}>
                <img src={logoMark} alt="" style={{ height: 26, width: 'auto' }} />
              </span>
              <span className="font-display" style={{ fontSize: 21, fontWeight: 700 }}>
                <span style={{ color: '#fff' }}>Swap</span><span style={{ color: t.gold }}>Lease</span>
              </span>
            </div>
            <p style={{ fontSize: 13.5, lineHeight: 1.7, margin: 0 }}>
              Melbourne's student lease transfer marketplace. Peer-to-peer, secure, and free to use.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 56, flexWrap: 'wrap' }}>
            <div>
              <div style={{ color: '#fff', fontWeight: 700, fontSize: 13.5, marginBottom: 14 }}>Browse suburbs</div>
              {SUBURBS.slice(0, 6).map(c => (
                <div key={c}><Link to={`/listings?search=${c}`} style={{ color: 'rgba(255,255,255,0.62)', textDecoration: 'none', fontSize: 13.5, lineHeight: 2.1 }}>{c}</Link></div>
              ))}
            </div>
            <div>
              <div style={{ color: '#fff', fontWeight: 700, fontSize: 13.5, marginBottom: 14 }}>Platform</div>
              {[['Browse leases', '/listings'], ['Requests', '/roommates'], ['List a lease', '/create-listing'], ['Sign up', '/signup'], ['Terms & Conditions', '/terms'], ['Privacy Policy', '/privacy']].map(([label, path]) => (
                <div key={path}><Link to={path} style={{ color: 'rgba(255,255,255,0.62)', textDecoration: 'none', fontSize: 13.5, lineHeight: 2.1 }}>{label}</Link></div>
              ))}
            </div>
          </div>
        </div>
        <div style={{ maxWidth: 1200, margin: '36px auto 0', paddingTop: 22, borderTop: '1px solid rgba(255,255,255,0.12)', fontSize: 12.5, color: 'rgba(255,255,255,0.4)' }}>
          © {new Date().getFullYear()} SwapLease. Made for students, by students.
        </div>
      </footer>
    </div>
  );
}
