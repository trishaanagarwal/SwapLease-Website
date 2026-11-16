import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import ListingCard from '../components/ListingCard';
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
  const [showFilters, setShowFilters] = useState(false); // phones: filters fold away above the results
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

  const clearAll = () => { setType(''); setFurnished(false); setMaxRent(2000); setMinBeds(0); setSearch(''); setSearchInput(''); };
  const filtered = type || furnished || maxRent < 2000 || minBeds > 0 || search;

  return (
    <div className="wrap page">
      <header className="page-head">
        <div>
          <h1>Student leases in Melbourne</h1>
          <p>Places students are handing over, with the weekly rent, the dates and the nearest uni.</p>
        </div>
      </header>

      <form className="search-row" role="search" onSubmit={e => { e.preventDefault(); setSearch(searchInput); }}>
        <label className="field-icon" style={{ flex: 1 }}>
          <Search size={18} aria-hidden="true" />
          <input className="field" type="search" aria-label="Search leases" placeholder="Suburb, street or university"
            value={searchInput} onChange={e => setSearchInput(e.target.value)} />
        </label>
        <button type="submit" className="btn btn--primary">Search leases</button>
      </form>

      <div className="chips chips--scroll" style={{ margin: 'var(--s-5) 0 var(--s-7)' }}>
        {SUBURBS.map(s => (
          <button key={s} type="button" className="chip-btn" aria-pressed={search === s}
            onClick={() => { const next = search === s ? '' : s; setSearch(next); setSearchInput(next); }}>{s}</button>
        ))}
      </div>

      <div className="browse">
        <aside className="sheet sheet--pad browse__filters" aria-label="Filters" data-open={showFilters}>
          <button type="button" className="btn btn--secondary btn--block btn--plain browse__toggle" aria-expanded={showFilters} onClick={() => setShowFilters(o => !o)}>
            {showFilters ? 'Hide filters' : 'Filters and sort'}
          </button>
          <div className="form-grid browse__body">
            <fieldset className="plain">
              <legend className="label">Property type</legend>
              {TYPES.map(opt => (
                <label key={opt.value} className="check">
                  <input type="radio" name="type" value={opt.value} checked={type === opt.value} onChange={() => setType(opt.value)} />
                  {opt.label}
                </label>
              ))}
            </fieldset>

            <div>
              <label className="label" htmlFor="max-rent">Max rent: {maxRent === 2000 ? 'any' : `$${maxRent}/wk`}</label>
              <input id="max-rent" type="range" min={100} max={2000} step={50} value={maxRent} onChange={e => setMaxRent(Number(e.target.value))} />
              <div className="t-small muted" style={{ display: 'flex', justifyContent: 'space-between' }}><span>$100</span><span>$2000+</span></div>
            </div>

            <fieldset className="plain">
              <legend className="label">Bedrooms</legend>
              <div className="chips chips--fill">
                {[0, 1, 2, 3, 4].map(n => (
                  <button key={n} type="button" className="chip-btn" aria-pressed={minBeds === n} onClick={() => setMinBeds(n)}>{n === 0 ? 'Any' : `${n}+`}</button>
                ))}
              </div>
            </fieldset>

            <label className="check">
              <input type="checkbox" checked={furnished} onChange={e => setFurnished(e.target.checked)} />
              Furnished only
            </label>

            <div>
              <label className="label" htmlFor="sort">Sort by</label>
              <select id="sort" className="field" value={sort} onChange={e => setSort(e.target.value)}>
                <option value="newest">Newest first</option>
                <option value="cheapest">Cheapest first</option>
                <option value="expensive">Most expensive</option>
                <option value="beds">Most bedrooms</option>
              </select>
            </div>

            {filtered && <button type="button" className="btn btn--secondary" onClick={clearAll}>Clear filters</button>}
          </div>
        </aside>

        <div>
          <p className="t-small muted" style={{ marginBottom: 'var(--s-4)' }} aria-live="polite">
            {loading ? 'Loading leases' : `${listings.length} ${listings.length === 1 ? 'lease' : 'leases'}`}
          </p>

          {loading ? (
            <div className="stack-list">{[...Array(3)].map((_, i) => <div key={i} className="skeleton" style={{ height: 220 }} />)}</div>
          ) : listings.length > 0 ? (
            <>
              <div className="stack-list">{visible.map(l => <ListingCard key={l.id} listing={l} horizontal />)}</div>
              {hasMore && (
                <div style={{ marginTop: 'var(--s-6)' }}>
                  <button type="button" onClick={() => setPage(p => p + 1)} className="btn btn--secondary">Show {Math.min(PAGE_SIZE, listings.length - visible.length)} more leases</button>
                </div>
              )}
            </>
          ) : (
            <div className="empty">
              <h3>No leases match</h3>
              <p>Try another suburb, raise the rent limit or clear the filters.</p>
              <button type="button" onClick={clearAll} className="btn btn--primary">Clear filters</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
