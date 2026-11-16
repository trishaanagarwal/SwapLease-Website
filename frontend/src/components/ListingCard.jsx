import { Link } from 'react-router-dom';
import { Bed, Bath, Users, GraduationCap, ImageOff, CalendarDays } from 'lucide-react';
import { typeLabels } from '../theme';
import BookmarkButton from './BookmarkButton';

// Listings created during the launch window carry a permanent founding badge.
const FOUNDING_CUTOFF = new Date('2026-10-01');
const isFounding = (listing) => {
  const ts = listing.createdAt;
  const d = ts?.toDate ? ts.toDate() : ts ? new Date(ts) : null;
  return d && d < FOUNDING_CUTOFF;
};

export function NoPhoto() {
  return <div className="no-photo"><ImageOff size={26} aria-hidden="true" /><span>No photo yet</span></div>;
}

const dates = (l) => l.availableFrom ? `${l.availableFrom}${l.availableTo ? ` to ${l.availableTo}` : ''}` : null;

// One card for every listing: a column on the home page, a wide row (`horizontal`) on Browse.
export default function ListingCard({ listing: l, horizontal = false }) {
  const image = l.images?.[0];
  const where = [l.suburb, l.city].filter(Boolean).join(', ');
  const when = dates(l);

  return (
    <Link to={`/listings/${l.id}`} className={`lcard${horizontal ? ' lcard--row' : ''}`}>
      <div className="lcard__media">
        {image ? <img src={image} alt="" loading="lazy" /> : <NoPhoto />}
        {l.status === 'taken' && <div className="lcard__taken"><span className="pill">Taken</span></div>}
        <div className="lcard__tags">
          <span className="pill">{typeLabels[l.type] || l.type}</span>
          {isFounding(l) && <span className="pill pill--gold">Founding lister</span>}
        </div>
        <div className="lcard__save"><BookmarkButton listingId={l.id} /></div>
      </div>

      <div className="lcard__body">
        <h3 className="lcard__title">{l.title}</h3>
        {where && <p className="lcard__where">{where}</p>}
        <div className="lcard__facts">
          <span><Bed aria-hidden="true" />{l.bedrooms} bed</span>
          <span><Bath aria-hidden="true" />{l.bathrooms} bath</span>
          {l.tenants > 1 && <span><Users aria-hidden="true" />{l.tenants} tenants</span>}
          {when && <span><CalendarDays aria-hidden="true" />{when}</span>}
        </div>
        {(l.furnished || l.renewable || l.onBehalfOf || (horizontal && l.nearbyUni)) && (
          <div className="chips">
            {l.furnished && <span className="pill pill--quiet">Furnished</span>}
            {l.renewable && <span className="pill pill--quiet">Renewable</span>}
            {l.onBehalfOf && <span className="pill pill--quiet">For {l.onBehalfOf}</span>}
            {horizontal && l.nearbyUni && <span className="pill pill--quiet"><GraduationCap aria-hidden="true" />{l.nearbyUni}</span>}
          </div>
        )}

        {horizontal ? (
          <div className="lcard__side">
            <div className="lcard__price"><b>${l.rent?.toLocaleString()}</b><span>/wk</span></div>
            {l.bond && <span className="muted">Bond ${l.bond.toLocaleString()}</span>}
          </div>
        ) : (
          <div className="lcard__foot">
            <div className="lcard__price"><b>${l.rent?.toLocaleString()}</b><span>/wk</span></div>
            {l.bond && <span className="muted t-small">Bond ${l.bond.toLocaleString()}</span>}
          </div>
        )}
      </div>
    </Link>
  );
}
