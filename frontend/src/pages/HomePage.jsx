import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { collection, query, where, orderBy, limit, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import ListingCard from '../components/ListingCard';
import { t } from '../theme';
import { PlusCircle, Search, Users, MessageCircle, ArrowRight, Home, MapPin, BadgeCheck, CalendarDays, ImageOff } from 'lucide-react';

function SeekerPhoto({ src }) {
  if (src) return <img src={src} alt="" style={{ width: '100%', height: 160, objectFit: 'cover' }} />;
  return (
    <div style={{ width: '100%', height: 160, background: t.creamDeep, display: 'flex', alignItems: 'center', justifyContent: 'center', color: t.inkFaint }}>
      <ImageOff size={24} />
    </div>
  );
}

export default function HomePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [listings, setListings] = useState([]);
  const [seekers, setSeekers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [seekersLoading, setSeekersLoading] = useState(true);
  const [busy, setBusy] = useState('');

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

  // Same find-or-create flow as SeekersPage so conversations share one schema.
  const messageSeeker = async (seeker) => {
    if (!user) return navigate('/login');
    if (!user.emailVerified) return navigate('/messages');
    if (seeker.userId === user.id) return navigate('/roommates/edit');
    setBusy(seeker.userId);
    try {
      const key = `roommate:${seeker.userId}`;
      const snap = await getDocs(query(collection(db, 'conversations'),
        where('listingId', '==', key), where('participants', 'array-contains', user.id)));
      let convId;
      if (!snap.empty) convId = snap.docs[0].id;
      else {
        const ref = await addDoc(collection(db, 'conversations'), {
          listingId: key,
          listingTitle: `${seeker.userName} · request`,
          participants: [user.id, seeker.userId],
          user1Id: user.id, user2Id: seeker.userId,
          user1Name: user.name, user2Name: seeker.userName,
          lastMessage: '', lastMessageAt: serverTimestamp(), createdAt: serverTimestamp(),
        });
        convId = ref.id;
      }
      navigate(`/messages?conv=${convId}`);
    } catch {
      setBusy('');
    }
  };

  const actions = [
    { to: '/create-listing', icon: PlusCircle, title: 'List your lease', desc: 'Post your place for someone to take over.', color: t.navy, tint: t.coralTint },
    { to: '/listings', icon: Search, title: 'Browse leases', desc: 'Find a place around Melbourne.', color: t.green, tint: t.sageTint },
    { to: '/roommates', icon: Users, title: 'Post a request', desc: "Say what you're after, a place, room or roommate.", color: t.plum, tint: t.plumTint },
    { to: '/messages', icon: MessageCircle, title: 'Messages', desc: 'Continue your conversations.', color: t.gold, tint: t.honeyTint },
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
              <div style={{ width: 44, height: 44, borderRadius: 12, background: a.tint, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <a.icon size={22} color={a.color} strokeWidth={2} />
              </div>
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
            <p style={{ fontSize: 16, color: t.ink, marginBottom: 6, fontWeight: 700 }}>Be the first to list, and get seen by everyone who joins</p>
            <p style={{ fontSize: 14, color: t.inkSoft, marginBottom: 14 }}>Early listings carry a permanent gold Founding lister badge.</p>
            <Link to="/create-listing" className="btn btn-coral" style={{ padding: '11px 22px', fontSize: 14.5 }}>List your lease →</Link>
          </div>
        )}

        {/* Recent requests */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', margin: '52px 0 20px' }}>
          <h2 className="font-display" style={{ fontSize: 'clamp(22px, 4vw, 28px)', fontWeight: 600, color: t.ink, margin: 0 }}>Recent requests</h2>
          <Link to="/roommates" style={{ color: t.navy, textDecoration: 'none', fontSize: 15, fontWeight: 700, whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: 5 }}>See all <ArrowRight size={16} /></Link>
        </div>

        {seekersLoading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 22 }}>
            {[...Array(3)].map((_, i) => <div key={i} className="skeleton" style={{ borderRadius: t.radius, height: 300 }} />)}
          </div>
        ) : seekers.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 22 }}>
            {seekers.map(s => (
              <div key={s.id} style={{ background: '#fff', border: `1px solid ${t.border}`, borderRadius: t.radiusLg, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                <SeekerPhoto src={s.images?.[0]} />
                <div style={{ padding: '14px 16px 16px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10, flexWrap: 'wrap' }}>
                    <span className="font-display" style={{ fontSize: 17, fontWeight: 600, color: t.ink }}>{s.onBehalfOf || s.userName}</span>
                    <BadgeCheck size={15} color={t.green} />
                    {s.onBehalfOf && (
                      <span style={{ fontSize: 11.5, fontWeight: 700, color: '#8a6a1f', background: t.honeyTint, borderRadius: t.radiusSm, padding: '3px 9px' }}>
                        via {s.userName?.split(' ')[0]}
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
                    {s.budget && <span style={{ fontSize: 12, fontWeight: 700, color: t.navy, background: t.coralTint, borderRadius: t.radiusSm, padding: '3px 9px' }}>${s.budget}/wk</span>}
                    {s.areas && <span style={{ fontSize: 12, fontWeight: 700, color: t.inkSoft, background: t.cream, border: `1px solid ${t.border}`, borderRadius: t.radiusSm, padding: '3px 9px', display: 'inline-flex', alignItems: 'center', gap: 4 }}><MapPin size={11} /> {s.areas}</span>}
                    {s.moveIn && <span style={{ fontSize: 12, fontWeight: 700, color: t.inkSoft, background: t.cream, border: `1px solid ${t.border}`, borderRadius: t.radiusSm, padding: '3px 9px', display: 'inline-flex', alignItems: 'center', gap: 4 }}><CalendarDays size={11} /> {s.moveIn}</span>}
                  </div>
                  <p style={{ fontSize: 13.5, color: t.inkSoft, lineHeight: 1.55, margin: '0 0 14px', flex: 1, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{s.about}</p>
                  <button onClick={() => messageSeeker(s)} disabled={busy === s.userId} className="btn btn-coral" style={{ padding: '10px 16px', fontSize: 14 }}>
                    <MessageCircle size={15} /> {s.userId === user?.id ? 'This is you' : (busy === s.userId ? 'Opening…' : `Message ${s.userName?.split(' ')[0]}`)}
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '48px 20px', background: '#fff', borderRadius: t.radiusLg, border: `1px solid ${t.border}` }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 14, color: t.inkFaint }}><Users size={40} /></div>
            <p style={{ fontSize: 16, color: t.inkSoft, marginBottom: 8, fontWeight: 600 }}>No requests yet.</p>
            <Link to="/roommates/edit" style={{ color: t.navy, textDecoration: 'none', fontWeight: 700 }}>Post yours →</Link>
          </div>
        )}
      </div>
    </div>
  );
}
