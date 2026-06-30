import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Edit2, Save, X, PlusCircle, User, Mail, Trash2, Pencil, AlertTriangle, Camera } from 'lucide-react';

const CLOUDINARY_CLOUD = 'deewvfzpl';
const CLOUDINARY_PRESET = 'slease';
import { collection, query, where, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { UNIVERSITIES } from '../constants';
import ListingCard from '../components/ListingCard';
import { t } from '../theme';

export default function ProfilePage() {
  const { user, updateUser, changeEmail, deleteAccount, isPasswordUser } = useAuth();
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ name: '', bio: '', university: '', phone: '' });

  // Email change flow
  const [emailForm, setEmailForm] = useState({ newEmail: '', password: '' });
  const [emailBusy, setEmailBusy] = useState(false);
  const [emailMsg, setEmailMsg] = useState({ type: '', text: '' });

  // Account deletion flow
  const [showDelete, setShowDelete] = useState(false);
  const [delConfirm, setDelConfirm] = useState('');
  const [delPassword, setDelPassword] = useState('');
  const [delBusy, setDelBusy] = useState(false);
  const [delError, setDelError] = useState('');
  const passwordUser = isPasswordUser();

  const handleDeleteAccount = async () => {
    setDelError('');
    if (delConfirm !== 'DELETE') { setDelError('Please type DELETE to confirm.'); return; }
    if (passwordUser && !delPassword) { setDelError('Enter your password to confirm.'); return; }
    setDelBusy(true);
    try {
      await deleteAccount(delPassword);
      navigate('/');
    } catch (err) {
      if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') setDelError('Incorrect password.');
      else if (err.code === 'auth/popup-closed-by-user') setDelError('Verification was cancelled. Please try again.');
      else if (err.code === 'auth/requires-recent-login') setDelError('Please sign out and back in, then try again.');
      else setDelError('Could not delete account. Please try again.');
      setDelBusy(false);
    }
  };

  useEffect(() => {
    if (user) setForm({ name: user.name || '', bio: user.bio || '', university: user.university || '', phone: user.phone || '' });
  }, [user]);

  useEffect(() => {
    if (!user) return;
    getDocs(query(collection(db, 'listings'), where('userId', '==', user.id)))
      .then(snap => {
        const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        items.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
        setListings(items);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user]);

  const handleEmailChange = async () => {
    setEmailMsg({ type: '', text: '' });
    const next = emailForm.newEmail.trim().toLowerCase();
    if (!next.includes('@')) { setEmailMsg({ type: 'err', text: 'Enter a valid new email address.' }); return; }
    if (next === (user.email || '').toLowerCase()) { setEmailMsg({ type: 'err', text: 'That is already your current email.' }); return; }
    if (!emailForm.password) { setEmailMsg({ type: 'err', text: 'Enter your current password to confirm.' }); return; }
    setEmailBusy(true);
    try {
      await changeEmail(next, emailForm.password);
      setEmailMsg({ type: 'ok', text: `Verification link sent to ${next}. Click it to confirm, then sign in with your new email. Your old email stays active until you confirm.` });
      setEmailForm({ newEmail: '', password: '' });
    } catch (err) {
      if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') setEmailMsg({ type: 'err', text: 'Incorrect password.' });
      else if (err.code === 'auth/email-already-in-use') setEmailMsg({ type: 'err', text: 'That email is already in use by another account.' });
      else if (err.code === 'auth/too-many-requests') setEmailMsg({ type: 'err', text: 'Too many attempts. Please wait a moment and try again.' });
      else setEmailMsg({ type: 'err', text: err.message || 'Could not change email. Please try again.' });
    } finally {
      setEmailBusy(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      await updateDoc(doc(db, 'users', user.id), form);
      updateUser(form);
      setEditing(false);
    } catch {
      setError('Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const removeListing = async (id) => {
    if (!confirm('Remove this listing permanently? This cannot be undone.')) return;
    try {
      await deleteDoc(doc(db, 'listings', id));
      setListings(ls => ls.filter(l => l.id !== id));
    } catch {
      alert('Could not remove the listing. Please try again.');
    }
  };

  const avatarInputRef = useRef(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) { alert('Please use a JPG, PNG or WEBP image.'); return; }
    if (file.size > 5 * 1024 * 1024) { alert('Image must be under 5MB.'); return; }
    setAvatarUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('upload_preset', CLOUDINARY_PRESET);
      const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD}/image/upload`, { method: 'POST', body: fd });
      const data = await res.json();
      if (!data.secure_url) throw new Error('upload failed');
      updateUser({ photoURL: data.secure_url });
    } catch {
      alert('Could not upload photo. Please try again.');
    } finally {
      setAvatarUploading(false);
      e.target.value = '';
    }
  };

  const toggleListingStatus = async (id, current) => {
    const next = current === 'taken' ? 'active' : 'taken';
    try {
      await updateDoc(doc(db, 'listings', id), { status: next });
      setListings(ls => ls.map(l => l.id === id ? { ...l, status: next } : l));
    } catch {
      alert('Could not update the listing. Please try again.');
    }
  };

  const card = { background: '#fff', borderRadius: t.radiusLg, border: `1px solid ${t.border}`, boxShadow: t.shadowSm };
  const lbl = { display: 'block', fontSize: 13, fontWeight: 700, color: t.ink, marginBottom: 7 };
  const field = { width: '100%', fontFamily: 'inherit', fontSize: 14.5, color: t.ink, background: '#fff', border: `1.5px solid ${t.borderStrong}`, borderRadius: 12, padding: '10px 14px', outline: 'none', boxSizing: 'border-box' };
  const smallBtn = { display: 'flex', alignItems: 'center', gap: 6, fontSize: 13.5, fontWeight: 700, padding: '9px 16px', borderRadius: t.pill, cursor: 'pointer', fontFamily: 'inherit' };
  const infoBox = { padding: '14px 16px', background: t.cream, borderRadius: 14 };

  return (
    <div style={{ minHeight: '100vh', background: t.cream, padding: '40px 0' }}>
      <div style={{ maxWidth: 960, margin: '0 auto', padding: '0 22px', display: 'flex', flexDirection: 'column', gap: 24 }}>

        <div style={{ ...card, padding: 28 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24, gap: 16, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
              <div style={{ position: 'relative', width: 68, height: 68, flexShrink: 0 }}>
                {user?.photoURL ? (
                  <img src={user.photoURL} alt="" style={{ width: 68, height: 68, borderRadius: 22, objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: 68, height: 68, borderRadius: 22, background: `linear-gradient(135deg, ${t.coral}, ${t.honey})`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 28 }}>
                    {user?.name?.[0]?.toUpperCase()}
                  </div>
                )}
                <input ref={avatarInputRef} type="file" accept="image/jpeg,image/png,image/webp" style={{ display: 'none' }} onChange={handleAvatarChange} />
                <button onClick={() => avatarInputRef.current?.click()} disabled={avatarUploading} aria-label="Change photo"
                  style={{ position: 'absolute', bottom: -4, right: -4, width: 28, height: 28, borderRadius: '50%', background: t.navy, border: '2px solid #fff', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: avatarUploading ? 'wait' : 'pointer' }}>
                  <Camera size={14} />
                </button>
              </div>
              <div>
                <h1 className="font-display" style={{ fontSize: 27, fontWeight: 800, color: t.ink, margin: 0 }}>{user?.name}</h1>
                <p style={{ color: t.inkSoft, fontSize: 14.5, margin: '4px 0 0' }}>{user?.email}</p>
              </div>
            </div>
            {!editing ? (
              <button onClick={() => setEditing(true)} style={{ ...smallBtn, color: t.ink, background: '#fff', border: `1.5px solid ${t.borderStrong}` }}>
                <Edit2 size={14} /> Edit Profile
              </button>
            ) : (
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => setEditing(false)} style={{ ...smallBtn, color: t.inkSoft, background: '#fff', border: `1.5px solid ${t.borderStrong}` }}>
                  <X size={14} /> Cancel
                </button>
                <button onClick={handleSave} disabled={saving} className="btn btn-coral" style={{ ...smallBtn, color: '#fff', opacity: saving ? 0.6 : 1 }}>
                  <Save size={14} /> {saving ? 'Saving…' : 'Save'}
                </button>
              </div>
            )}
          </div>

          {error && <div style={{ background: t.coralTint, border: `1px solid ${t.coral}`, color: t.coralDeep, padding: '11px 15px', borderRadius: 12, fontSize: 14, marginBottom: 16, fontWeight: 600 }}>{error}</div>}

          {editing ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
              <div>
                <label style={lbl}>Full Name</label>
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} style={field} />
              </div>
              <div>
                <label style={lbl}>University</label>
                <select value={form.university} onChange={e => setForm(f => ({ ...f, university: e.target.value }))} style={{ ...field, cursor: 'pointer', appearance: 'auto' }}>
                  <option value="">Select your university...</option>
                  {UNIVERSITIES.map(u => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
              <div>
                <label style={lbl}>Phone</label>
                <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="04XX XXX XXX" style={field} />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={lbl}>Bio</label>
                <textarea value={form.bio} onChange={e => setForm(f => ({ ...f, bio: e.target.value }))} rows={3} placeholder="Tell others a bit about yourself..." style={{ ...field, resize: 'vertical', lineHeight: 1.5 }} />
              </div>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
              {user?.university && (
                <div style={infoBox}>
                  <div style={{ fontSize: 12, color: t.inkFaint, marginBottom: 3, fontWeight: 600 }}>University</div>
                  <div style={{ color: t.ink, fontWeight: 700, fontSize: 14.5 }}>{user.university}</div>
                </div>
              )}
              {user?.phone && (
                <div style={infoBox}>
                  <div style={{ fontSize: 12, color: t.inkFaint, marginBottom: 3, fontWeight: 600 }}>Phone</div>
                  <div style={{ color: t.ink, fontWeight: 700, fontSize: 14.5 }}>{user.phone}</div>
                </div>
              )}
              {user?.bio && (
                <div style={{ ...infoBox, gridColumn: '1 / -1' }}>
                  <div style={{ fontSize: 12, color: t.inkFaint, marginBottom: 3, fontWeight: 600 }}>Bio</div>
                  <div style={{ color: t.ink, fontSize: 14.5, lineHeight: 1.5 }}>{user.bio}</div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ---- Account email & security ---- */}
        <div style={{ ...card, padding: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <Mail size={19} color={t.navy} />
            <h2 className="font-display" style={{ fontSize: 20, fontWeight: 800, color: t.ink, margin: 0 }}>Login email</h2>
          </div>
          <p style={{ color: t.inkSoft, fontSize: 14, margin: '0 0 18px' }}>
            Current email: <strong style={{ color: t.ink }}>{user?.email}</strong>. Changing it sends a verification link to the new address, your old email keeps working until you confirm.
          </p>

          {emailMsg.text && (
            <div style={{
              background: emailMsg.type === 'ok' ? t.sageTint : t.coralTint,
              border: `1px solid ${emailMsg.type === 'ok' ? t.sage : t.coral}`,
              color: emailMsg.type === 'ok' ? t.sage : t.coralDeep,
              padding: '12px 15px', borderRadius: 12, fontSize: 13.5, marginBottom: 16, fontWeight: 600, lineHeight: 1.5 }}>
              {emailMsg.text}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
            <div>
              <label style={lbl}>New email address</label>
              <input type="email" value={emailForm.newEmail} onChange={e => setEmailForm(f => ({ ...f, newEmail: e.target.value }))} placeholder="new@example.com" style={field} />
            </div>
            <div>
              <label style={lbl}>Confirm current password</label>
              <input type="password" value={emailForm.password} onChange={e => setEmailForm(f => ({ ...f, password: e.target.value }))} placeholder="Your password" style={field} />
            </div>
          </div>
          <button onClick={handleEmailChange} disabled={emailBusy} className="btn btn-coral"
            style={{ marginTop: 16, padding: '11px 22px', fontSize: 14.5, opacity: emailBusy ? 0.6 : 1 }}>
            {emailBusy ? 'Sending…' : 'Update email'}
          </button>
        </div>

        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
            <h2 className="font-display" style={{ fontSize: 24, fontWeight: 800, color: t.ink, margin: 0 }}>My Listings</h2>
            <Link to="/create-listing" className="btn btn-coral" style={{ fontSize: 14, padding: '10px 18px' }}>
              <PlusCircle size={16} /> New Listing
            </Link>
          </div>

          {loading ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 22 }}>
              {[...Array(2)].map((_, i) => <div key={i} style={{ height: 300, background: '#fff', borderRadius: t.radius, border: `1px solid ${t.border}` }} />)}
            </div>
          ) : listings.length === 0 ? (
            <div style={{ ...card, padding: 56, textAlign: 'center' }}>
              <div style={{ width: 60, height: 60, background: t.cream, borderRadius: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px' }}>
                <User size={26} color={t.inkFaint} />
              </div>
              <h3 className="font-display" style={{ fontWeight: 700, fontSize: 20, color: t.ink, marginBottom: 8 }}>No listings yet</h3>
              <p style={{ color: t.inkSoft, fontSize: 14.5, marginBottom: 18 }}>Post your first lease transfer listing</p>
              <Link to="/create-listing" className="btn btn-coral" style={{ padding: '11px 24px', fontSize: 14.5 }}>
                <PlusCircle size={16} /> Create Listing
              </Link>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 22 }}>
              {listings.map(l => (
                <div key={l.id} style={{ display: 'flex', flexDirection: 'column' }}>
                  <ListingCard listing={l} />
                  <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                    <Link to={`/listings/${l.id}/edit`}
                      style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, textDecoration: 'none', background: '#fff', border: `1.5px solid ${t.borderStrong}`, color: t.ink, borderRadius: t.pill, padding: '8px 10px', fontSize: 13, fontWeight: 700 }}>
                      <Pencil size={14} /> Edit
                    </Link>
                    <button onClick={() => toggleListingStatus(l.id, l.status)}
                      style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, background: l.status === 'taken' ? t.sageTint : t.honeyTint, border: 'none', color: l.status === 'taken' ? t.sage : '#A87C33', borderRadius: t.pill, padding: '8px 10px', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                      {l.status === 'taken' ? 'Available' : 'Mark taken'}
                    </button>
                    <button onClick={() => removeListing(l.id)} aria-label="Remove listing"
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff', border: '1.5px solid #fecaca', color: '#dc2626', borderRadius: t.pill, padding: '8px 12px', cursor: 'pointer' }}>
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ---- Danger zone: delete account ---- */}
        <div style={{ ...card, padding: 28, border: '1px solid #f3c9c9', background: '#fffafa' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <AlertTriangle size={19} color="#dc2626" />
            <h2 className="font-display" style={{ fontSize: 20, fontWeight: 800, color: '#b91c1c', margin: 0 }}>Delete account</h2>
          </div>
          <p style={{ color: t.inkSoft, fontSize: 14, margin: '0 0 16px', lineHeight: 1.6 }}>
            Permanently delete your SwapLease account, your profile and all of your listings. This cannot be undone.
          </p>

          {!showDelete ? (
            <button onClick={() => setShowDelete(true)}
              style={{ background: '#fff', border: '1.5px solid #dc2626', color: '#dc2626', borderRadius: t.pill, padding: '10px 20px', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
              Delete my account
            </button>
          ) : (
            <div style={{ background: '#fff', border: '1px solid #f3c9c9', borderRadius: 14, padding: 20 }}>
              <p style={{ fontSize: 13.5, color: t.ink, margin: '0 0 14px', fontWeight: 600 }}>
                To confirm, {passwordUser ? 'enter your password and ' : ''}type <strong>DELETE</strong> below.
                {!passwordUser && ' You\'ll be asked to re-verify with Google.'}
              </p>
              {delError && (
                <div style={{ background: t.coralTint, border: `1px solid ${t.coral}`, color: t.coralDeep, padding: '10px 14px', borderRadius: 10, fontSize: 13.5, marginBottom: 12, fontWeight: 600 }}>{delError}</div>
              )}
              {passwordUser && (
                <input type="password" value={delPassword} onChange={e => setDelPassword(e.target.value)} placeholder="Your password"
                  style={{ ...field, marginBottom: 10 }} />
              )}
              <input value={delConfirm} onChange={e => setDelConfirm(e.target.value)} placeholder="Type DELETE to confirm"
                style={{ ...field, marginBottom: 14 }} />
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={handleDeleteAccount} disabled={delBusy}
                  style={{ background: '#dc2626', border: 'none', color: '#fff', borderRadius: t.pill, padding: '10px 20px', fontSize: 14, fontWeight: 700, cursor: delBusy ? 'not-allowed' : 'pointer', opacity: delBusy ? 0.6 : 1, fontFamily: 'inherit' }}>
                  {delBusy ? 'Deleting…' : 'Permanently delete'}
                </button>
                <button onClick={() => { setShowDelete(false); setDelError(''); setDelConfirm(''); setDelPassword(''); }} disabled={delBusy}
                  style={{ background: '#fff', border: `1.5px solid ${t.borderStrong}`, color: t.inkSoft, borderRadius: t.pill, padding: '10px 20px', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
