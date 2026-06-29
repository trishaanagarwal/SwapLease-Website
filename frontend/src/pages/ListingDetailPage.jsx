import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { doc, getDoc, deleteDoc, collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';

const typeLabels = { apartment: 'Apartment', house: 'House', studio: 'Studio', student_accom: 'Student Accommodation' };

function fmtDate(d) {
  if (!d) return null;
  try { return new Date(d).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' }); }
  catch { return d; }
}

export default function ListingDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [imgIdx, setImgIdx] = useState(0);
  const [deleting, setDeleting] = useState(false);
  const [contacting, setContacting] = useState(false);

  useEffect(() => {
    getDoc(doc(db, 'listings', id))
      .then(snap => {
        if (!snap.exists()) { navigate('/listings'); return; }
        setListing({ id: snap.id, ...snap.data() });
      })
      .catch(() => navigate('/listings'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleContact = async () => {
    if (!user) return navigate('/login');
    setContacting(true);
    try {
      // Find or create conversation for this listing between current user and owner
      const q = query(
        collection(db, 'conversations'),
        where('listingId', '==', id),
        where('participants', 'array-contains', user.id)
      );
      const snap = await getDocs(q);
      let convId;
      if (!snap.empty) {
        convId = snap.docs[0].id;
      } else {
        const ownerSnap = await getDoc(doc(db, 'users', listing.userId));
        const ownerName = ownerSnap.exists() ? ownerSnap.data().name : 'Unknown';
        const ref = await addDoc(collection(db, 'conversations'), {
          listingId: id,
          listingTitle: listing.title,
          participants: [user.id, listing.userId],
          user1Id: user.id,
          user2Id: listing.userId,
          user1Name: user.name,
          user2Name: ownerName,
          lastMessage: '',
          lastMessageAt: serverTimestamp(),
          createdAt: serverTimestamp(),
        });
        convId = ref.id;
      }
      navigate(`/messages?conv=${convId}`);
    } catch (err) {
      alert('Could not open conversation. Please try again.');
    } finally {
      setContacting(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Delete this listing?')) return;
    setDeleting(true);
    try {
      await deleteDoc(doc(db, 'listings', id));
      navigate('/listings');
    } catch {
      alert('Could not delete listing. Please try again.');
      setDeleting(false);
    }
  };

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
      <div style={{ width: 40, height: 40, border: '3px solid #e5e7eb', borderTopColor: '#F2654E', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
    </div>
  );

  if (!listing) return null;

  const images = listing.images?.length > 0 ? listing.images : [`https://picsum.photos/seed/${id}/800/500`];
  const isOwner = user?.id === listing.userId;

  return (
    <div style={{ minHeight: '100vh', background: '#FBF6EE' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 20px' }}>

        <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', fontSize: 14, display: 'flex', alignItems: 'center', gap: 4, marginBottom: 20, padding: 0 }}>
          ← Back to listings
        </button>

        <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start', flexWrap: 'wrap' }}>

          <div style={{ flex: 1, minWidth: 320 }}>
            <div style={{ borderRadius: 12, overflow: 'hidden', position: 'relative', background: '#e5e7eb', marginBottom: 20, height: 380 }}>
              <img src={images[imgIdx]} alt={listing.title}
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                onError={e => { e.target.src = `https://picsum.photos/seed/${id}err/800/500`; }} />
              {images.length > 1 && (
                <>
                  <button onClick={() => setImgIdx(i => (i - 1 + images.length) % images.length)}
                    style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.4)', color: '#fff', border: 'none', borderRadius: '50%', width: 36, height: 36, cursor: 'pointer', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>‹</button>
                  <button onClick={() => setImgIdx(i => (i + 1) % images.length)}
                    style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.4)', color: '#fff', border: 'none', borderRadius: '50%', width: 36, height: 36, cursor: 'pointer', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>›</button>
                  <div style={{ position: 'absolute', bottom: 12, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 6 }}>
                    {images.map((_, i) => (
                      <button key={i} onClick={() => setImgIdx(i)}
                        style={{ width: 8, height: 8, borderRadius: '50%', background: i === imgIdx ? '#fff' : 'rgba(255,255,255,0.5)', border: 'none', cursor: 'pointer', padding: 0 }} />
                    ))}
                  </div>
                </>
              )}
            </div>

            <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', padding: '24px 28px', marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: '#F2654E', background: '#FDEAE4', borderRadius: 20, padding: '3px 12px' }}>
                      {typeLabels[listing.type] || listing.type}
                    </span>
                    {listing.furnished && (
                      <span style={{ fontSize: 12, fontWeight: 600, color: '#059669', background: '#d1fae5', borderRadius: 20, padding: '3px 12px' }}>Furnished</span>
                    )}
                  </div>
                  <h1 style={{ fontSize: 26, fontWeight: 800, color: '#111', margin: '0 0 8px', lineHeight: 1.2 }}>{listing.title}</h1>
                  <p style={{ fontSize: 15, color: '#6b7280', margin: 0 }}>
                    📍 {[listing.address, listing.suburb, listing.city].filter(Boolean).join(', ')}
                  </p>
                </div>
                {isOwner && (
                  <button onClick={handleDelete} disabled={deleting}
                    style={{ background: 'none', border: '1px solid #fecaca', color: '#dc2626', borderRadius: 8, padding: '7px 16px', fontSize: 13, cursor: 'pointer', fontWeight: 600 }}>
                    {deleting ? 'Deleting...' : 'Delete'}
                  </button>
                )}
              </div>
            </div>

            <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', padding: '24px 28px', marginBottom: 16 }}>
              <h2 style={{ fontSize: 17, fontWeight: 700, color: '#111', margin: '0 0 20px' }}>Property details</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 16 }}>
                {[
                  { label: 'Weekly rent', value: `$${listing.rent?.toLocaleString()}/wk` },
                  listing.bond && { label: 'Bond', value: `$${listing.bond?.toLocaleString()}` },
                  { label: 'Bedrooms', value: `🛏 ${listing.bedrooms}` },
                  { label: 'Bathrooms', value: `🚿 ${listing.bathrooms}` },
                  { label: 'Total tenants', value: `👥 ${listing.tenants || 1}` },
                  listing.availableFrom && { label: 'Available from', value: fmtDate(listing.availableFrom) },
                  listing.availableTo && { label: 'Lease ends', value: fmtDate(listing.availableTo) },
                ].filter(Boolean).map((item, i) => (
                  <div key={i} style={{ background: '#f9fafb', borderRadius: 10, padding: '14px 16px' }}>
                    <div style={{ fontSize: 11, color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>{item.label}</div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: '#111' }}>{item.value}</div>
                  </div>
                ))}
              </div>
              {listing.nearbyUni && (
                <div style={{ marginTop: 16, background: '#F3E9F4', borderRadius: 10, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 16 }}>🎓</span>
                  <span style={{ fontSize: 14, fontWeight: 600, color: '#8A5A8F' }}>Near {listing.nearbyUni}</span>
                </div>
              )}
            </div>

            {listing.description && (
              <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', padding: '24px 28px' }}>
                <h2 style={{ fontSize: 17, fontWeight: 700, color: '#111', margin: '0 0 14px' }}>About this place</h2>
                <p style={{ fontSize: 15, color: '#374151', lineHeight: 1.7, margin: 0, whiteSpace: 'pre-wrap' }}>{listing.description}</p>
              </div>
            )}
          </div>

          <div style={{ width: 300, flexShrink: 0 }}>
            <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', padding: 24, position: 'sticky', top: 80 }}>
              <div style={{ marginBottom: 20 }}>
                <span style={{ fontSize: 32, fontWeight: 900, color: '#111' }}>${listing.rent?.toLocaleString()}</span>
                <span style={{ fontSize: 16, color: '#6b7280' }}> /week</span>
                {listing.bond && <div style={{ fontSize: 13, color: '#9ca3af', marginTop: 4 }}>Bond: ${listing.bond?.toLocaleString()}</div>}
              </div>

              {!isOwner ? (
                <button onClick={handleContact} disabled={contacting}
                  style={{ width: '100%', background: contacting ? '#F7A595' : '#F2654E', color: '#fff', border: 'none', borderRadius: 10, padding: 13, fontWeight: 700, fontSize: 16, cursor: contacting ? 'not-allowed' : 'pointer', marginBottom: 20 }}>
                  {contacting ? 'Opening chat...' : `💬 Message ${listing.userName?.split(' ')[0]}`}
                </button>
              ) : (
                <div style={{ background: '#f0fdf4', borderRadius: 10, padding: '12px 16px', marginBottom: 20, fontSize: 14, color: '#059669', fontWeight: 600, textAlign: 'center' }}>
                  ✓ This is your listing
                </div>
              )}

              {!user && (
                <div style={{ textAlign: 'center', marginBottom: 20 }}>
                  <Link to="/login" style={{ color: '#F2654E', fontWeight: 700, textDecoration: 'none', fontSize: 14 }}>Sign in</Link>
                  <span style={{ color: '#6b7280', fontSize: 14 }}> to message the lister</span>
                </div>
              )}

              <div style={{ borderTop: '1px solid #f3f4f6', paddingTop: 20 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 }}>Listed by</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#F2654E', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 18, flexShrink: 0 }}>
                    {listing.userName?.[0]?.toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 15, color: '#111' }}>{listing.userName}</div>
                    {listing.userUniversity && <div style={{ fontSize: 13, color: '#6b7280', marginTop: 2 }}>{listing.userUniversity}</div>}
                  </div>
                </div>
                {listing.userBio && <p style={{ fontSize: 13, color: '#6b7280', marginTop: 12, lineHeight: 1.5 }}>{listing.userBio}</p>}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
