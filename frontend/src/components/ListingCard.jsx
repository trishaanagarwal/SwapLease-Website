import { Link } from 'react-router-dom';

const typeLabels = { apartment: 'Apartment', house: 'House', studio: 'Studio', student_accom: 'Student Accom' };

// horizontal = true → flatmates-style wide card (listings page)
// horizontal = false → square card (home page grid)
export default function ListingCard({ listing, horizontal = false }) {
  const image = listing.images?.[0] || `https://picsum.photos/seed/${listing.id}/800/500`;

  if (horizontal) {
    return (
      <Link to={`/listings/${listing.id}`} style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
        <div
          style={{ background: '#fff', borderRadius: 10, overflow: 'hidden', marginBottom: 12, display: 'flex', border: '1px solid #e5e7eb', transition: 'box-shadow 0.15s' }}
          onMouseEnter={e => e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.1)'}
          onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
        >
          {/* Image */}
          <div style={{ width: 240, minWidth: 240, height: 180, position: 'relative', overflow: 'hidden', background: '#f3f4f6', flexShrink: 0 }}>
            <img
              src={image}
              alt={listing.title}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              onError={e => { e.target.src = `https://picsum.photos/seed/${listing.id}b/800/500`; }}
            />
          </div>

          {/* Details */}
          <div style={{ flex: 1, padding: '16px 20px', display: 'flex', justifyContent: 'space-between', gap: 16, minWidth: 0 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: '#0ea5e9', background: '#e0f2fe', borderRadius: 20, padding: '2px 10px' }}>
                  {typeLabels[listing.type] || listing.type}
                </span>
                {listing.furnished && (
                  <span style={{ fontSize: 11, fontWeight: 600, color: '#059669', background: '#d1fae5', borderRadius: 20, padding: '2px 10px' }}>Furnished</span>
                )}
              </div>

              <h3 style={{ fontSize: 16, fontWeight: 700, color: '#111', margin: '0 0 4px', lineHeight: 1.3 }}>{listing.title}</h3>
              <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 10 }}>
                {listing.suburb}, {listing.city}
              </div>

              <div style={{ display: 'flex', gap: 16, fontSize: 13, color: '#374151' }}>
                <span>🛏 {listing.bedrooms} bed</span>
                <span>🚿 {listing.bathrooms} bath</span>
                {listing.tenants > 1 && (
                  <span style={{ color: '#7c3aed' }}>👥 {listing.tenants} tenants</span>
                )}
              </div>
              {listing.tenants > 0 && (
                <div style={{ marginTop: 6, fontSize: 11, color: (listing.bathrooms / listing.tenants) >= 0.5 ? '#059669' : '#d97706', fontWeight: 600 }}>
                  🚿 {(listing.bathrooms / listing.tenants % 1 === 0 ? listing.bathrooms / listing.tenants : (listing.bathrooms / listing.tenants).toFixed(1))} bathroom{listing.bathrooms / listing.tenants !== 1 ? 's' : ''} per person
                </div>
              )}

              {listing.nearbyUni && (
                <div style={{ marginTop: 10, fontSize: 12, color: '#7c3aed', background: '#f5f3ff', borderRadius: 20, padding: '3px 10px', display: 'inline-block' }}>
                  🎓 {listing.nearbyUni}
                </div>
              )}

              {listing.availableFrom && (
                <div style={{ marginTop: 8, fontSize: 12, color: '#6b7280' }}>
                  Available {listing.availableFrom}
                  {listing.availableTo ? ` → ${listing.availableTo}` : ''}
                </div>
              )}
            </div>

            {/* Price */}
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#111', whiteSpace: 'nowrap' }}>
                ${listing.rent?.toLocaleString()}
              </div>
              <div style={{ fontSize: 12, color: '#6b7280' }}>per week</div>
              {listing.bond && (
                <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>Bond ${listing.bond?.toLocaleString()}</div>
              )}
              <div style={{ marginTop: 16 }}>
                <span style={{ background: '#0ea5e9', color: '#fff', padding: '7px 18px', borderRadius: 8, fontSize: 13, fontWeight: 600 }}>
                  View listing
                </span>
              </div>
            </div>
          </div>
        </div>
      </Link>
    );
  }

  // Vertical card (home page)
  return (
    <Link to={`/listings/${listing.id}`} style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
      <div
        style={{ background: '#fff', borderRadius: 12, overflow: 'hidden', border: '1px solid #e5e7eb', transition: 'box-shadow 0.15s' }}
        onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.12)'}
        onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
      >
        <div style={{ position: 'relative', height: 190, overflow: 'hidden', background: '#f3f4f6' }}>
          <img
            src={image}
            alt={listing.title}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            onError={e => { e.target.src = `https://picsum.photos/seed/${listing.id}b/800/500`; }}
          />
          <div style={{ position: 'absolute', top: 10, left: 10, background: 'rgba(255,255,255,0.9)', borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 600, color: '#374151' }}>
            {typeLabels[listing.type] || listing.type}
          </div>
        </div>
        <div style={{ padding: '14px 16px 16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 4 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: '#111', margin: 0, lineHeight: 1.3, flex: 1 }}>{listing.title}</h3>
          </div>
          <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 10 }}>{listing.suburb}, {listing.city}</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: 12, fontSize: 13, color: '#374151' }}>
              <span>🛏 {listing.bedrooms}</span>
              <span>🚿 {listing.bathrooms}</span>
            </div>
            <div>
              <span style={{ fontSize: 18, fontWeight: 800, color: '#111' }}>${listing.rent}</span>
              <span style={{ fontSize: 12, color: '#6b7280' }}>pw</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
