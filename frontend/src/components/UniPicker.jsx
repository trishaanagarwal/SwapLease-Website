import { X } from 'lucide-react';
import { UNIVERSITIES } from '../constants';
import { t } from '../theme';

// Pick multiple universities: choose from the dropdown to add a chip,
// click a chip's ✕ to remove it.
export default function UniPicker({ value = [], onChange, placeholder = 'Add a university…' }) {
  const remaining = UNIVERSITIES.filter(u => !value.includes(u));

  return (
    <div>
      <select
        value=""
        onChange={e => e.target.value && onChange([...value, e.target.value])}
        style={{ width: '100%', border: `1px solid ${t.borderStrong}`, borderRadius: t.radius, padding: '10px 14px', fontSize: 14, color: value.length ? t.inkSoft : t.ink, background: '#fff', cursor: 'pointer', fontFamily: 'inherit' }}>
        <option value="">{placeholder}</option>
        {remaining.map(u => <option key={u} value={u}>{u}</option>)}
      </select>
      {value.length > 0 && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
          {value.map(u => (
            <span key={u} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12.5, fontWeight: 700, color: t.plum, background: t.plumTint, borderRadius: t.radiusSm, padding: '5px 8px 5px 11px' }}>
              {u}
              <button type="button" onClick={() => onChange(value.filter(x => x !== u))} aria-label={`Remove ${u}`}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: t.plum, padding: 0, display: 'flex' }}>
                <X size={13} />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
