import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../api/axios';
import ListingCard from '../components/ListingCard';

const TYPES = [
  { value: '', label: 'All types' },
  { value: 'apartment', label: 'Apartment' },
  { value: 'house', label: 'House' },
  { value: 'studio', label: 'Studio' },
  { value: 'student_accom', label: 'Student accom' },
];

export default function ListingsPage() {
  const [searchParams] = useSearchParams();
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [type, setType] = useState('');
  const [maxRent, setMaxRent] = useState(2000);
  const [furnished, setFurnished] = useState(false);
  const [sort, setSort] = useState('newest');

  const fetchListings = () => {
    setLoading(true);
    const params = {};
    if (search) params.search = search;
    if (type) params.type = type;
    if (maxRent < 2000) params.maxRent = maxRent;
    if (furnished) params.furnished = 'true';
    if (sort) params.sort = sort;
    api.get('/listings', { params })
      .then(res => setListings(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchListings(); }, [type, maxRent, furnished, sort]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchListings();
  };

  const inputStyle = {
    border: '1px solid #d1d5db', borderRadius: 8, padding: '8px 12px', fontSize: 14,
    color: '#374151', background: '#fff', outline: 'none', width: '100%',
  };

  const labelStyle = { display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 };

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5' }}>

      {/* Top search bar */}
      <div style={{ background: '#fff', borderBottom: '1px solid #e5e7eb', padding: '14px 20px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <form onSubmit={handleSearch} style={{ display: 'flex', gap: 8, maxWidth: 600 }}>
            <input
              type="text"
              placeholder="Search Melbourne suburb, street or university..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ ...inputStyle, flex: 1, padding: '9px 14px' }}
            />
            <button type="submit" style={{ background: '#0ea5e9', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 22px', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
              Search
            </button>
          </form>
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 20px', display: 'flex', gap: 24, alignItems: 'flex-start' }}>

        {/* Sidebar filters */}
        <aside style={{ width: 220, flexShrink: 0, background: '#fff', borderRadius: 10, border: '1px solid #e5e7eb', padding: 20 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: '#111', margin: '0 0 20px' }}>Filters</h3>

          <div style={{ marginBottom: 20 }}>
            <label style={labelStyle}>Property type</label>
            {TYPES.map(t => (
              <label key={t.value} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, cursor: 'pointer', fontSize: 14, color: type === t.value ? '#0ea5e9' : '#374151', fontWeight: type === t.value ? 600 : 400 }}>
                <input
                  type="radio"
                  name="type"
                  value={t.value}
                  checked={type === t.value}
                  onChange={() => setType(t.value)}
                  style={{ accentColor: '#0ea5e9' }}
                />
                {t.label}
              </label>
            ))}
          </div>

          <div style={{ borderTop: '1px solid #f3f4f6', paddingTop: 20, marginBottom: 20 }}>
            <label style={labelStyle}>Max rent: ${maxRent === 2000 ? 'Any' : `${maxRent}/wk`}</label>
            <input
              type="range" min={100} max={2000} step={50}
              value={maxRent}
              onChange={e => setMaxRent(Number(e.target.value))}
              style={{ width: '100%', accentColor: '#0ea5e9' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#9ca3af', marginTop: 4 }}>
              <span>$100</span><span>$2000+</span>
            </div>
          </div>

          <div style={{ borderTop: '1px solid #f3f4f6', paddingTop: 20, marginBottom: 20 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 14, color: '#374151' }}>
              <input
                type="checkbox"
                checked={furnished}
                onChange={e => setFurnished(e.target.checked)}
                style={{ accentColor: '#0ea5e9', width: 16, height: 16 }}
              />
              Furnished only
            </label>
          </div>

          <div style={{ borderTop: '1px solid #f3f4f6', paddingTop: 20 }}>
            <label style={labelStyle}>Sort by</label>
            <select value={sort} onChange={e => setSort(e.target.value)} style={{ ...inputStyle }}>
              <option value="newest">Newest first</option>
              <option value="cheapest">Cheapest first</option>
              <option value="expensive">Most expensive</option>
            </select>
          </div>

          {(type || furnished || maxRent < 2000) && (
            <button
              onClick={() => { setType(''); setFurnished(false); setMaxRent(2000); }}
              style={{ marginTop: 16, background: 'none', border: '1px solid #e5e7eb', borderRadius: 8, padding: '7px 14px', fontSize: 13, color: '#6b7280', cursor: 'pointer', width: '100%' }}
            >
              Clear filters
            </button>
          )}
        </aside>

        {/* Listings */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Melbourne suburb quick-picks */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
            {['Carlton', 'Fitzroy', 'Southbank', 'Parkville', 'Brunswick', 'Clayton', 'Richmond', 'St Kilda', 'Docklands', 'Footscray', 'Hawthorn', 'Box Hill'].map(s => (
              <button key={s} onClick={() => { setSearch(s); fetchListings(); }}
                style={{ background: search === s ? '#0ea5e9' : '#fff', color: search === s ? '#fff' : '#374151', border: `1px solid ${search === s ? '#0ea5e9' : '#e5e7eb'}`, borderRadius: 20, padding: '5px 14px', fontSize: 13, cursor: 'pointer', fontWeight: search === s ? 600 : 400 }}>
                {s}
              </button>
            ))}
          </div>

          <div style={{ fontSize: 14, color: '#6b7280', marginBottom: 16 }}>
            {loading ? 'Searching...' : `${listings.length} ${listings.length === 1 ? 'listing' : 'listings'} found`}
          </div>

          {loading ? (
            <div>
              {[...Array(5)].map((_, i) => (
                <div key={i} style={{ background: '#fff', borderRadius: 10, height: 180, marginBottom: 12, border: '1px solid #e5e7eb', animation: 'pulse 1.5s ease-in-out infinite' }} />
              ))}
            </div>
          ) : listings.length > 0 ? (
            <div>
              {listings.map(l => <ListingCard key={l.id} listing={l} horizontal />)}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '80px 20px', background: '#fff', borderRadius: 10, border: '1px solid #e5e7eb' }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: '#111', marginBottom: 8 }}>No listings found</h3>
              <p style={{ color: '#6b7280', fontSize: 14, marginBottom: 16 }}>Try a different search or clear your filters</p>
              <button
                onClick={() => { setSearch(''); setType(''); setMaxRent(2000); setFurnished(false); }}
                style={{ background: '#0ea5e9', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 24px', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}
              >
                Clear all
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
