import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';

// ── Address Autocomplete using OpenStreetMap Nominatim (free, no API key) ──
function AddressAutocomplete({ value, onChange, onSelect }) {
  const [suggestions, setSuggestions] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef(null);
  const wrapperRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const fetchSuggestions = useCallback((query) => {
    if (query.length < 3) { setSuggestions([]); setOpen(false); return; }
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        // Free-text Nominatim search. The Melbourne bounding box with bounded=1
        // excludes Geelong (lon ~144.36) and other regional cities — they fall
        // outside the west limit of 144.5935. Do NOT append ", Melbourne, Victoria"
        // to the raw query: partial strings like "316 La, Melbourne, Victoria"
        // confuse Nominatim and return zero results.
        const MELBOURNE_BBOX = '144.5935,-38.2032,145.6010,-37.5113';
        const url = [
          'https://nominatim.openstreetmap.org/search',
          `?q=${encodeURIComponent(query)}`,
          `&countrycodes=au`,
          `&viewbox=${MELBOURNE_BBOX}`,
          `&bounded=1`,
          `&format=json`,
          `&addressdetails=1`,
          `&limit=7`,
        ].join('');
        const res = await fetch(url, { headers: { 'Accept-Language': 'en-AU' } });
        const data = await res.json();

        // Extra client-side filter: only keep results that are in Victoria
        const vic = data.filter(r =>
          r.address?.state === 'Victoria' &&
          // exclude results whose city/county is clearly not Melbourne metro
          !['Geelong', 'Ballarat', 'Bendigo', 'Shepparton', 'Wodonga', 'Wangaratta'].includes(
            r.address?.city || r.address?.town || r.address?.county || ''
          )
        );

        setSuggestions(vic);
        setOpen(vic.length > 0);
      } catch {
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, 350);
  }, []);

  const handleChange = (e) => {
    onChange(e.target.value);
    fetchSuggestions(e.target.value);
  };

  const handleSelect = (item) => {
    const addr = item.address;
    // Build a clean street address from the components
    const streetNum = addr.house_number || '';
    const street = addr.road || addr.pedestrian || addr.path || '';
    const streetAddr = [streetNum, street].filter(Boolean).join(' ');

    const suburb = addr.suburb || addr.neighbourhood || addr.village || addr.town || addr.city_district || '';
    const city = addr.city || addr.town || addr.county || '';
    const state = addr.state || '';

    onSelect({ address: streetAddr, suburb, city, state, displayName: item.display_name });
    setOpen(false);
    setSuggestions([]);
  };

  // Format suggestion label concisely
  const formatLabel = (item) => {
    const a = item.address;
    const parts = [
      [a.house_number, a.road].filter(Boolean).join(' '),
      a.suburb || a.neighbourhood || a.village || '',
      a.city || a.town || '',
      a.state || '',
    ].filter(Boolean);
    return parts.join(', ');
  };

  return (
    <div ref={wrapperRef} style={{ position: 'relative' }}>
      <input
        type="text"
        value={value}
        onChange={handleChange}
        onFocus={() => suggestions.length > 0 && setOpen(true)}
        placeholder="Start typing an address, e.g. 45 Swanston St..."
        style={{
          width: '100%', border: '1px solid #d1d5db', borderRadius: 8,
          padding: '10px 14px', fontSize: 14, color: '#111', outline: 'none',
          boxSizing: 'border-box',
        }}
        onFocusCapture={e => e.target.style.borderColor = '#0ea5e9'}
        onBlurCapture={e => e.target.style.borderColor = '#d1d5db'}
        autoComplete="off"
      />
      {loading && (
        <div style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 11, color: '#9ca3af' }}>
          Searching…
        </div>
      )}
      {open && suggestions.length > 0 && (
        <ul style={{
          position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0,
          background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10,
          boxShadow: '0 4px 20px rgba(0,0,0,0.12)', zIndex: 100, margin: 0,
          padding: 0, listStyle: 'none', maxHeight: 280, overflowY: 'auto',
        }}>
          {suggestions.map((item, i) => (
            <li
              key={item.place_id || i}
              onMouseDown={() => handleSelect(item)}
              style={{
                padding: '10px 14px', cursor: 'pointer', fontSize: 13,
                color: '#111', borderBottom: i < suggestions.length - 1 ? '1px solid #f3f4f6' : 'none',
                display: 'flex', alignItems: 'flex-start', gap: 8,
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#f0f9ff'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <span style={{ flexShrink: 0, marginTop: 1 }}>📍</span>
              <span style={{ lineHeight: 1.4 }}>{formatLabel(item)}</span>
            </li>
          ))}
          <li style={{ padding: '6px 14px', fontSize: 11, color: '#9ca3af', borderTop: '1px solid #f3f4f6' }}>
            Powered by OpenStreetMap
          </li>
        </ul>
      )}
    </div>
  );
}

