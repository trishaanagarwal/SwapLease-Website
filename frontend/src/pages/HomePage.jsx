import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import ListingCard from '../components/ListingCard';
import logoMark from '../assets/logo-mark.png';
import { t } from '../theme';
import { Search, ShieldCheck, Users, Sparkles, MapPin, ArrowRight } from 'lucide-react';

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
    <div style={{ minHeight: '100vh', background: t.cream, overflow: 'hidden' }}>

      {/* ===== HERO ===== */}
      <section style={{ position: 'relative', padding: '64px 22px 90px' }}>
        {/* layered mesh gradient blobs for depth */}
        <div className="blob floaty" style={{ width: 460, height: 460, background: t.navy, top: -140, right: -60 }} />
        <div className="blob floaty-slow" style={{ width: 380, height: 380, background: t.green, bottom: -120, left: -120 }} />
        <div className="blob floaty" style={{ width: 300, height: 300, background: t.gold, top: 120, left: '42%', opacity: 0.28, animationDelay: '1.5s' }} />

        <div className="hero-grid" style={{ maxWidth: 1180, margin: '0 auto', position: 'relative', display: 'grid', gridTemplateColumns: 'minmax(0, 1.05fr) minmax(0, 0.95fr)', gap: 48, alignItems: 'center' }}>

          {/* Left: copy */}
          <div className="fade-up">
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.75)', backdropFilter: 'blur(8px)', border: `1px solid ${t.border}`, borderRadius: t.pill, padding: '7px 16px', fontSize: 13, fontWeight: 700, color: t.inkSoft, marginBottom: 26, boxShadow: t.shadowSm }}>
              <MapPin size={15} color={t.gold} /> Melbourne, Victoria · Student-to-student
            </div>

            <h1 className="font-display" style={{ fontSize: 'clamp(42px, 5.6vw, 72px)', fontWeight: 900, color: t.ink, lineHeight: 1.04, margin: '0 0 22px', letterSpacing: '-0.02em' }}>
              Transfer your lease,<br />
              <span className="grad-text">without the agent.</span>
            </h1>

            <p style={{ fontSize: 19, color: t.inkSoft, margin: '0 0 34px', lineHeight: 1.6, maxWidth: 500, fontWeight: 500 }}>
              Melbourne's trusted marketplace for student lease transfers. List in minutes, browse verified homes, and swap directly, no agents, no fees.
            </p>

            <form onSubmit={handleSearch} style={{ display: 'flex', gap: 8, maxWidth: 520, marginBottom: 22, background: '#fff', borderRadius: t.pill, padding: 7, boxShadow: t.shadow, border: `1px solid ${t.border}` }}>
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, paddingLeft: 16 }}>
                <Search size={19} color={t.inkFaint} />
                <input type="text" placeholder="Search by suburb or university…" value={search}
                  onChange={e => setSearch(e.target.value)}
                  style={{ flex: 1, border: 'none', outline: 'none', padding: '12px 4px', fontSize: 15.5, background: 'transparent', color: t.ink, fontFamily: 'inherit' }} />
              </div>
              <button type="submit" className="btn btn-coral" style={{ padding: '12px 28px', fontSize: 15.5 }}>Search</button>
            </form>

            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 34 }}>
              <Link to="/create-listing" className="btn btn-gold" style={{ padding: '13px 28px', fontSize: 15.5 }}>List your lease <ArrowRight size={17} /></Link>
              <Link to="/listings" className="btn btn-soft" style={{ padding: '13px 28px', fontSize: 15.5 }}>Browse leases</Link>
            </div>

            {/* trust row */}
            <div style={{ display: 'flex', gap: 26, flexWrap: 'wrap' }}>
              {[
                { icon: <ShieldCheck size={18} color={t.green} />, label: 'Email-verified members' },
                { icon: <Users size={18} color={t.navy} />, label: 'Direct peer-to-peer' },
                { icon: <Sparkles size={18} color={t.gold} />, label: '100% free to use' },
              ].map(item => (
                <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13.5, fontWeight: 600, color: t.inkSoft }}>
                  {item.icon} {item.label}
                </div>
              ))}
            </div>
          </div>

          {/* Right: 3D floating listing card */}
          <div className="fade-up" style={{ position: 'relative', perspective: 1400, minHeight: 420 }}>
            <div className="floaty-slow" style={{
              transform: 'rotateY(-14deg) rotateX(7deg) rotate(1deg)',
              transformStyle: 'preserve-3d',
              background: '#fff', borderRadius: 24, padding: 14, boxShadow: t.shadow3d,
              border: '1px solid rgba(255,255,255,0.8)', maxWidth: 360, margin: '0 auto',
            }}>
              <div style={{ borderRadius: 16, overflow: 'hidden', position: 'relative', height: 210, background: `linear-gradient(135deg, ${t.navy}, ${t.green})` }}>
                <img src="https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=800&q=80"
                  alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <div style={{ position: 'absolute', top: 12, left: 12, background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(6px)', borderRadius: t.pill, padding: '6px 13px', fontSize: 12.5, fontWeight: 800, color: t.green }}>
                  ✓ Available now
                </div>
              </div>
              <div style={{ padding: '16px 12px 10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <h3 className="font-display" style={{ fontSize: 19, fontWeight: 800, color: t.ink, margin: 0 }}>Sunny studio · Carlton</h3>
                </div>
                <p style={{ fontSize: 13.5, color: t.inkSoft, margin: '5px 0 14px' }}>5 min walk to Melbourne Uni</p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 22, fontWeight: 800, color: t.navy }}>$420<span style={{ fontSize: 13, color: t.inkFaint, fontWeight: 600 }}>/wk</span></span>
                  <span style={{ fontSize: 12.5, fontWeight: 700, color: t.green, background: t.sageTint, padding: '6px 12px', borderRadius: t.pill }}>Lease until Dec</span>
                </div>
              </div>
            </div>

            {/* small floating stat chip for depth */}
            <div className="floaty" style={{ position: 'absolute', bottom: 10, left: 0, background: '#fff', borderRadius: 16, padding: '12px 16px', boxShadow: t.shadowLg, border: `1px solid ${t.border}`, animationDelay: '1s' }}>
              <div style={{ fontSize: 12, color: t.inkFaint, fontWeight: 600 }}>Saved in agent fees</div>
              <div className="font-display" style={{ fontSize: 22, fontWeight: 800, color: t.green }}>$0 forever</div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== Freshly listed ===== */}
      <section style={{ maxWidth: 1200, margin: '0 auto', padding: '14px 22px 64px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 28 }}>
          <div>
            <h2 className="font-display" style={{ fontSize: 34, fontWeight: 800, color: t.ink, margin: 0 }}>Freshly listed</h2>
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
            <div style={{ fontSize: 46, marginBottom: 14 }}>🏠</div>
            <p style={{ fontSize: 17, color: t.inkSoft, marginBottom: 8, fontWeight: 600 }}>No listings yet, be the first to post!</p>
            <Link to="/create-listing" style={{ color: t.navy, textDecoration: 'none', fontWeight: 700 }}>List your lease →</Link>
          </div>
        )}
      </section>

      {/* ===== How it works ===== */}
      <section style={{ position: 'relative', background: t.ink, padding: '84px 22px', overflow: 'hidden' }}>
        <div className="blob" style={{ width: 420, height: 420, background: t.navy, top: -160, left: -80, opacity: 0.5 }} />
        <div className="blob" style={{ width: 360, height: 360, background: t.green, bottom: -140, right: -60, opacity: 0.5 }} />
        <div style={{ maxWidth: 1040, margin: '0 auto', position: 'relative' }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <span style={{ color: t.gold, fontSize: 13.5, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase' }}>How it works</span>
            <h2 className="font-display" style={{ fontSize: 38, fontWeight: 800, color: '#fff', margin: '12px 0 0' }}>Listed to leased in three steps</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 24 }}>
            {[
              { n: '01', icon: '📝', title: 'List your lease', desc: 'Post your place in minutes, photos, rent, dates and your nearby uni.', tint: t.navy },
              { n: '02', icon: '🔍', title: 'Browse & filter', desc: 'Search by suburb, price or property type to find your perfect home.', tint: t.green },
              { n: '03', icon: '💬', title: 'Message & swap', desc: 'Chat directly, arrange an inspection and transfer the lease.', tint: t.gold },
            ].map((step) => (
              <div key={step.n} className="lift" style={{ background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(10px)', borderRadius: t.radiusLg, padding: '32px 28px', border: '1px solid rgba(255,255,255,0.12)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
                  <div style={{ width: 58, height: 58, borderRadius: 16, background: step.tint, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, boxShadow: `0 12px 26px ${step.tint}66` }}>{step.icon}</div>
                  <span className="font-display" style={{ fontSize: 40, fontWeight: 900, color: 'rgba(255,255,255,0.12)' }}>{step.n}</span>
                </div>
                <h3 className="font-display" style={{ fontSize: 22, fontWeight: 700, color: '#fff', marginBottom: 10 }}>{step.title}</h3>
                <p style={{ fontSize: 14.5, color: 'rgba(255,255,255,0.6)', lineHeight: 1.65, margin: 0 }}>{step.desc}</p>
              </div>
            ))}
          </div>
          <div style={{ textAlign: 'center', marginTop: 48 }}>
            <Link to="/signup" className="btn btn-gold" style={{ padding: '15px 38px', fontSize: 16 }}>Get started, it's free <ArrowRight size={18} /></Link>
          </div>
        </div>
      </section>

      {/* ===== Popular suburbs ===== */}
      <section style={{ maxWidth: 1200, margin: '0 auto', padding: '72px 22px' }}>
        <h2 className="font-display" style={{ fontSize: 30, fontWeight: 800, color: t.ink, textAlign: 'center', marginBottom: 8 }}>Popular student suburbs</h2>
        <p style={{ color: t.inkSoft, textAlign: 'center', marginBottom: 36, fontSize: 15 }}>Browse where Melbourne students live</p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          {SUBURBS.map(s => (
            <button key={s} onClick={() => navigate(`/listings?search=${s}`)} className="lift"
              style={{ background: '#fff', border: `1px solid ${t.border}`, borderRadius: t.pill, padding: '11px 24px', fontSize: 15, color: t.ink, cursor: 'pointer', fontWeight: 700, boxShadow: t.shadowSm }}>
              {s}
            </button>
          ))}
        </div>
      </section>

      {/* ===== Footer ===== */}
      <footer style={{ background: t.ink, color: 'rgba(255,255,255,0.62)', padding: '56px 22px 36px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', flexWrap: 'wrap', gap: 44, justifyContent: 'space-between' }}>
          <div style={{ maxWidth: 300 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 11, marginBottom: 14 }}>
              <span style={{ display: 'inline-flex', background: '#fff', borderRadius: 12, padding: 8 }}>
                <img src={logoMark} alt="" style={{ height: 26, width: 'auto' }} />
              </span>
              <span className="font-display" style={{ fontSize: 21, fontWeight: 800 }}>
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
              {[['Browse leases', '/listings'], ['List a lease', '/create-listing'], ['Sign up', '/signup'], ['Sign in', '/login'], ['Terms & Conditions', '/terms'], ['Privacy Policy', '/privacy']].map(([label, path]) => (
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
