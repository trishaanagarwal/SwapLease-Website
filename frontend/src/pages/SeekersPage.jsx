import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { collection, query, orderBy, getDocs, where, addDoc, serverTimestamp } from 'firebase/firestore';
import { Users, MapPin, MessageCircle, ImageOff, PlusCircle } from 'lucide-react';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { t } from '../theme';

function Photo({ src }) {
  if (src) return <img src={src} alt="" style={{ width: '100%', height: 200, objectFit: 'cover' }} />;
  return (
    <div style={{ width: '100%', height: 200, background: t.creamDeep, display: 'flex', alignItems: 'center', justifyContent: 'center', color: t.inkFaint }}>
      <ImageOff size={28} />
    </div>
  );
}

export default function SeekersPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [seekers, setSeekers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState('');

  useEffect(() => {
    getDocs(query(collection(db, 'seekers'), orderBy('updatedAt', 'desc')))
      .then(snap => setSeekers(snap.docs.map(d => ({ id: d.id, ...d.data() }))))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const message = async (seeker) => {
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
          listingTitle: `${seeker.userName} · roommate search`,
          participants: [user.id, seeker.userId],
          user1Id: user.id, user2Id: seeker.userId,
          user1Name: user.name, user2Name: seeker.userName,
          lastMessage: '', lastMessageAt: serverTimestamp(), createdAt: serverTimestamp(),
        });
        convId = ref.id;
      }
      navigate(`/messages?conv=${convId}`);
    } catch {
      alert('Could not start a conversation. Please try again.');
      setBusy('');
    }
  };

  const myPost = user && seekers.find(s => s.userId === user.id);

  return (
    <div style={{ minHeight: '100vh', background: t.cream }}>
      <div style={{ background: '#fff', borderBottom: `1px solid ${t.border}`, padding: '34px 22px 26px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', flexWrap: 'wrap', gap: 16, justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Users size={24} color={t.navy} />
              <h1 className="font-display" style={{ fontSize: 'clamp(24px, 4vw, 32px)', fontWeight: 600, color: t.ink, margin: 0 }}>Find a roommate</h1>
            </div>
            <p style={{ color: t.inkSoft, fontSize: 15, margin: '6px 0 0' }}>Students looking to share a place or take over a lease. Message anyone directly.</p>
          </div>
          <Link to="/roommates/edit" className="btn btn-coral" style={{ padding: '11px 20px', fontSize: 14.5 }}>
            <PlusCircle size={16} /> {myPost ? 'Edit your post' : 'Post yours'}
          </Link>
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 22px 64px' }}>
        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 22 }}>
            {[...Array(3)].map((_, i) => <div key={i} className="skeleton" style={{ borderRadius: t.radius, height: 340 }} />)}
          </div>
        ) : seekers.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 22 }}>
            {seekers.map(s => (
              <div key={s.id} style={{ background: '#fff', border: `1px solid ${t.border}`, borderRadius: t.radiusLg, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                <Photo src={s.images?.[0]} />
                {s.images?.length > 1 && (
                  <div style={{ display: 'flex', gap: 4, padding: '6px 6px 0' }}>
                    {s.images.slice(1, 4).map((img, i) => (
                      <img key={i} src={img} alt="" style={{ width: '33%', height: 56, objectFit: 'cover', borderRadius: t.radiusSm }} />
                    ))}
                  </div>
                )}
                <div style={{ padding: '14px 16px 16px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                  <div className="font-display" style={{ fontSize: 18, fontWeight: 600, color: t.ink }}>{s.userName}</div>
                  <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', margin: '6px 0 10px', fontSize: 13, color: t.inkSoft, fontWeight: 600 }}>
                    {s.budget && <span>${s.budget}/wk budget</span>}
                    {s.areas && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><MapPin size={13} /> {s.areas}</span>}
                  </div>
                  <p style={{ fontSize: 13.5, color: t.inkSoft, lineHeight: 1.55, margin: '0 0 14px', flex: 1, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{s.about}</p>
                  <button onClick={() => message(s)} disabled={busy === s.userId} className="btn btn-coral" style={{ padding: '10px 16px', fontSize: 14 }}>
                    <MessageCircle size={16} /> {s.userId === user?.id ? 'This is you' : (busy === s.userId ? 'Opening…' : `Message ${s.userName.split(' ')[0]}`)}
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '64px 20px', background: '#fff', borderRadius: t.radiusLg, border: `1px solid ${t.border}` }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 14, color: t.inkFaint }}><Users size={40} /></div>
            <p style={{ fontSize: 16, color: t.inkSoft, marginBottom: 12, fontWeight: 600 }}>No roommate posts yet. Be the first!</p>
            <Link to="/roommates/edit" className="btn btn-coral" style={{ padding: '11px 24px', fontSize: 14.5 }}>Post yours</Link>
          </div>
        )}
      </div>
    </div>
  );
}
