// The landing page's header (the kit's .nav) for every app page: the same logo, words and button,
// the account menu for a signed-in student, and the full-screen sheet on a phone.
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';
import { MessageCircle, User, LogOut, Bookmark, Users } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useUnreadCount } from '../hooks/useUnreadCount';

export const Mark = () => <span className="mark" data-mark="arc" aria-hidden="true" />;

export function Avatar({ user, className = '' }) {
  return (
    <span className={`avatar ${className}`} aria-hidden="true">
      {user?.photoURL ? <img src={user.photoURL} alt="" /> : (user?.name?.[0]?.toUpperCase() || '?')}
    </span>
  );
}

const ACCOUNT = [
  { to: '/profile', icon: User, label: 'Profile' },
  { to: '/roommates/edit', icon: Users, label: 'My request' },
  { to: '/saved', icon: Bookmark, label: 'Saved' },
  { to: '/messages', icon: MessageCircle, label: 'Messages' },
];

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const unread = useUnreadCount(user?.id);
  const [open, setOpen] = useState(false);        // the phone sheet
  const [menu, setMenu] = useState(false);        // the account menu
  const menuRef = useRef(null);

  // close both on navigation
  useEffect(() => { setOpen(false); setMenu(false); }, [pathname]);
  useEffect(() => { document.body.classList.toggle('nav-locked', open); return () => document.body.classList.remove('nav-locked'); }, [open]);
  useEffect(() => {
    const away = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setMenu(false); };
    const esc = (e) => { if (e.key === 'Escape') { setMenu(false); setOpen(false); } };
    document.addEventListener('mousedown', away);
    document.addEventListener('keydown', esc);
    return () => { document.removeEventListener('mousedown', away); document.removeEventListener('keydown', esc); };
  }, []);

  const signOut = () => { logout(); navigate('/'); };
  // NavLink marks the current page with aria-current, which the kit underlines
  const navLink = (to, label, extra) => (
    <div className="nav__item"><NavLink className="nav__link" to={to}>{label}{extra}</NavLink></div>
  );

  return (
    <header className={`nav${open ? ' is-open' : ''}`}>
      <div className="wrap nav__bar">
        <a className="skip-link" href="#content">Skip to content</a>
        <Link className="nav__logo" to="/"><Mark />SwapLease</Link>

        <nav className="nav__links" aria-label="Main">
          {navLink('/listings', 'Leases')}
          {navLink('/roommates', 'Requests')}
          {user && navLink('/messages', 'Messages', unread > 0 && <span className="dot" aria-label={`${unread} unread`} />)}
          {user && navLink('/saved', 'Saved')}
          {user && (
            <>
              <div className="nav__item nav__sheet-only"><NavLink className="nav__link" to="/profile">Profile</NavLink></div>
              <div className="nav__item nav__sheet-only"><NavLink className="nav__link" to="/roommates/edit">My request</NavLink></div>
              <div className="nav__item nav__sheet-only"><button type="button" className="nav__link" style={{ border: 0, background: 'none', cursor: 'pointer', textAlign: 'left' }} onClick={signOut}>Sign out</button></div>
            </>
          )}
        </nav>

        <div className="nav__actions">
          {!user && <Link className="nav__link" to="/login">Sign in</Link>}
          <Link className="btn btn--primary" to="/create-listing">List your lease</Link>
          {user && (
            <div className="nav__user" ref={menuRef}>
              <button type="button" className="nav__user-btn" aria-expanded={menu} aria-haspopup="menu" aria-label="Your account" onClick={() => setMenu(m => !m)}>
                <Avatar user={user} />
                <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true"><path d="M3 4.5l3 3 3-3" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </button>
              {menu && (
                <div className="user-menu" role="menu">
                  <div className="user-menu__who">
                    <Avatar user={user} />
                    <div style={{ minWidth: 0 }}><b>{user.name}</b><span>{user.email}</span></div>
                  </div>
                  {!user.emailVerified && <p className="alert alert--note" style={{ margin: '0 4px 8px' }}>Verify your email to list or message.</p>}
                  <hr />
                  {ACCOUNT.map(item => (
                    <Link key={item.to} to={item.to} role="menuitem">
                      <item.icon aria-hidden="true" />{item.label}
                      {item.to === '/messages' && unread > 0 && <span className="menu-dot" style={{ position: 'static', marginLeft: 'auto' }} />}
                    </Link>
                  ))}
                  <hr />
                  <button type="button" role="menuitem" onClick={signOut}><LogOut aria-hidden="true" />Sign out</button>
                </div>
              )}
            </div>
          )}
        </div>

        <button className="nav__toggle" type="button" aria-expanded={open} aria-label={open ? 'Close menu' : 'Menu'} onClick={() => setOpen(o => !o)}>
          {open
            ? <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true"><path d="M4 4l10 10M14 4 4 14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>
            : <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true"><path d="M2 5h14M2 13h14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>}
        </button>
      </div>
    </header>
  );
}
