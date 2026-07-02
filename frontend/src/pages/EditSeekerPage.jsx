import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import DOMPurify from 'dompurify';
import { X } from 'lucide-react';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { t } from '../theme';

const CLOUDINARY_CLOUD = 'deewvfzpl';
const CLOUDINARY_PRESET = 'slease';
const clean = (s) => DOMPurify.sanitize((s || '').trim(), { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });

export default function EditSeekerPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const fileRef = useRef(null);
  const [form, setForm] = useState({ about: '', budget: '', areas: '', moveIn: '', images: [] });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  useEffect(() => {
    if (!user) return;
    getDoc(doc(db, 'seekers', user.id)).then(s => {
      if (s.exists()) {
        const d = s.data();
        setForm({ about: d.about || '', budget: d.budget ?? '', areas: d.areas || '', moveIn: d.moveIn || '', images: d.images || [] });
      }
    }).finally(() => setLoading(false));
  }, [user]);

  const addPhotos = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const room = 4 - form.images.length;
    if (room <= 0) { setError('You can add up to 4 photos.'); return; }
    for (const f of files.slice(0, room)) {
      if (!f.type.startsWith('image/')) { setError('Please choose image files only.'); return; }
      if (f.size > 10 * 1024 * 1024) { setError('Each image must be under 10MB.'); return; }
    }
    setUploading(true); setError('');
    try {
      const urls = await Promise.all(files.slice(0, room).map(async (file) => {
        const fd = new FormData();
        fd.append('file', file); fd.append('upload_preset', CLOUDINARY_PRESET);
        const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD}/image/upload`, { method: 'POST', body: fd });
        const data = await res.json();
        if (!data.secure_url) throw new Error('fail');
        return data.secure_url;
      }));
      set('images', [...form.images, ...urls]);
    } catch { setError('Upload failed. Please try again.'); }
    finally { setUploading(false); e.target.value = ''; }
  };

  const save = async () => {
    setError('');
    if (!clean(form.about)) { setError('Please write a short bit about yourself.'); return; }
    setSaving(true);
    try {
      await setDoc(doc(db, 'seekers', user.id), {
        userId: user.id,
        userName: user.name,
        userPhotoURL: user.photoURL || '',
        about: clean(form.about),
        budget: form.budget ? Number(form.budget) : null,
        areas: clean(form.areas),
        moveIn: clean(form.moveIn),
        images: form.images.slice(0, 4),
        updatedAt: serverTimestamp(),
      });
      navigate('/roommates');
    } catch {
      setError('Could not save. Please try again.');
      setSaving(false);
    }
  };

  const removePost = async () => {
    if (!confirm('Remove your request?')) return;
    try { await deleteDoc(doc(db, 'seekers', user.id)); navigate('/roommates'); }
    catch { setError('Could not remove the post.'); }
  };

  const label = { display: 'block', fontSize: 13, fontWeight: 700, color: t.ink, marginBottom: 6 };
  const input = { width: '100%', border: `1.5px solid ${t.borderStrong}`, borderRadius: t.radius, padding: '10px 14px', fontSize: 14.5, color: t.ink, background: '#fff', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' };

  if (loading) return <div style={{ minHeight: '60vh' }} />;

  return (
    <div style={{ minHeight: '100vh', background: t.cream, padding: '32px 20px' }}>
      <div style={{ maxWidth: 640, margin: '0 auto' }}>
        <h1 className="font-display" style={{ fontSize: 28, fontWeight: 600, color: t.ink, margin: '0 0 6px' }}>Your request</h1>
        <p style={{ color: t.inkSoft, fontSize: 15, margin: '0 0 24px' }}>Say what you're looking for, a place, a room, or a roommate, and add up to 4 photos. Others can message you directly.</p>

        {error && <div style={{ background: t.coralTint, border: `1px solid ${t.coral}`, color: t.coralDeep, borderRadius: t.radius, padding: '11px 15px', fontSize: 14, marginBottom: 16, fontWeight: 600 }}>{error}</div>}

        <div style={{ background: '#fff', border: `1px solid ${t.border}`, borderRadius: t.radiusLg, padding: 24 }}>
          <div style={{ marginBottom: 16 }}>
            <label style={label}>About you *</label>
            <textarea value={form.about} onChange={e => set('about', e.target.value)} rows={5}
              placeholder="Who you are, what you study, what you're looking for in a place or roommate…"
              style={{ ...input, resize: 'vertical', lineHeight: 1.5 }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
            <div>
              <label style={label}>Weekly budget</label>
              <input type="number" value={form.budget} onChange={e => set('budget', e.target.value)} placeholder="e.g. 300" min="0" style={input} />
            </div>
            <div>
              <label style={label}>Preferred areas</label>
              <input value={form.areas} onChange={e => set('areas', e.target.value)} placeholder="e.g. Carlton, Parkville" style={input} />
            </div>
          </div>
          <div style={{ marginBottom: 20 }}>
            <label style={label}>Move-in timing</label>
            <input value={form.moveIn} onChange={e => set('moveIn', e.target.value)} placeholder="e.g. From July, flexible" style={input} />
          </div>

          <label style={label}>Photos ({form.images.length}/4)</label>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16 }}>
            {form.images.map((img, i) => (
              <div key={i} style={{ position: 'relative', width: 96, height: 96, borderRadius: t.radius, overflow: 'hidden' }}>
                <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <button onClick={() => set('images', form.images.filter((_, idx) => idx !== i))}
                  style={{ position: 'absolute', top: 4, right: 4, background: 'rgba(0,0,0,0.6)', color: '#fff', border: 'none', borderRadius: '50%', width: 22, height: 22, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <X size={13} />
                </button>
              </div>
            ))}
            {form.images.length < 4 && (
              <button onClick={() => fileRef.current?.click()} disabled={uploading}
                style={{ width: 96, height: 96, borderRadius: t.radius, border: `1.5px dashed ${t.borderStrong}`, background: t.cream, color: t.inkSoft, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
                {uploading ? '…' : '+ Add'}
              </button>
            )}
            <input ref={fileRef} type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={addPhotos} />
          </div>

          <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
            <button onClick={save} disabled={saving} className="btn btn-coral" style={{ padding: '12px 26px', fontSize: 15, opacity: saving ? 0.6 : 1 }}>
              {saving ? 'Saving…' : 'Save post'}
            </button>
            <button onClick={removePost} style={{ background: '#fff', border: '1.5px solid #fecaca', color: '#dc2626', borderRadius: t.radius, padding: '12px 20px', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
              Remove post
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
