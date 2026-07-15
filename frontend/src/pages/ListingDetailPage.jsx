import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { doc, getDoc, deleteDoc, updateDoc, collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { MapPin, GraduationCap, MessageCircle, Flag, ImageOff, Share2, Check } from 'lucide-react';
import BookmarkButton from '../components/BookmarkButton';
import SafetyTips from '../components/SafetyTips';
import { ADMIN_EMAILS } from '../constants';

const typeLabels = { apartment: 'Apartment', house: 'House', studio: 'Studio', student_accom: 'Student Accommodation' };

function fmtDate(d) {
  if (!d) return null;
  try { return new Date(d).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' }); }
  catch { return d; }
}

// Turn a free-text contact into a usable href: phone → tel:, email → mailto:, otherwise a URL.
function resolveContactHref(raw) {
  const v = (raw || '').trim();
  if (!v) return null;
  if (/^https?:\/\//i.test(v)) return v;
  if (/^www\./i.test(v)) return `https://${v}`;
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return `mailto:${v}`;
  if (/^[+(]?[\d][\d\s()-]{5,}$/.test(v)) return `tel:${v.replace(/[\s()-]/g, '')}`;
  return `https://${v}`;
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
  const [lister, setLister] = useState(null); // { name, photoURL } or { deleted: true }

  useEffect(() => {
    getDoc(doc(db, 'listings', id))
      .then(snap => {
        if (!snap.exists()) { navigate('/listings'); return; }
        setListing({ id: snap.id, ...snap.data() });
      })
      .catch(() => navigate('/listings'))
      .finally(() => setLoading(false));
  }, [id]);

  // Reflect the listing in the tab title (and restore on leave).
  useEffect(() => {
    if (listing?.title) document.title = `${listing.title} · $${listing.rent}/wk · SwapLease`;
    return () => { document.title = 'SwapLease — Skip the Fee. Find the Key.'; };
  }, [listing?.title, listing?.rent]);

  // Fetch the lister's current public profile (photo/name, or deleted state).
  useEffect(() => {
    if (!listing?.userId) return;
    getDoc(doc(db, 'users', listing.userId))
      .then(s => setLister(s.exists()
        ? { name: s.data().name, photoURL: s.data().photoURL || '', email: (s.data().email || '').toLowerCase() }
        : { deleted: true }))
      .catch(() => {});
  }, [listing?.userId]);

  const handleContact = async () => {
    if (!user) return navigate('/login');
    if (!user.emailVerified) return navigate('/messages'); // shows the verify prompt
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
          readBy: [user.id, listing.userId],
        });
        convId = ref.id;
      }
      navigate(`/messages?conv=${convId}`);
    } catch {
      alert('Could not open conversation. Please try again.');
    } finally {
      setContacting(false);
    }
  };

  // Open a share URL reliably: new tab where allowed, same-tab fallback so it
  // never silently fails to open (some mobile browsers block target="_blank").
  const openShare = (url) => {
    const w = window.open(url, '_blank', 'noopener,noreferrer');
    if (!w) window.location.href = url;
  };

  // Share: native share sheet on mobile, copy-link fallback on desktop.
  const [copied, setCopied] = useState(false);
  const handleShare = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: listing.title, url });
      } else {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch { /* user cancelled share sheet */ }
  };

  const [reported, setReported] = useState(false);
  const handleReport = async () => {
    if (!user) return navigate('/login');
    const reason = prompt('Why are you reporting this listing? (e.g. scam, fake, inappropriate)');
    if (!reason || !reason.trim()) return;
    try {
      await addDoc(collection(db, 'reports'), {
        listingId: id,
        listingTitle: listing.title || '',
        reporterId: user.id,
        reason: reason.trim().slice(0, 1000),
        createdAt: serverTimestamp(),
      });
      setReported(true);
    } catch {
      alert('Could not submit report. Please try again.');
    }
  };

  const toggleStatus = async () => {
    const next = listing.status === 'taken' ? 'active' : 'taken';
    try {
      await updateDoc(doc(db, 'listings', id), { status: next });
      setListing(l => ({ ...l, status: next }));
    } catch {
      alert('Could not update status. Please try again.');
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
      <div style={{ width: 40, height: 40, border: '3px solid #E5E1D8', borderTopColor: '#1B3A6B', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
    </div>
  );

  if (!listing) return null;

  const images = listing.images?.length > 0 ? listing.images : [];
  const hasImages = images.length > 0;
  const isOwner = user?.id === listing.userId;
  const adminListed = ADMIN_EMAILS.includes(lister?.email);
  // On-behalf listings can carry a direct contact link for the real leaseholder.
  const contactHref = listing.onBehalfOf ? resolveContactHref(listing.contactLink) : null;
  const contactIsExternal = contactHref ? /^https?:\/\//i.test(contactHref) : false;

  return (
    <div style={{ minHeight: '100vh', background: '#F8F6F1' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 20px' }}>

        <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#586079', fontSize: 14, display: 'flex', alignItems: 'center', gap: 4, marginBottom: 20, padding: 0 }}>
          ← Back to listings
        </button>

        <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start', flexWrap: 'wrap' }}>

          <div style={{ flex: '1 1 480px', minWidth: 0 }}>
            <div style={{ borderRadius: 12, overflow: 'hidden', position: 'relative', background: '#E5E1D8', marginBottom: 20, height: 380 }}>
              {hasImages ? (
                <img src={images[imgIdx]} alt={listing.title}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              ) : (
                <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, background: '#F1ECE3', color: '#9AA0B0' }}>
                  <ImageOff size={42} />
                  <span style={{ fontSize: 14, fontWeight: 700 }}>No photos provided</span>
                </div>
              )}
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

            <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E5E1D8', padding: '24px 28px', marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: '#1B3A6B', background: '#E8EDF6', borderRadius: 20, padding: '3px 12px' }}>
                      {typeLabels[listing.type] || listing.type}
                    </span>
                    {listing.status === 'taken' && (
                      <span style={{ fontSize: 12, fontWeight: 700, color: '#fff', background: '#A87C33', borderRadius: 20, padding: '3px 12px' }}>Taken</span>
                    )}
                    {listing.furnished && (
                      <span style={{ fontSize: 12, fontWeight: 600, color: '#1C4D3E', background: '#E6EDE8', borderRadius: 20, padding: '3px 12px' }}>Furnished</span>
                    )}
                  </div>
                  <h1 className="font-display" style={{ fontSize: 26, fontWeight: 600, color: '#16223B', margin: '0 0 8px', lineHeight: 1.2 }}>{listing.title}</h1>
                  <p style={{ fontSize: 15, color: '#586079', margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <MapPin size={15} /> {[listing.address, listing.suburb, listing.city].filter(Boolean).join(', ')}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                  <button onClick={handleShare}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#fff', border: '1.5px solid #D9D3C6', color: copied ? '#1C4D3E' : '#16223B', borderRadius: 8, padding: '7px 14px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                    {copied ? <><Check size={14} /> Link copied</> : <><Share2 size={14} /> Share</>}
                  </button>
                  {!isOwner && <BookmarkButton listingId={listing.id} variant="button" />}
                  {isOwner && (
                    <>
                      <Link to={`/listings/${id}/edit`}
                        style={{ textDecoration: 'none', background: '#fff', border: '1.5px solid #D9D3C6', color: '#16223B', borderRadius: 8, padding: '7px 16px', fontSize: 13, fontWeight: 700 }}>
                        Edit
                      </Link>
                      <button onClick={toggleStatus}
                        style={{ background: listing.status === 'taken' ? '#E2ECE6' : '#F4EBD7', border: 'none', color: listing.status === 'taken' ? '#1C4D3E' : '#A87C33', borderRadius: 8, padding: '8px 16px', fontSize: 13, cursor: 'pointer', fontWeight: 700 }}>
                        {listing.status === 'taken' ? 'Mark as available' : 'Mark as taken'}
                      </button>
                      <button onClick={handleDelete} disabled={deleting}
                        style={{ background: 'none', border: '1px solid #fecaca', color: '#dc2626', borderRadius: 8, padding: '7px 16px', fontSize: 13, cursor: 'pointer', fontWeight: 600 }}>
                        {deleting ? 'Deleting...' : 'Delete'}
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E5E1D8', padding: '24px 28px', marginBottom: 16 }}>
              <h2 style={{ fontSize: 17, fontWeight: 700, color: '#16223B', margin: '0 0 20px' }}>Property details</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 16 }}>
                {[
                  { label: 'Weekly rent', value: `$${listing.rent?.toLocaleString()}/wk` },
                  listing.bond && { label: 'Bond', value: `$${listing.bond?.toLocaleString()}` },
                  { label: 'Bedrooms', value: `${listing.bedrooms}` },
                  { label: 'Bathrooms', value: `${listing.bathrooms}` },
                  { label: 'Total tenants', value: `${listing.tenants || 1}` },
                  typeof listing.renewable === 'boolean' && { label: 'Renewable', value: listing.renewable ? 'Yes' : 'No' },
                  listing.availableFrom && { label: 'Available from', value: fmtDate(listing.availableFrom) },
                  listing.availableTo && { label: 'Lease ends', value: fmtDate(listing.availableTo) },
                ].filter(Boolean).map((item, i) => (
                  <div key={i} style={{ background: '#F8F6F1', borderRadius: 10, padding: '14px 16px' }}>
                    <div style={{ fontSize: 11, color: '#9AA0B0', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>{item.label}</div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: '#16223B' }}>{item.value}</div>
                  </div>
                ))}
              </div>
              {listing.nearbyUni && (
                <div style={{ marginTop: 16, background: '#E2ECE6', borderRadius: 10, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <GraduationCap size={17} color="#1C4D3E" />
                  <span style={{ fontSize: 14, fontWeight: 600, color: '#1C4D3E' }}>Near {listing.nearbyUni}</span>
                </div>
              )}
            </div>

            {listing.description && (
              <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E5E1D8', padding: '24px 28px' }}>
                <h2 style={{ fontSize: 17, fontWeight: 700, color: '#16223B', margin: '0 0 14px' }}>About this place</h2>
                <p style={{ fontSize: 15, color: '#3E4763', lineHeight: 1.7, margin: 0, whiteSpace: 'pre-wrap' }}>{listing.description}</p>
              </div>
            )}
          </div>

          <div style={{ flex: '1 1 300px', maxWidth: 420, minWidth: 0 }}>
            <div style={{ position: 'sticky', top: 80 }}>
            <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E5E1D8', padding: 24 }}>
              <div style={{ marginBottom: 20 }}>
                <span style={{ fontSize: 32, fontWeight: 900, color: '#16223B' }}>${listing.rent?.toLocaleString()}</span>
                <span style={{ fontSize: 16, color: '#586079' }}> /week</span>
                {listing.bond && <div style={{ fontSize: 13, color: '#9AA0B0', marginTop: 4 }}>Bond: ${listing.bond?.toLocaleString()}</div>}
              </div>

              {!isOwner ? (
                contactHref ? (
                  <a href={contactHref}
                    target={contactIsExternal ? '_blank' : undefined}
                    rel={contactIsExternal ? 'noopener noreferrer' : undefined}
                    style={{ width: '100%', boxSizing: 'border-box', background: '#1B3A6B', color: '#fff', borderRadius: 10, padding: 13, fontWeight: 700, fontSize: 16, textDecoration: 'none', marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                    <MessageCircle size={18} /> Contact {listing.onBehalfOf}
                  </a>
                ) : (
                  <button onClick={handleContact} disabled={contacting}
                    style={{ width: '100%', background: contacting ? '#5C7AA8' : '#1B3A6B', color: '#fff', border: 'none', borderRadius: 10, padding: 13, fontWeight: 700, fontSize: 16, cursor: contacting ? 'not-allowed' : 'pointer', marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                    <MessageCircle size={18} /> {contacting ? 'Opening chat...' : (adminListed ? 'Message the SwapLease team' : `Message ${listing.userName?.split(' ')[0]}`)}
                  </button>
                )
              ) : (
                <div style={{ marginBottom: 20 }}>
                  <div style={{ background: '#E6EDE8', borderRadius: 10, padding: '12px 16px', marginBottom: 12, fontSize: 14, color: '#1C4D3E', fontWeight: 600, textAlign: 'center' }}>
                    ✓ This is your listing
                  </div>
                  {/* Owner share row: put the listing where students actually look */}
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#586079', marginBottom: 8 }}>Share it where students will see it:</div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => openShare(`https://wa.me/?text=${encodeURIComponent(`Taking over my lease: ${listing.title}, ${listing.suburb} · $${listing.rent}/wk — ${window.location.href}`)}`)}
                      style={{ flex: 1, textAlign: 'center', border: 'none', cursor: 'pointer', fontFamily: 'inherit', background: '#1C4D3E', color: '#fff', borderRadius: 8, padding: '9px 0', fontSize: 13, fontWeight: 700 }}>
                      WhatsApp
                    </button>
                    <button onClick={() => openShare(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`)}
                      style={{ flex: 1, textAlign: 'center', border: 'none', cursor: 'pointer', fontFamily: 'inherit', background: '#1B3A6B', color: '#fff', borderRadius: 8, padding: '9px 0', fontSize: 13, fontWeight: 700 }}>
                      Facebook
                    </button>
                    <button onClick={handleShare}
                      style={{ flex: 1, background: '#fff', border: '1.5px solid #D5CFC2', cursor: 'pointer', fontFamily: 'inherit', color: copied ? '#1C4D3E' : '#16223B', borderRadius: 8, padding: '9px 0', fontSize: 13, fontWeight: 700 }}>
                      {copied ? 'Copied ✓' : 'Copy link'}
                    </button>
                  </div>
                </div>
              )}

              {!user && !contactHref && (
                <div style={{ textAlign: 'center', marginBottom: 20 }}>
                  <Link to="/login" style={{ color: '#1B3A6B', fontWeight: 700, textDecoration: 'none', fontSize: 14 }}>Sign in</Link>
                  <span style={{ color: '#586079', fontSize: 14 }}> to message the lister</span>
                </div>
              )}

              {ADMIN_EMAILS.includes(lister?.email) && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, background: '#F2EAD9', borderRadius: 8, padding: '9px 12px', marginBottom: 20, fontSize: 13, color: '#8a6a1f', fontWeight: 700 }}>
                  ★ Listed by the SwapLease team
                </div>
              )}

              {listing.onBehalfOf && (
                <div style={{ background: '#F2EAD9', borderRadius: 8, padding: '10px 12px', marginBottom: 20, fontSize: 13, color: '#8a6a1f', lineHeight: 1.5 }}>
                  Posted on behalf of <strong>{listing.onBehalfOf}</strong>. {contactHref
                    ? `The button above takes you straight to ${listing.onBehalfOf}.`
                    : `${adminListed ? 'The SwapLease team' : 'The lister'} manages this listing and will connect you with them.`}
                </div>
              )}


              {!isOwner && (
                <div style={{ borderTop: '1px solid #EFEBE2', paddingTop: 14, marginTop: 18, textAlign: 'center' }}>
                  {reported ? (
                    <span style={{ fontSize: 13, color: '#1C4D3E', fontWeight: 600 }}>✓ Reported, thank you</span>
                  ) : (
                    <button onClick={handleReport}
                      style={{ background: 'none', border: 'none', color: '#9AA0B0', fontSize: 13, cursor: 'pointer', fontWeight: 600, textDecoration: 'underline', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                      <Flag size={13} /> Report this listing
                    </button>
                  )}
                </div>
              )}
            </div>

            <div style={{ marginTop: 16 }}><SafetyTips compact /></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
