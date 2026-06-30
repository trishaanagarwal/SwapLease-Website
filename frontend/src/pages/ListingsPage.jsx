import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import ListingCard from '../components/ListingCard';
import { t } from '../theme';
import { Search } from 'lucide-react';

const TYPES = [
  { value: '', label: 'All types' },
  { value: 'apartment', label: 'Apartment' },
  { value: 'house', label: 'House' },
  { value: 'studio', label: 'Studio' },
  { value: 'student_accom', label: 'Student accom' },
];

const SUBURBS = ['Carlton', 'Fitzroy', 'Southbank', 'Parkville', 'Brunswick', 'Clayton', 'Richmond', 'St Kilda', 'Docklands', 'Footscray', 'Hawthorn', 'Box Hill'];

export default function ListingsPage() {
  const [searchParams] = useSearchParams();
  const [allListings, setAllListings] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [searchInput, setSearchInput] = useState(searchParams.get('search') || '');
  const [type, setType] = useState('');
  const [maxRent, setMaxRent] = useState(2000);
  const [minBeds, setMinBeds] = useState(0);
  const [furnished, setFurnished] = useState(false);
  const [sort, setSort] = useState('newest');
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 8;

  useEffect(() => {
    setLoading(true);
    getDocs(query(collection(db, 'listings'), where('status', '==', 'active'), orderBy('createdAt', 'desc')))
      .then(snap => setAllListings(snap.docs.map(d => ({ id: d.id, ...d.data() }))))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // Reset to first page whenever the result set changes.
  useEffect(() => { setPage(1); }, [type, maxRent, minBeds, furnished, sort, search]);

  const listings = allListings
    .filter(l => {
      if (type && l.type !== type) return false;
      if (maxRent < 2000 && l.rent > maxRent) return false;
      if (minBeds > 0 && (l.bedrooms || 0) < minBeds) return false;
      if (furnished && !l.furnished) return false;
      if (search) {
        const s = search.toLowerCase();
        const searchable = [l.title, l.suburb, l.city, l.description, l.nearbyUni].filter(Boolean).join(' ').toLowerCase();
        if (!searchable.includes(s)) return false;
      }
      return true;
    })
    .sort((a, b) => {
      if (sort === 'cheapest') return (a.rent || 0) - (b.rent || 0);
      if (sort === 'expensive') return (b.rent || 0) - (a.rent || 0);
      if (sort === 'beds') return (b.bedrooms || 0) - (a.bedrooms || 0);
      return 0;
    });

  const visible = listings.slice(0, page * PAGE_SIZE);
  const hasMore = visible.length < listings.length;

  const inputStyle = { border: `1.5px solid ${t.borderStrong}`, borderRadius: 12, padding: '9px 13px', fontSize: 14, color: t.ink, background: '#fff', outline: 'none', width: '100%', fontFamily: 'inherit' };
  const labelStyle = { display: 'block', fontSize: 12.5, fontWeight: 700, color: t.ink, marginBottom: 8 };

  const clearAll = () => { setType(''); setFurnished(false); setMaxRent(2000); setMinBeds(0); setSearch(''); setSearchInput(''); };

  return (
    <div style={{ minHeight: '100vh', background: t.cream }}>

      <div style={{ position: 'relative', overflow: 'hidden', background: t.ink, padding: '46px 22px 30px' }}>
        <div className="blob" style={{ width: 360, height: 360, background: t.navy, top: -150, left: -60, opacity: 0.55 }} />
        <div className="blob" style={{ width: 320, height: 320, background: t.green, top: -120, right: -80, opacity: 0.5 }} />
        <div style={{ maxWidth: 1200, margin: '0 auto', position: 'relative' }}>
          <h1 className="font-display" style={{ fontSize: 'clamp(28px, 4vw, 40px)', fontWeight: 800, color: '#fff', margin: '0 0 6px' }}>Browse student leases</h1>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 15, margin: '0 0 22px' }}>Find your next home across Melbourne, direct from students.</p>
          <form onSubmit={e => { e.preventDefault(); setSearch(searchInput); }} style={{ display: 'flex', gap: 8, maxWidth: 600, background: '#fff', borderRadius: t.pill, padding: 6, boxShadow: t.shadow }}>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, paddingLeft: 14 }}>
              <Search size={18} color={t.inkFaint} />
              <input type="text" placeholder="Search suburb, street or university…"
                value={searchInput} onChange={e => setSearchInput(e.target.value)}
                style={{ flex: 1, border: 'none', outline: 'none', padding: '9px 4px', fontSize: 14.5, background: 'transparent', color: t.ink, fontFamily: 'inherit' }} />
            </div>
            <button type="submit" className="btn btn-coral" style={{ padding: '9px 24px', fontSize: 14.5 }}>Search</button>
          </form>
        </div>
      </div>

      <div className="listings-wrap" style={{ maxWidth: 1200, margin: '0 auto', padding: '26px 22px', display: 'flex', gap: 26, alignItems: 'flex-start' }}>

        <aside className="listings-aside" style={{ width: 230, flexShrink: 0, background: '#fff', borderRadius: t.radius, border: `1px solid ${t.border}`, padding: 22, boxShadow: t.shadowSm }}>
          <h3 className="font-display" style={{ fontSize: 18, fontWeight: 700, color: t.ink, margin: '0 0 20px' }}>Filters</h3>

          <div style={{ marginBottom: 20 }}>
            <label style={labelStyle}>Property type</label>
            {TYPES.map(opt => (
              <label key={opt.value} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 9, cursor: 'pointer', fontSize: 14, color: type === opt.value ? t.coralDeep : t.inkSoft, fontWeight: type === opt.value ? 700 : 500 }}>
                <input type="radio" name="type" value={opt.value} checked={type === opt.value} onChange={() => setType(opt.value)} style={{ accentColor: t.coral }} />
                {opt.label}
              </label>
            ))}
          </div>

          <div style={{ borderTop: `1px solid ${t.border}`, paddingTop: 20, marginBottom: 20 }}>
            <label style={labelStyle}>Max rent: {maxRent === 2000 ? 'Any' : `$${maxRent}/wk`}</label>
            <input type="range" min={100} max={2000} step={50} value={maxRent} onChange={e => setMaxRent(Number(e.target.value))} style={{ width: '100%', accentColor: t.coral }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: t.inkFaint, marginTop: 4 }}>
              <span>$100</span><span>$2000+</span>
            </div>
          </div>

          <div style={{ borderTop: `1px solid ${t.border}`, paddingTop: 20, marginBottom: 20 }}>
            <label style={labelStyle}>Bedrooms</label>
            <div style={{ display: 'flex', gap: 6 }}>
              {[0, 1, 2, 3, 4].map(n => (
                <button key={n} onClick={() => setMinBeds(n)}
                  style={{ flex: 1, background: minBeds === n ? t.coral : '#fff', color: minBeds === n ? '#fff' : t.inkSoft, border: `1.5px solid ${minBeds === n ? t.coral : t.border}`, borderRadius: 10, padding: '7px 0', fontSize: 13, cursor: 'pointer', fontWeight: 700, fontFamily: 'inherit' }}>
                  {n === 0 ? 'Any' : `${n}+`}
                </button>
              ))}
            </div>
          </div>

          <div style={{ borderTop: `1px solid ${t.border}`, paddingTop: 20, marginBottom: 20 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 14, color: t.inkSoft, fontWeight: 600 }}>
              <input type="checkbox" checked={furnished} onChange={e => setFurnished(e.target.checked)} style={{ accentColor: t.coral, width: 16, height: 16 }} />
              Furnished only
            </label>
          </div>

          <div style={{ borderTop: `1px solid ${t.border}`, paddingTop: 20 }}>
            <label style={labelStyle}>Sort by</label>
            <select value={sort} onChange={e => setSort(e.target.value)} style={inputStyle}>
              <option value="newest">Newest first</option>
              <option value="cheapest">Cheapest first</option>
              <option value="expensive">Most expensive</option>
              <option value="beds">Most bedrooms</option>
            </select>
          </div>

          {(type || furnished || maxRent < 2000 || minBeds > 0 || search) && (
            <button onClick={clearAll}
              style={{ marginTop: 16, background: 'none', border: `1.5px solid ${t.borderStrong}`, borderRadius: t.pill, padding: '8px 14px', fontSize: 13, color: t.inkSoft, cursor: 'pointer', width: '100%', fontWeight: 600, fontFamily: 'inherit' }}>
              Clear filters
            </button>
          )}
        </aside>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 18 }}>
            {SUBURBS.map(s => (
              <button key={s} onClick={() => { setSearch(s); setSearchInput(s); }}
                style={{ background: search === s ? t.coral : '#fff', color: search === s ? '#fff' : t.inkSoft, border: `1.5px solid ${search === s ? t.coral : t.border}`, borderRadius: t.pill, padding: '6px 15px', fontSize: 13, cursor: 'pointer', fontWeight: search === s ? 700 : 600, fontFamily: 'inherit' }}>
                {s}
              </button>
            ))}
          </div>

          <div style={{ fontSize: 14.5, color: t.inkSoft, marginBottom: 18, fontWeight: 600 }}>
            {loading ? 'Searching…' : `${listings.length} ${listings.length === 1 ? 'listing' : 'listings'} found`}
          </div>

          {loading ? (
            <div>
              {[...Array(4)].map((_, i) => (
                <div key={i} className="skeleton" style={{ borderRadius: t.radius, height: 200, marginBottom: 16 }} />
              ))}
            </div>
          ) : listings.length > 0 ? (
            <>
              <div>{visible.map(l => <ListingCard key={l.id} listing={l} horizontal />)}</div>
              {hasMore && (
                <div style={{ textAlign: 'center', marginTop: 12 }}>
                  <button onClick={() => setPage(p => p + 1)} className="btn btn-soft" style={{ padding: '12px 30px', fontSize: 14.5 }}>
                    Load more ({listings.length - visible.length} more)
                  </button>
                </div>
              )}
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: '80px 20px', background: '#fff', borderRadius: t.radiusLg, border: `1px solid ${t.border}` }}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16, color: t.inkFaint }}><Search size={44} /></div>
              <h3 className="font-display" style={{ fontSize: 21, fontWeight: 700, color: t.ink, marginBottom: 8 }}>No listings found</h3>
              <p style={{ color: t.inkSoft, fontSize: 14.5, marginBottom: 18 }}>Try a different search or clear your filters</p>
              <button onClick={clearAll} className="btn btn-coral" style={{ padding: '11px 26px', fontSize: 14.5 }}>Clear all</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
