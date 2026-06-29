import { Link } from 'react-router-dom';
import { t, typeLabels } from '../theme';

const chip = (bg, color) => ({ fontSize: 11.5, fontWeight: 700, color, background: bg, borderRadius: t.pill, padding: '3px 11px', display: 'inline-block' });

export default function ListingCard({ listing, horizontal = false }) {
  const image = listing.images?.[0] || `https://picsum.photos/seed/${listing.id}/800/500`;

  if (horizontal) {
    return (
      <Link to={`/listings/${listing.id}`} style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
        <div className="lift" style={{ background: t.card, borderRadius: t.radius, overflow: 'hidden', marginBottom: 16, display: 'flex', border: `1px solid ${t.border}`, boxShadow: t.shadowSm }}>
          <div style={{ width: 250, minWidth: 250, height: 200, position: 'relative', overflow: 'hidden', background: t.creamDeep, flexShrink: 0 }}>
            <img src={image} alt={listing.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              onError={e => { e.target.src = `https://picsum.photos/seed/${listing.id}b/800/500`; }} />
          </div>

          <div style={{ flex: 1, padding: '20px 24px', display: 'flex', justifyContent: 'space-between', gap: 16, minWidth: 0 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <span style={chip(t.coralTint, t.coralDeep)}>{typeLabels[listing.type] || listing.type}</span>
                {listing.furnished && <span style={chip(t.sageTint, t.sage)}>Furnished</span>}
              </div>

              <h3 className="font-display" style={{ fontSize: 20, fontWeight: 700, color: t.ink, margin: '0 0 4px', lineHeight: 1.2 }}>{listing.title}</h3>
              <div style={{ fontSize: 13.5, color: t.inkSoft, marginBottom: 12 }}>{listing.suburb}, {listing.city}</div>

              <div style={{ display: 'flex', gap: 16, fontSize: 13.5, color: t.ink, fontWeight: 600 }}>
                <span>🛏 {listing.bedrooms} bed</span>
                <span>🚿 {listing.bathrooms} bath</span>
                {listing.tenants > 1 && <span style={{ color: t.plum }}>👥 {listing.tenants} tenants</span>}
              </div>

              {listing.nearbyUni && (
                <div style={{ marginTop: 12 }}><span style={chip(t.plumTint, t.plum)}>🎓 {listing.nearbyUni}</span></div>
              )}

              {listing.availableFrom && (
                <div style={{ marginTop: 10, fontSize: 12.5, color: t.inkSoft }}>
                  Available {listing.availableFrom}{listing.availableTo ? ` → ${listing.availableTo}` : ''}
                </div>
              )}
            </div>

            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <div style={{ fontSize: 24, fontWeight: 800, color: t.ink, whiteSpace: 'nowrap' }}>${listing.rent?.toLocaleString()}</div>
              <div style={{ fontSize: 12.5, color: t.inkSoft }}>per week</div>
              {listing.bond && <div style={{ fontSize: 12.5, color: t.inkSoft, marginTop: 4 }}>Bond ${listing.bond?.toLocaleString()}</div>}
              <div style={{ marginTop: 18 }}>
                <span className="btn btn-coral" style={{ fontSize: 13, padding: '9px 20px' }}>View listing</span>
              </div>
            </div>
          </div>
        </div>
      </Link>
    );
  }

  // Vertical card
  return (
    <Link to={`/listings/${listing.id}`} style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
      <div className="lift" style={{ background: t.card, borderRadius: t.radius, overflow: 'hidden', border: `1px solid ${t.border}`, boxShadow: t.shadowSm }}>
        <div style={{ position: 'relative', height: 200, overflow: 'hidden', background: t.creamDeep }}>
          <img src={image} alt={listing.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            onError={e => { e.target.src = `https://picsum.photos/seed/${listing.id}b/800/500`; }} />
          <div style={{ position: 'absolute', top: 12, left: 12, background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(4px)', borderRadius: t.pill, padding: '4px 12px', fontSize: 11.5, fontWeight: 700, color: t.ink }}>
            {typeLabels[listing.type] || listing.type}
          </div>
          {listing.furnished && (
            <div style={{ position: 'absolute', top: 12, right: 12, background: t.sage, borderRadius: t.pill, padding: '4px 12px', fontSize: 11.5, fontWeight: 700, color: '#fff' }}>Furnished</div>
          )}
        </div>
        <div style={{ padding: '16px 18px 18px' }}>
          <h3 className="font-display" style={{ fontSize: 18, fontWeight: 700, color: t.ink, margin: '0 0 4px', lineHeight: 1.25 }}>{listing.title}</h3>
          <div style={{ fontSize: 13, color: t.inkSoft, marginBottom: 12 }}>{listing.suburb}, {listing.city}</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: 14, fontSize: 13.5, color: t.ink, fontWeight: 600 }}>
              <span>🛏 {listing.bedrooms}</span>
              <span>🚿 {listing.bathrooms}</span>
            </div>
            <div>
              <span style={{ fontSize: 20, fontWeight: 800, color: t.ink }}>${listing.rent}</span>
              <span style={{ fontSize: 12.5, color: t.inkSoft }}>pw</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
