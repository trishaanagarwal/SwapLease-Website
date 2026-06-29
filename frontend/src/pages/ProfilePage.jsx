import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Edit2, Save, X, PlusCircle, User } from 'lucide-react';
import { collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { UNIVERSITIES } from '../constants';
import ListingCard from '../components/ListingCard';
import { t } from '../theme';

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const [editing, setEditing] = useState(false);
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ name: '', bio: '', university: '', phone: '' });

  useEffect(() => {
    if (user) setForm({ name: user.name || '', bio: user.bio || '', university: user.university || '', phone: user.phone || '' });
  }, [user]);

  useEffect(() => {
    if (!user) return;
    getDocs(query(collection(db, 'listings'), where('userId', '==', user.id), where('status', '==', 'active')))
      .then(snap => setListings(snap.docs.map(d => ({ id: d.id, ...d.data() }))))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user]);

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
              <div style={{ width: 68, height: 68, borderRadius: 22, background: `linear-gradient(135deg, ${t.coral}, ${t.honey})`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 28 }}>
                {user?.name?.[0]?.toUpperCase()}
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
              {listings.map(l => <ListingCard key={l.id} listing={l} />)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
