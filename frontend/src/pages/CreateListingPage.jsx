import { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { collection, addDoc, updateDoc, getDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { UNIVERSITIES } from '../constants';

const CLOUDINARY_CLOUD = 'deewvfzpl';
const CLOUDINARY_PRESET = 'slease';

function Counter({ value, onChange, min = 1, max = 20 }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <button type="button" onClick={() => onChange(Math.max(min, value - 1))}
        style={{ width: 34, height: 34, borderRadius: '50%', border: '1px solid #d1d5db', background: '#fff', cursor: 'pointer', fontSize: 18, color: '#374151', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>−</button>
      <span style={{ fontSize: 18, fontWeight: 700, color: '#111', minWidth: 24, textAlign: 'center' }}>{value}</span>
      <button type="button" onClick={() => onChange(Math.min(max, value + 1))}
        style={{ width: 34, height: 34, borderRadius: '50%', border: '1px solid #d1d5db', background: '#fff', cursor: 'pointer', fontSize: 18, color: '#374151', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', padding: '24px 28px', marginBottom: 16 }}>
      <h2 style={{ fontSize: 16, fontWeight: 700, color: '#111', margin: '0 0 20px' }}>{title}</h2>
      {children}
    </div>
  );
}

const labelStyle = { display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 };
const inputStyle = { width: '100%', border: '1px solid #d1d5db', borderRadius: 8, padding: '10px 14px', fontSize: 14, color: '#111', outline: 'none', boxSizing: 'border-box' };

export default function CreateListingPage() {
  const navigate = useNavigate();
  const { id: editId } = useParams();
  const isEdit = !!editId;
  const { user } = useAuth();
  const fileInputRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    title: '', description: '', address: '', suburb: '', city: '', state: '',
    rent: '', bond: '', availableFrom: '', availableTo: '',
    type: 'apartment', furnished: false, bedrooms: 1, bathrooms: 1, tenants: 1,
    nearbyUni: '', images: [],
  });

  // Load existing listing when editing; only the owner may edit.
  useEffect(() => {
    if (!isEdit || !user) return;
    getDoc(doc(db, 'listings', editId)).then(snap => {
      if (!snap.exists()) { navigate('/listings'); return; }
      const d = snap.data();
      if (d.userId !== user.id) { navigate(`/listings/${editId}`); return; }
      setForm({
        title: d.title || '', description: d.description || '', address: d.address || '',
        suburb: d.suburb || '', city: d.city || '', state: d.state || '',
        rent: d.rent ?? '', bond: d.bond ?? '', availableFrom: d.availableFrom || '', availableTo: d.availableTo || '',
        type: d.type || 'apartment', furnished: !!d.furnished, bedrooms: d.bedrooms || 1,
        bathrooms: d.bathrooms || 1, tenants: d.tenants || 1, nearbyUni: d.nearbyUni || '', images: d.images || [],
      });
    });
  }, [isEdit, editId, user, navigate]);

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const bathPerTenant = form.tenants > 0 ? (form.bathrooms / form.tenants).toFixed(2).replace(/\.?0+$/, '') : 'n/a';
  const ratioLabel = form.tenants === 1
    ? `${form.bathrooms} bathroom${form.bathrooms > 1 ? 's' : ''} for 1 person`
    : `${form.bathrooms} bathroom${form.bathrooms > 1 ? 's' : ''} for ${form.tenants} people (${bathPerTenant} per person)`;
  const ratioColor = (form.bathrooms / form.tenants) >= 1 ? '#059669' : (form.bathrooms / form.tenants) >= 0.5 ? '#d97706' : '#dc2626';

  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    const MAX_MB = 5;
    const ALLOWED = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    for (const f of files) {
      if (!ALLOWED.includes(f.type)) { setError(`"${f.name}" is not an allowed image type (JPG, PNG, WEBP, GIF only)`); return; }
      if (f.size > MAX_MB * 1024 * 1024) { setError(`"${f.name}" exceeds the ${MAX_MB}MB size limit`); return; }
    }
    setUploading(true);
    setError('');
    try {
      const urls = await Promise.all(files.map(async (file) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', CLOUDINARY_PRESET);
        const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD}/image/upload`, { method: 'POST', body: formData });
        const data = await res.json();
        if (!data.secure_url) throw new Error('Upload failed');
        return data.secure_url;
      }));
      set('images', [...form.images, ...urls]);
    } catch {
      setError('Upload failed. Try again.');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const removeImage = (i) => set('images', form.images.filter((_, idx) => idx !== i));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.title.trim()) { setError('Title is required'); return; }
    if (!form.rent) { setError('Rent is required'); return; }
    setLoading(true);
    const fields = {
      title: form.title.trim(),
      description: form.description.trim(),
      address: form.address.trim(),
      suburb: form.suburb.trim(),
      city: form.city.trim(),
      rent: Number(form.rent),
      bond: form.bond ? Number(form.bond) : null,
      availableFrom: form.availableFrom || null,
      availableTo: form.availableTo || null,
      type: form.type,
      furnished: form.furnished,
      bedrooms: Number(form.bedrooms),
      bathrooms: Number(form.bathrooms),
      tenants: Number(form.tenants),
      nearbyUni: form.nearbyUni || '',
      images: form.images,
    };
    try {
      if (isEdit) {
        await updateDoc(doc(db, 'listings', editId), fields);
        navigate(`/listings/${editId}`);
      } else {
        const ref_ = await addDoc(collection(db, 'listings'), {
          userId: user.id,
          userName: user.name,
          userUniversity: user.university || '',
          userBio: user.bio || '',
          ...fields,
          status: 'active',
          createdAt: serverTimestamp(),
        });
        navigate(`/listings/${ref_.id}`);
      }
    } catch {
      setError(`Failed to ${isEdit ? 'update' : 'create'} listing. Please try again.`);
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#F8F6F1', padding: '32px 20px' }}>
      <div style={{ maxWidth: 680, margin: '0 auto' }}>
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: '#111', margin: '0 0 6px' }}>{isEdit ? 'Edit your listing' : 'List your lease'}</h1>
          <p style={{ color: '#6b7280', fontSize: 15, margin: 0 }}>{isEdit ? 'Update the details of your lease transfer listing' : 'Fill in the details to post your lease transfer listing'}</p>
        </div>

        {error && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', borderRadius: 10, padding: '12px 16px', fontSize: 14, marginBottom: 16 }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <Section title="Basic information">
            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Listing title *</label>
              <input value={form.title} onChange={e => set('title', e.target.value)}
                placeholder="e.g. Modern 2BR Apartment Near Melbourne Uni" required style={inputStyle}
                onFocus={e => e.target.style.borderColor = '#1B3A6B'} onBlur={e => e.target.style.borderColor = '#d1d5db'} />
            </div>
            <div>
              <label style={labelStyle}>Description</label>
              <textarea value={form.description} onChange={e => set('description', e.target.value)}
                rows={5} placeholder="Describe the property, its features, why you're transferring your lease..."
                style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.5 }}
                onFocus={e => e.target.style.borderColor = '#1B3A6B'} onBlur={e => e.target.style.borderColor = '#d1d5db'} />
            </div>
          </Section>

          <Section title="Location">
            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Street address</label>
              <input value={form.address} onChange={e => set('address', e.target.value)}
                placeholder="e.g. 581 Swanston Street" style={inputStyle}
                onFocus={e => e.target.style.borderColor = '#1B3A6B'} onBlur={e => e.target.style.borderColor = '#d1d5db'} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
              <div>
                <label style={labelStyle}>Suburb</label>
                <input value={form.suburb} onChange={e => set('suburb', e.target.value)} placeholder="e.g. Carlton" style={inputStyle}
                  onFocus={e => e.target.style.borderColor = '#1B3A6B'} onBlur={e => e.target.style.borderColor = '#d1d5db'} />
              </div>
              <div>
                <label style={labelStyle}>City</label>
                <input value={form.city} onChange={e => set('city', e.target.value)} placeholder="e.g. Melbourne" style={inputStyle}
                  onFocus={e => e.target.style.borderColor = '#1B3A6B'} onBlur={e => e.target.style.borderColor = '#d1d5db'} />
              </div>
            </div>
            <div>
              <label style={labelStyle}>Nearby university</label>
              <select value={form.nearbyUni} onChange={e => set('nearbyUni', e.target.value)}
                style={{ ...inputStyle, background: '#fff', cursor: 'pointer', appearance: 'auto' }}>
                <option value="">Select nearby university...</option>
                {UNIVERSITIES.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
          </Section>

          <Section title="Pricing">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={labelStyle}>Rent per week *</label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', fontSize: 14 }}>$</span>
                  <input type="number" value={form.rent} onChange={e => set('rent', e.target.value)} placeholder="350" min="0" required
                    style={{ ...inputStyle, paddingLeft: 26 }}
                    onFocus={e => e.target.style.borderColor = '#1B3A6B'} onBlur={e => e.target.style.borderColor = '#d1d5db'} />
                </div>
              </div>
              <div>
                <label style={labelStyle}>Bond</label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', fontSize: 14 }}>$</span>
                  <input type="number" value={form.bond} onChange={e => set('bond', e.target.value)} placeholder="1400" min="0"
                    style={{ ...inputStyle, paddingLeft: 26 }}
                    onFocus={e => e.target.style.borderColor = '#1B3A6B'} onBlur={e => e.target.style.borderColor = '#d1d5db'} />
                </div>
              </div>
            </div>
          </Section>

          <Section title="Availability">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={labelStyle}>Available from</label>
                <input type="date" value={form.availableFrom} onChange={e => set('availableFrom', e.target.value)} style={inputStyle}
                  onFocus={e => e.target.style.borderColor = '#1B3A6B'} onBlur={e => e.target.style.borderColor = '#d1d5db'} />
              </div>
              <div>
                <label style={labelStyle}>Lease ends</label>
                <input type="date" value={form.availableTo} onChange={e => set('availableTo', e.target.value)} style={inputStyle}
                  onFocus={e => e.target.style.borderColor = '#1B3A6B'} onBlur={e => e.target.style.borderColor = '#d1d5db'} />
              </div>
            </div>
          </Section>

          <Section title="Property details">
            <div style={{ marginBottom: 20 }}>
              <label style={labelStyle}>Property type</label>
              <select value={form.type} onChange={e => set('type', e.target.value)} style={{ ...inputStyle, background: '#fff', cursor: 'pointer' }}>
                <option value="apartment">Apartment</option>
                <option value="house">House / Townhouse</option>
                <option value="studio">Studio</option>
                <option value="student_accom">Student Accommodation</option>
              </select>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, marginBottom: 20 }}>
              <div><label style={labelStyle}>Bedrooms</label><Counter value={form.bedrooms} onChange={v => set('bedrooms', v)} /></div>
              <div><label style={labelStyle}>Bathrooms</label><Counter value={form.bathrooms} onChange={v => set('bathrooms', v)} /></div>
              <div><label style={labelStyle}>Total tenants</label><Counter value={form.tenants} onChange={v => set('tenants', v)} max={50} /></div>
            </div>
            <div style={{ background: '#f9fafb', borderRadius: 8, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
              <span style={{ fontSize: 16 }}>🚿</span>
              <span style={{ fontSize: 13, color: ratioColor, fontWeight: 600 }}>{ratioLabel}</span>
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
              <div onClick={() => set('furnished', !form.furnished)}
                style={{ width: 44, height: 24, borderRadius: 12, background: form.furnished ? '#1B3A6B' : '#d1d5db', position: 'relative', transition: 'background 0.2s', cursor: 'pointer', flexShrink: 0 }}>
                <div style={{ position: 'absolute', top: 3, left: form.furnished ? 23 : 3, width: 18, height: 18, borderRadius: '50%', background: '#fff', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
              </div>
              <span style={{ fontSize: 14, fontWeight: 600, color: '#374151' }}>Furnished</span>
            </label>
          </Section>

          <Section title="Photos">
            <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" multiple style={{ display: 'none' }} onChange={handleFileChange} />
            <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploading}
              style={{ width: '100%', border: '2px dashed #d1d5db', borderRadius: 10, padding: '28px 20px', textAlign: 'center', cursor: uploading ? 'not-allowed' : 'pointer', background: uploading ? '#f9fafb' : '#fafafa', marginBottom: form.images.length > 0 ? 16 : 0 }}
              onMouseEnter={e => !uploading && (e.currentTarget.style.borderColor = '#1B3A6B')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = '#d1d5db')}>
              {uploading ? (
                <div><div style={{ fontSize: 28, marginBottom: 8 }}>⏳</div><div style={{ fontSize: 14, color: '#6b7280', fontWeight: 600 }}>Uploading…</div></div>
              ) : (
                <div>
                  <div style={{ fontSize: 32, marginBottom: 8 }}>📷</div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#111', marginBottom: 4 }}>Click to upload photos</div>
                  <div style={{ fontSize: 13, color: '#9ca3af' }}>JPG, PNG, WEBP or GIF · Max 5MB each</div>
                </div>
              )}
            </button>
            {form.images.length > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                {form.images.map((url, i) => (
                  <div key={i} style={{ position: 'relative', borderRadius: 8, overflow: 'hidden', height: 100, background: '#f3f4f6' }}>
                    <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <button type="button" onClick={() => removeImage(i)}
                      style={{ position: 'absolute', top: 5, right: 5, background: 'rgba(0,0,0,0.6)', color: '#fff', border: 'none', borderRadius: '50%', width: 22, height: 22, cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
                  </div>
                ))}
              </div>
            )}
          </Section>

          <button type="submit" disabled={loading}
            style={{ width: '100%', background: loading ? '#5C7AA8' : '#1B3A6B', color: '#fff', border: 'none', borderRadius: 10, padding: 14, fontWeight: 700, fontSize: 16, cursor: loading ? 'not-allowed' : 'pointer', marginTop: 8 }}>
            {loading ? (isEdit ? 'Saving…' : 'Publishing…') : (isEdit ? 'Save changes' : 'Publish listing')}
          </button>
        </form>
      </div>
    </div>
  );
}
