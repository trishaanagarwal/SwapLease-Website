import { MapPin, MessageCircle, BadgeCheck, CalendarDays, GraduationCap, Pencil } from 'lucide-react';
import SeekerPhoto from './SeekerPhoto';
import { t } from '../theme';

// A student's request: who, budget, where, when, a few lines, and the one action.
export default function SeekerCard({ s, user, busy, onMessage }) {
  const mine = s.userId === user?.id;
  const first = s.userName?.split(' ')[0] || 'them';
  return (
    <article className="lcard">
      <SeekerPhoto src={s.images?.[0]} />
      <div className="lcard__body">
        <h3 className="lcard__title" style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          {s.onBehalfOf || s.userName}
          <BadgeCheck size={16} color={t.green} aria-label="Verified student" />
          {s.onBehalfOf && <span className="pill pill--quiet">via {first}</span>}
        </h3>
        <div className="chips">
          {s.budget && <span className="pill pill--accent">${s.budget}/wk</span>}
          {s.areas && <span className="pill"><MapPin aria-hidden="true" />{s.areas}</span>}
          {s.moveIn && <span className="pill"><CalendarDays aria-hidden="true" />{s.moveIn}</span>}
          {s.unis && <span className="pill"><GraduationCap aria-hidden="true" />{s.unis}</span>}
        </div>
        <p className="clamp-3 muted">{s.about}</p>
        <div className="lcard__foot">
          <button type="button" onClick={() => onMessage(s)} disabled={busy === s.userId} className={`btn ${mine ? 'btn--secondary' : 'btn--primary'}`} style={{ width: '100%' }}>
            {mine
              ? <><Pencil size={15} aria-hidden="true" /> Edit your request</>
              : <><MessageCircle size={16} aria-hidden="true" /> {busy === s.userId ? 'Opening chat' : `Message ${first}`}</>}
          </button>
        </div>
      </div>
    </article>
  );
}
