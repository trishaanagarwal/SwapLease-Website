import { useState } from 'react';
import { ShieldCheck, ChevronDown } from 'lucide-react';
import { t } from '../theme';

const TIPS = [
  'Never pay a bond, deposit or rent before signing a proper lease/transfer agreement and confirming the property is real.',
  'Always inspect the property in person (or via a live video call) before paying anything.',
  'Keep conversations and records inside SwapLease where possible, be cautious if someone rushes you off-platform.',
  'Never share passwords, bank logins, or one-time codes. SwapLease will never ask for them.',
  'Make sure any lease transfer is approved by the landlord or agent, verbal agreements aren’t protection.',
];

export default function SafetyTips({ compact = false }) {
  const [open, setOpen] = useState(!compact);
  return (
    <div style={{ background: t.sageTint, border: `1px solid #CFE0D5`, borderRadius: 14, overflow: 'hidden' }}>
      <button onClick={() => setOpen(o => !o)}
        style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '13px 16px', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left' }}>
        <ShieldCheck size={19} color={t.green} />
        <span style={{ flex: 1, fontWeight: 700, fontSize: 14, color: t.green }}>Staying safe on SwapLease</span>
        <ChevronDown size={17} color={t.green} style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
      </button>
      {open && (
        <ul style={{ margin: 0, padding: '0 18px 16px 38px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {TIPS.map((tip, i) => (
            <li key={i} style={{ fontSize: 13, color: '#2C4A3B', lineHeight: 1.55 }}>{tip}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
