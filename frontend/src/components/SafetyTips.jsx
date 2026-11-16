import { useState } from 'react';
import { ShieldCheck } from 'lucide-react';

const TIPS = [
  'Never pay a bond, deposit or rent before you sign a lease transfer and confirm the place is real.',
  'Inspect the place in person, or on a live video call, before paying anything.',
  'Keep conversations on SwapLease where you can. Be careful if someone rushes you elsewhere.',
  'Never share passwords, bank logins or one-time codes. SwapLease will never ask for them.',
  'Get the landlord or agent to approve the transfer in writing. A verbal agreement does not protect you.',
];

export default function SafetyTips({ compact = false }) {
  const [open, setOpen] = useState(!compact);
  return (
    <div className="tips">
      <button type="button" className="tips__head" aria-expanded={open} onClick={() => setOpen(o => !o)}>
        <ShieldCheck size={18} aria-hidden="true" />
        <span>Staying safe on SwapLease</span>
        <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true" style={{ transform: open ? 'rotate(180deg)' : 'none' }}><path d="M3 4.5l3 3 3-3" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
      </button>
      {open && <ul className="tips__list">{TIPS.map(tip => <li key={tip}>{tip}</li>)}</ul>}
    </div>
  );
}
