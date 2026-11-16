// The landing page's dark footer (kit .footer--dark), without the closing call to action.
import { Link, useLocation } from 'react-router-dom';
import { Mark } from './Navbar';

const SUBURBS = ['Carlton', 'Fitzroy', 'Brunswick', 'Parkville'];

export default function Footer() {
  // the chat fills the screen; no footer under it
  if (useLocation().pathname.startsWith('/messages')) return null;
  return (
    <footer className="footer footer--dark ground-inverse app-footer">
      <div className="wrap">
        <div className="grid">
          <div className="span-4 stack-4">
            <Link className="nav__logo" to="/"><Mark />SwapLease</Link>
            <p className="footer__lede">Melbourne students passing leases to each other.</p>
          </div>
          <div className="span-2 footer__col"><h3>Suburbs</h3><ul>
            {SUBURBS.map(s => <li key={s}><Link to={`/listings?search=${s}`}>{s}</Link></li>)}
          </ul></div>
          <div className="span-2 footer__col"><h3>Leases</h3><ul>
            <li><Link to="/listings">Browse leases</Link></li>
            <li><Link to="/roommates">Requests</Link></li>
            <li><Link to="/create-listing">List a lease</Link></li>
          </ul></div>
          <div className="span-2 footer__col"><h3>Account</h3><ul>
            <li><Link to="/profile">Profile</Link></li>
            <li><Link to="/messages">Messages</Link></li>
            <li><Link to="/saved">Saved</Link></li>
          </ul></div>
          <div className="span-2 footer__col"><h3>Help</h3><ul>
            <li><a href="mailto:help@swaplease.homes">Email us</a></li>
            <li><Link to="/privacy">Privacy</Link></li>
            <li><Link to="/terms">Terms</Link></li>
          </ul></div>
        </div>
        <div className="footer__legal"><span>&copy; 2026 SwapLease</span></div>
      </div>
    </footer>
  );
}
