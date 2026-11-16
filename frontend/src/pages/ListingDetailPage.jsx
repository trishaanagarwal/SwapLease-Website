import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { doc, getDoc, updateDoc, collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { MapPin, GraduationCap, MessageCircle, Flag, Share2, Check, ChevronLeft, ChevronRight } from 'lucide-react';
import BookmarkButton from '../components/BookmarkButton';
import { NoPhoto } from '../components/ListingCard';
import SafetyTips from '../components/SafetyTips';
import { deleteListing } from '../media';

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
  const [lister, setLister] = useState(null); // public profile: { admin }

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

  // Fetch the lister's public profile (admin flag is set by the rules, not the user).
  useEffect(() => {
    if (!listing?.userId) return;
    getDoc(doc(db, 'profiles', listing.userId))
      .then(s => setLister({ admin: !!s.data()?.admin }))
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
      // Only reuse a conversation that is really with this listing's owner.
      const existing = snap.docs.find(d => d.data().participants?.includes(listing.userId));
      if (existing) {
        convId = existing.id;
      } else {
        const ownerName = listing.userName || 'Lister';
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
      await deleteListing(listing);
      navigate('/listings');
    } catch {
      alert('Could not delete listing. Please try again.');
      setDeleting(false);
    }
  };

  if (loading) return <div className="center-fill"><div className="spinner" role="status" aria-label="Loading" /></div>;

  if (!listing) return null;

  const images = listing.images?.length > 0 ? listing.images : [];
  const hasImages = images.length > 0;
  const isOwner = user?.id === listing.userId;
  const adminListed = !!lister?.admin;
  // On-behalf listings can carry a direct contact link for the real leaseholder.
  const contactHref = listing.onBehalfOf ? resolveContactHref(listing.contactLink) : null;
  const contactIsExternal = contactHref ? /^https?:\/\//i.test(contactHref) : false;

  const firstName = listing.userName?.split(' ')[0] || 'the lister';
  const shareText = `Taking over my lease: ${listing.title}, ${listing.suburb}, $${listing.rent}/wk. ${window.location.href}`;
  const facts = [
    { label: 'Weekly rent', value: `$${listing.rent?.toLocaleString()}` },
    listing.bond && { label: 'Bond', value: `$${listing.bond?.toLocaleString()}` },
    { label: 'Bedrooms', value: `${listing.bedrooms}` },
    { label: 'Bathrooms', value: `${listing.bathrooms}` },
    { label: 'Tenants in total', value: `${listing.tenants || 1}` },
    typeof listing.renewable === 'boolean' && { label: 'Renewable', value: listing.renewable ? 'Yes' : 'No' },
    listing.availableFrom && { label: 'Available from', value: fmtDate(listing.availableFrom) },
    listing.availableTo && { label: 'Lease ends', value: fmtDate(listing.availableTo) },
  ].filter(Boolean);

  return (
    <div className="wrap page--tight">
      <button type="button" className="link back-link" onClick={() => navigate(-1)}>Back to leases</button>

      <div className="detail">
        <div className="detail__main">
          <div className="gallery">
            {hasImages ? <img src={images[imgIdx]} alt={listing.title} /> : <NoPhoto />}
            {images.length > 1 && (
              <>
                <button type="button" className="icon-btn gallery__prev" aria-label="Previous photo" onClick={() => setImgIdx(i => (i - 1 + images.length) % images.length)}><ChevronLeft size={20} aria-hidden="true" /></button>
                <button type="button" className="icon-btn gallery__next" aria-label="Next photo" onClick={() => setImgIdx(i => (i + 1) % images.length)}><ChevronRight size={20} aria-hidden="true" /></button>
                <span className="pill gallery__count">{imgIdx + 1} of {images.length}</span>
              </>
            )}
          </div>
          {images.length > 1 && (
            <div className="thumbs">
              {images.map((src, i) => (
                <button key={src} type="button" aria-label={`Photo ${i + 1}`} aria-pressed={i === imgIdx} onClick={() => setImgIdx(i)}><img src={src} alt="" loading="lazy" /></button>
              ))}
            </div>
          )}

          <header className="detail__head">
            <div className="chips">
              <span className="pill">{typeLabels[listing.type] || listing.type}</span>
              {listing.status === 'taken' && <span className="pill pill--gold">Taken</span>}
              {listing.furnished && <span className="pill pill--quiet">Furnished</span>}
              {listing.nearbyUni && <span className="pill pill--accent"><GraduationCap aria-hidden="true" />Near {listing.nearbyUni}</span>}
            </div>
            <h1>{listing.title}</h1>
            <p className="muted" style={{ display: 'flex', alignItems: 'center', gap: 6 }}><MapPin size={16} aria-hidden="true" />{[listing.address, listing.suburb, listing.city].filter(Boolean).join(', ')}</p>
            <div className="btn-row">
              <button type="button" className="btn btn--secondary" onClick={handleShare}>{copied ? <><Check size={16} aria-hidden="true" />Link copied</> : <><Share2 size={16} aria-hidden="true" />Share</>}</button>
              {!isOwner && <BookmarkButton listingId={listing.id} variant="button" />}
              {isOwner && (
                <>
                  <Link to={`/listings/${id}/edit`} className="btn btn--secondary">Edit listing</Link>
                  <button type="button" className="btn btn--secondary" onClick={toggleStatus}>{listing.status === 'taken' ? 'Mark as available' : 'Mark as taken'}</button>
                  <button type="button" className="btn btn--secondary btn--danger" onClick={handleDelete} disabled={deleting}>{deleting ? 'Deleting' : 'Delete listing'}</button>
                </>
              )}
            </div>
          </header>

          <section className="detail__block">
            <h2>The lease</h2>
            <dl className="facts">
              {facts.map(f => <div key={f.label}><dt>{f.label}</dt><dd>{f.value}</dd></div>)}
            </dl>
          </section>

          {listing.description && (
            <section className="detail__block">
              <h2>About this place</h2>
              <p style={{ whiteSpace: 'pre-wrap', lineHeight: 1.7, maxWidth: '68ch' }}>{listing.description}</p>
            </section>
          )}
        </div>

        <aside className="detail__side">
          <div className="sheet sheet--pad stack-4">
            <div className="lcard__price"><b style={{ fontSize: 40 }}>${listing.rent?.toLocaleString()}</b><span>per week</span></div>
            {listing.bond && <p className="muted t-small" style={{ marginTop: 4 }}>Bond ${listing.bond?.toLocaleString()}</p>}

            {!isOwner ? (
              contactHref ? (
                <a href={contactHref} target={contactIsExternal ? '_blank' : undefined} rel={contactIsExternal ? 'noopener noreferrer' : undefined} className="btn btn--primary btn--block">
                  <MessageCircle size={18} aria-hidden="true" />Contact {listing.onBehalfOf}
                </a>
              ) : (
                <button type="button" onClick={handleContact} disabled={contacting} className="btn btn--primary btn--block">
                  <MessageCircle size={18} aria-hidden="true" />{contacting ? 'Opening chat' : (adminListed ? 'Message the SwapLease team' : `Message ${firstName}`)}
                </button>
              )
            ) : (
              <>
                <p className="alert alert--ok">This is your listing.</p>
                <p className="t-small muted">Share it where students look:</p>
                <div className="btn-row">
                  <button type="button" className="btn btn--secondary" onClick={() => openShare(`https://wa.me/?text=${encodeURIComponent(shareText)}`)}>WhatsApp</button>
                  <button type="button" className="btn btn--secondary" onClick={() => openShare(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`)}>Facebook</button>
                  <button type="button" className="btn btn--secondary" onClick={handleShare}>{copied ? 'Copied' : 'Copy link'}</button>
                </div>
              </>
            )}

            {!user && !contactHref && <p className="t-small muted"><Link className="link" to="/login">Sign in</Link> to message the lister.</p>}
            {adminListed && <p className="alert alert--note">Listed by the SwapLease team</p>}
            {listing.onBehalfOf && (
              <p className="alert alert--note">
                Posted for <b>{listing.onBehalfOf}</b>. {contactHref
                  ? `The button above goes straight to ${listing.onBehalfOf}.`
                  : `${adminListed ? 'The SwapLease team' : 'The lister'} manages this listing and will put you in touch.`}
              </p>
            )}

            {!isOwner && (
              <div style={{ borderTop: '1px solid var(--line)', paddingTop: 'var(--s-4)' }}>
                {reported
                  ? <p className="t-small" style={{ color: 'var(--action)' }}>Reported. Thank you.</p>
                  : <button type="button" className="link t-small muted" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }} onClick={handleReport}><Flag size={14} aria-hidden="true" />Report this listing</button>}
              </div>
            )}
          </div>
          <SafetyTips compact />
        </aside>
      </div>
    </div>
  );
}
