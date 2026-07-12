import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import DOMPurify from 'dompurify';
import { X } from 'lucide-react';
import { db, auth } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { SUBURBS } from '../constants';
import UniPicker from '../components/UniPicker';
import { t } from '../theme';

const CLOUDINARY_CLOUD = 'deewvfzpl';
const CLOUDINARY_PRESET = 'slease';
const clean = (s) => DOMPurify.sanitize((s || '').trim(), { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });

export default function EditSeekerPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const fileRef = useRef(null);
  const [form, setForm] = useState({ about: '', budget: '', areaChips: [], areasExtra: '', unis: [], moveInFrom: '', moveInTo: '', images: [], onBehalfOf: '' });
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
        const parts = (d.areas || '').split(',').map(x => x.trim()).filter(Boolean);
        setForm({
          about: d.about || '', budget: d.budget ?? '',
          areaChips: parts.filter(x => SUBURBS.includes(x)),
          areasExtra: parts.filter(x => !SUBURBS.includes(x)).join(', '),
          unis: d.unisList || [],
          moveInFrom: d.moveInFrom || '', moveInTo: d.moveInTo || '', images: d.images || [], onBehalfOf: d.onBehalfOf || '',
        });
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

  // Turn the two date fields into a friendly display string for the board.
  const fmtDate = (iso) => iso ? new Date(iso + 'T00:00:00').toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' }) : '';
  const moveInDisplay = () => {
    if (!form.moveInFrom) return '';
    if (form.moveInTo) return `${fmtDate(form.moveInFrom)} – ${fmtDate(form.moveInTo)}`;
    return `From ${fmtDate(form.moveInFrom)}`;
  };

  const save = async () => {
    setError('');
    if (!clean(form.about)) { setError('Please write a short bit about yourself.'); return; }
    if (form.moveInFrom && form.moveInTo && form.moveInTo < form.moveInFrom) {
      setError('The "until" date can\'t be before the "from" date.'); return;
    }
    setSaving(true);
    const payload = {
      userId: user.id,
      userName: user.name,
      userPhotoURL: user.photoURL || '',
      about: clean(form.about),
      budget: form.budget ? Number(form.budget) : null,
      areas: [...form.areaChips, clean(form.areasExtra)].filter(Boolean).join(', '),
      unis: form.unis.join(', '),
      unisList: form.unis,
      moveIn: moveInDisplay(),
      moveInFrom: form.moveInFrom || '',
      moveInTo: form.moveInTo || '',
      images: form.images.slice(0, 4),
      onBehalfOf: clean(form.onBehalfOf) || null,
      updatedAt: serverTimestamp(),
    };
    const write = () => setDoc(doc(db, 'seekers', user.id), payload);
    try {
      await write();
      navigate('/roommates');
    } catch (e) {
      // A just-verified account can still carry a stale token that says
      // "unverified", which the security rules reject. Force a fresh token
      // and try once more before giving up.
      if (e?.code === 'permission-denied' && auth.currentUser) {
        try {
          await auth.currentUser.getIdToken(true);
          await write();
          return navigate('/roommates');
        } catch (e2) {
          setError(`Could not save (${e2?.code || 'error'}). If you just verified your email, please sign out and back in, then try again.`);
          setSaving(false);
          return;
        }
      }
      setError(`Could not save (${e?.code || 'error'}). Please try again.`);
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
          <div style={{ marginBottom: 16 }}>
            <label style={label}>Preferred areas</label>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {SUBURBS.map(sub => {
                const on = form.areaChips.includes(sub);
                return (
                  <button key={sub} type="button"
                    onClick={() => set('areaChips', on ? form.areaChips.filter(x => x !== sub) : [...form.areaChips, sub])}
                    style={{ background: on ? t.navy : '#fff', color: on ? '#fff' : t.inkSoft, border: `1.5px solid ${on ? t.navy : t.borderStrong}`, borderRadius: t.pill, padding: '6px 13px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                    {sub}
                  </button>
                );
              })}
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
            <div>
              <label style={label}>Weekly budget</label>
              <input type="number" value={form.budget} onChange={e => set('budget', e.target.value)} placeholder="e.g. 300" min="0" style={input} />
            </div>
            <div>
              <label style={label}>Other areas (optional)</label>
              <input value={form.areasExtra} onChange={e => set('areasExtra', e.target.value)} placeholder="e.g. Coburg, Kensington" style={input} />
            </div>
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={label}>Near universities</label>
            <UniPicker value={form.unis} onChange={v => set('unis', v)} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
            <div>
              <label style={label}>Available from</label>
              <input type="date" value={form.moveInFrom} onChange={e => set('moveInFrom', e.target.value)} style={input} />
            </div>
            <div>
              <label style={label}>Until (optional)</label>
              <input type="date" value={form.moveInTo} min={form.moveInFrom || undefined} onChange={e => set('moveInTo', e.target.value)} style={input} />
            </div>
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={label}>Posting for someone else? (optional)</label>
            <input value={form.onBehalfOf} onChange={e => set('onBehalfOf', e.target.value)} placeholder="Their first name, e.g. Sarah" maxLength={60} style={input} />
            <div style={{ fontSize: 12.5, color: t.inkFaint, marginTop: 6 }}>
              Only with their permission. The post will say you're posting on their behalf, and messages come to you so you can connect people with them.
            </div>
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