// ── Counter control (+/-) ──────────────────────────────────────────────────
function Counter({ value, onChange, min = 1, max = 20 }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <button type="button" onClick={() => onChange(Math.max(min, value - 1))}
        style={{ width: 34, height: 34, borderRadius: '50%', border: '1px solid #d1d5db', background: '#fff', cursor: 'pointer', fontSize: 18, color: '#374151', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        −
      </button>
      <span style={{ fontSize: 18, fontWeight: 700, color: '#111', minWidth: 24, textAlign: 'center' }}>{value}</span>
      <button type="button" onClick={() => onChange(Math.min(max, value + 1))}
        style={{ width: 34, height: 34, borderRadius: '50%', border: '1px solid #d1d5db', background: '#fff', cursor: 'pointer', fontSize: 18, color: '#374151', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        +
      </button>
    </div>
  );
}

// ── Section card wrapper ───────────────────────────────────────────────────
function Section({ title, children }) {
  return (
    <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', padding: '24px 28px', marginBottom: 16 }}>
      <h2 style={{ fontSize: 16, fontWeight: 700, color: '#111', margin: '0 0 20px' }}>{title}</h2>
      {children}
    </div>
  );
}

const labelStyle = { display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 };
const inputStyle = {
  width: '100%', border: '1px solid #d1d5db', borderRadius: 8,
  padding: '10px 14px', fontSize: 14, color: '#111', outline: 'none', boxSizing: 'border-box',
};

// ── Main page ──────────────────────────────────────────────────────────────
export default function CreateListingPage() {
  const navigate = useNavigate();
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

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  // Compute bathroom : tenant ratio
  const bathPerTenant = form.tenants > 0
    ? (form.bathrooms / form.tenants).toFixed(2).replace(/\.?0+$/, '')
    : '—';
  const ratioLabel = form.tenants === 1
    ? `${form.bathrooms} bathroom${form.bathrooms > 1 ? 's' : ''} for 1 person`
    : `${form.bathrooms} bathroom${form.bathrooms > 1 ? 's' : ''} for ${form.tenants} people (${bathPerTenant} per person)`;
  const ratioColor = (form.bathrooms / form.tenants) >= 1 ? '#059669' : (form.bathrooms / form.tenants) >= 0.5 ? '#d97706' : '#dc2626';

  // ── File upload: opens native file picker ──────────────────────────────
  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    // Client-side validation before sending to the secure upload endpoint
    const MAX_MB = 5;
    const ALLOWED = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    for (const f of files) {
      if (!ALLOWED.includes(f.type)) {
        setError(`"${f.name}" is not an allowed image type (JPG, PNG, WEBP, GIF only)`);
        return;
      }
      if (f.size > MAX_MB * 1024 * 1024) {
        setError(`"${f.name}" exceeds the ${MAX_MB}MB size limit`);
        return;
      }
    }

    setUploading(true);
    setError('');
    try {
      const formData = new FormData();
      files.forEach(f => formData.append('images', f));
      const res = await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      set('images', [...form.images, ...res.data.urls]);
    } catch (err) {
      setError(err.response?.data?.error || 'Upload failed. Try again.');
    } finally {
      setUploading(false);
      // Reset so the same file can be re-selected after an error
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
    try {
      const res = await api.post('/listings', {
        ...form,
        rent: Number(form.rent),
        bond: form.bond ? Number(form.bond) : null,
        bedrooms: Number(form.bedrooms),
        bathrooms: Number(form.bathrooms),
        tenants: Number(form.tenants),
      });
      navigate(`/listings/${res.data.id}`);
    } catch (err) {
      setError(err.response?.data?.error || Object.values(err.response?.data?.errors || {}).join(', ') || 'Failed to create listing');
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5', padding: '32px 20px' }}>
      <div style={{ maxWidth: 680, margin: '0 auto' }}>
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: '#111', margin: '0 0 6px' }}>List your lease</h1>
          <p style={{ color: '#6b7280', fontSize: 15, margin: 0 }}>Fill in the details to post your lease transfer listing</p>
        </div>

        {error && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', borderRadius: 10, padding: '12px 16px', fontSize: 14, marginBottom: 16 }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>

          {/* Basic Info */}
          <Section title="Basic information">
            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Listing title *</label>
              <input value={form.title} onChange={e => set('title', e.target.value)}
                placeholder="e.g. Modern 2BR Apartment Near Melbourne Uni"
                required style={inputStyle}
                onFocus={e => e.target.style.borderColor = '#0ea5e9'}
                onBlur={e => e.target.style.borderColor = '#d1d5db'} />
            </div>
            <div>
              <label style={labelStyle}>Description</label>
              <textarea value={form.description} onChange={e => set('description', e.target.value)}
                rows={5} placeholder="Describe the property, its features, why you're transferring your lease..."
                style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.5 }}
                onFocus={e => e.target.style.borderColor = '#0ea5e9'}
                onBlur={e => e.target.style.borderColor = '#d1d5db'} />
            </div>
          </Section>

          {/* Location with autocomplete */}
          <Section title="Location">
            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Search address</label>
              <AddressAutocomplete
                value={form.address}
                onChange={(val) => set('address', val)}
                onSelect={({ address, suburb, city, state }) => {
                  setForm(f => ({ ...f, address, suburb, city: city || f.city, state: state || f.state }));
                }}
              />
              <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 5 }}>
                Start typing — Australian addresses will appear as suggestions
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
              <div>
                <label style={labelStyle}>Suburb</label>
                <input value={form.suburb} onChange={e => set('suburb', e.target.value)}
                  placeholder="e.g. Carlton" style={inputStyle}
                  onFocus={e => e.target.style.borderColor = '#0ea5e9'}
                  onBlur={e => e.target.style.borderColor = '#d1d5db'} />
              </div>
              <div>
                <label style={labelStyle}>City</label>
                <input value={form.city} onChange={e => set('city', e.target.value)}
                  placeholder="e.g. Melbourne" style={inputStyle}
                  onFocus={e => e.target.style.borderColor = '#0ea5e9'}
                  onBlur={e => e.target.style.borderColor = '#d1d5db'} />
              </div>
            </div>

            <div>
              <label style={labelStyle}>Nearby university</label>
              <input value={form.nearbyUni} onChange={e => set('nearbyUni', e.target.value)}
                placeholder="e.g. University of Melbourne" style={inputStyle}
                onFocus={e => e.target.style.borderColor = '#0ea5e9'}
                onBlur={e => e.target.style.borderColor = '#d1d5db'} />
            </div>
          </Section>

          {/* Pricing */}
          <Section title="Pricing">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={labelStyle}>Rent per week *</label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', fontSize: 14 }}>$</span>
                  <input type="number" value={form.rent} onChange={e => set('rent', e.target.value)}
                    placeholder="350" min="0" required
                    style={{ ...inputStyle, paddingLeft: 26 }}
                    onFocus={e => e.target.style.borderColor = '#0ea5e9'}
                    onBlur={e => e.target.style.borderColor = '#d1d5db'} />
                </div>
              </div>
              <div>
                <label style={labelStyle}>Bond</label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', fontSize: 14 }}>$</span>
                  <input type="number" value={form.bond} onChange={e => set('bond', e.target.value)}
                    placeholder="1400" min="0"
                    style={{ ...inputStyle, paddingLeft: 26 }}
                    onFocus={e => e.target.style.borderColor = '#0ea5e9'}
                    onBlur={e => e.target.style.borderColor = '#d1d5db'} />
                </div>
              </div>
            </div>
          </Section>

          {/* Availability */}
          <Section title="Availability">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={labelStyle}>Available from</label>
                <input type="date" value={form.availableFrom} onChange={e => set('availableFrom', e.target.value)}
                  style={inputStyle}
                  onFocus={e => e.target.style.borderColor = '#0ea5e9'}
                  onBlur={e => e.target.style.borderColor = '#d1d5db'} />
              </div>
              <div>
                <label style={labelStyle}>Lease ends</label>
                <input type="date" value={form.availableTo} onChange={e => set('availableTo', e.target.value)}
                  style={inputStyle}
                  onFocus={e => e.target.style.borderColor = '#0ea5e9'}
                  onBlur={e => e.target.style.borderColor = '#d1d5db'} />
              </div>
            </div>
          </Section>

          {/* Property Details */}
          <Section title="Property details">
            <div style={{ marginBottom: 20 }}>
              <label style={labelStyle}>Property type</label>
              <select value={form.type} onChange={e => set('type', e.target.value)}
                style={{ ...inputStyle, background: '#fff', cursor: 'pointer' }}>
                <option value="apartment">Apartment</option>
                <option value="house">House / Townhouse</option>
                <option value="studio">Studio</option>
                <option value="student_accom">Student Accommodation</option>
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, marginBottom: 20 }}>
              <div>
                <label style={labelStyle}>Bedrooms</label>
                <Counter value={form.bedrooms} onChange={v => set('bedrooms', v)} />
              </div>
              <div>
                <label style={labelStyle}>Bathrooms</label>
                <Counter value={form.bathrooms} onChange={v => set('bathrooms', v)} />
              </div>
              <div>
                <label style={labelStyle}>Total tenants</label>
                <Counter value={form.tenants} onChange={v => set('tenants', v)} max={50} />
              </div>
            </div>

            {/* Live bathroom : tenant ratio */}
            <div style={{ background: '#f9fafb', borderRadius: 8, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
              <span style={{ fontSize: 16 }}>🚿</span>
              <span style={{ fontSize: 13, color: ratioColor, fontWeight: 600 }}>{ratioLabel}</span>
            </div>

            <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
              <div
                onClick={() => set('furnished', !form.furnished)}
                style={{ width: 44, height: 24, borderRadius: 12, background: form.furnished ? '#0ea5e9' : '#d1d5db', position: 'relative', transition: 'background 0.2s', cursor: 'pointer', flexShrink: 0 }}
              >
                <div style={{ position: 'absolute', top: 3, left: form.furnished ? 23 : 3, width: 18, height: 18, borderRadius: '50%', background: '#fff', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
              </div>
              <span style={{ fontSize: 14, fontWeight: 600, color: '#374151' }}>Furnished</span>
            </label>
          </Section>

          {/* Photos — real file picker */}
          <Section title="Photos">
            {/* Hidden native file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              multiple
              style={{ display: 'none' }}
              onChange={handleFileChange}
            />

            {/* Upload button — triggers the native file picker */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              style={{
                width: '100%', border: '2px dashed #d1d5db', borderRadius: 10,
                padding: '28px 20px', textAlign: 'center', cursor: uploading ? 'not-allowed' : 'pointer',
                background: uploading ? '#f9fafb' : '#fafafa', transition: 'border-color 0.15s',
                marginBottom: form.images.length > 0 ? 16 : 0,
              }}
              onMouseEnter={e => !uploading && (e.currentTarget.style.borderColor = '#0ea5e9')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = '#d1d5db')}
            >
              {uploading ? (
                <div>
                  <div style={{ fontSize: 28, marginBottom: 8 }}>⏳</div>
                  <div style={{ fontSize: 14, color: '#6b7280', fontWeight: 600 }}>Uploading…</div>
                </div>
              ) : (
                <div>
                  <div style={{ fontSize: 32, marginBottom: 8 }}>📷</div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#111', marginBottom: 4 }}>Click to upload photos</div>
                  <div style={{ fontSize: 13, color: '#9ca3af' }}>JPG, PNG, WEBP or GIF · Max 5MB each · Up to 10 photos</div>
                </div>
              )}
            </button>

            {/* Image previews */}
            {form.images.length > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                {form.images.map((url, i) => (
                  <div key={i} style={{ position: 'relative', borderRadius: 8, overflow: 'hidden', height: 100, background: '#f3f4f6' }}>
                    <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <button
                      type="button"
                      onClick={() => removeImage(i)}
                      style={{ position: 'absolute', top: 5, right: 5, background: 'rgba(0,0,0,0.6)', color: '#fff', border: 'none', borderRadius: '50%', width: 22, height: 22, cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </Section>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%', background: loading ? '#93c5fd' : '#0ea5e9', color: '#fff',
              border: 'none', borderRadius: 10, padding: '14px', fontWeight: 700,
              fontSize: 16, cursor: loading ? 'not-allowed' : 'pointer', marginTop: 8,
            }}
          >
            {loading ? 'Publishing…' : 'Publish listing'}
          </button>
        </form>
      </div>
    </div>
  );
}
