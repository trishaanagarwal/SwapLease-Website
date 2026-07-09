import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useState, useRef, useEffect } from 'react';
import { MessageCircle, User, LogOut, ChevronDown, Plus, Bookmark, Users, Menu, X, Search } from 'lucide-react';
import logoMark from '../assets/logo-mark.png';
import { t } from '../theme';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
    setDropdownOpen(false);
  };

  const navLink = { color: t.inkSoft, textDecoration: 'none', fontSize: 14.5, fontWeight: 600, padding: '8px 14px', borderRadius: t.radius, whiteSpace: 'nowrap' };

  return (
    <nav style={{ background: t.cream, borderBottom: `1px solid ${t.border}`, position: 'sticky', top: 0, zIndex: 50 }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 66 }}>

        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 9, textDecoration: 'none', flexShrink: 0 }}>
          <img src={logoMark} alt="" style={{ height: 28, width: 'auto', display: 'block' }} />
          <span className="font-display nav-wordmark" style={{ fontSize: 21, fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1 }}>
            <span style={{ color: t.navy }}>Swap</span><span style={{ color: t.green }}>Lease</span>
          </span>
        </Link>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Link to="/listings" className="nav-hide-sm" style={navLink}>Browse leases</Link>
          <Link to="/roommates" className="nav-hide-sm" style={navLink}>Requests</Link>

          {user ? (
            <>
              <Link to="/create-listing" className="btn btn-coral" style={{ fontSize: 14, padding: '9px 16px', marginLeft: 4 }}>
                <Plus size={16} strokeWidth={2.4} /> <span className="nav-hide-xs">List your lease</span>
              </Link>
              <Link to="/messages" className="nav-hide-sm" style={{ ...navLink, display: 'flex', alignItems: 'center', gap: 5 }}>
                <MessageCircle size={17} /> Messages
              </Link>
              <div style={{ position: 'relative', marginLeft: 2 }} ref={dropdownRef}>
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '5px 8px 5px 5px', borderRadius: t.radius, border: `1.5px solid ${t.border}`, background: '#fff', cursor: 'pointer', fontWeight: 600, color: t.ink }}
                >
                  {user.photoURL ? (
                    <img src={user.photoURL} alt="" style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: t.navy, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 14 }}>
                      {user.name?.[0]?.toUpperCase()}
                    </div>
                  )}
                  <ChevronDown size={15} color={t.inkSoft} />
                </button>
                {dropdownOpen && (
                  <div style={{ position: 'absolute', right: 0, top: 'calc(100% + 10px)', background: '#fff', border: `1px solid ${t.border}`, borderRadius: t.radiusLg, boxShadow: t.shadowLg, minWidth: 250, zIndex: 100, overflow: 'hidden', padding: 6 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '12px 12px 14px' }}>
                      {user.photoURL ? (
                        <img src={user.photoURL} alt="" style={{ width: 42, height: 42, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                      ) : (
                        <div style={{ width: 42, height: 42, borderRadius: '50%', background: t.navy, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 17, flexShrink: 0 }}>
                          {user.name?.[0]?.toUpperCase()}
                        </div>
                      )}
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: 14.5, color: t.ink, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.name}</div>
                        <div style={{ fontSize: 12.5, color: t.inkSoft, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.email}</div>
                      </div>
                    </div>
                    {!user.emailVerified && (
                      <div style={{ margin: '0 6px 6px', padding: '8px 10px', background: t.honeyTint, borderRadius: t.radius, fontSize: 12, color: '#8a6a1f', fontWeight: 600 }}>
                        Verify your email to list or message.
                      </div>
                    )}
                    <div style={{ borderTop: `1px solid ${t.border}`, paddingTop: 6 }}>
                      {[
                        { to: '/profile', icon: User, label: 'My profile' },
                        { to: '/roommates/edit', icon: Users, label: 'My request' },
                        { to: '/saved', icon: Bookmark, label: 'Saved listings' },
                        { to: '/messages', icon: MessageCircle, label: 'Messages' },
                      ].map(item => (
                        <Link key={item.to} to={item.to} onClick={() => setDropdownOpen(false)}
                          onMouseEnter={e => e.currentTarget.style.background = t.cream}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                          style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '10px 12px', textDecoration: 'none', color: t.ink, fontSize: 14, fontWeight: 600, borderRadius: t.radius }}>
                          <item.icon size={17} color={t.inkSoft} /> {item.label}
                        </Link>
                      ))}
                    </div>
                    <button onClick={handleLogout}
                      onMouseEnter={e => e.currentTarget.style.background = t.coralTint}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '10px 12px', width: '100%', background: 'none', border: 'none', cursor: 'pointer', color: t.coralDeep, fontSize: 14, fontWeight: 700, borderRadius: t.radius, marginTop: 4, borderTop: `1px solid ${t.border}` }}>
                      <LogOut size={17} /> Sign out
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Link to="/login" style={navLink}>Sign in</Link>
              <Link to="/signup" className="btn btn-coral" style={{ fontSize: 14, padding: '10px 20px' }}>Sign up</Link>
            </>
          )}

          {/* Mobile hamburger (visible < 640px only) */}
          <button className="nav-show-sm" onClick={() => setMenuOpen(o => !o)} aria-label="Menu"
            style={{ display: 'none', alignItems: 'center', justifyContent: 'center', width: 40, height: 40, background: '#fff', border: `1.5px solid ${t.border}`, borderRadius: t.radius, cursor: 'pointer', color: t.ink, marginLeft: 2 }}>
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile menu panel */}
      {menuOpen && (
        <div className="nav-show-sm" style={{ display: 'none', flexDirection: 'column', gap: 2, padding: '8px 14px 14px', borderTop: `1px solid ${t.border}`, background: t.cream }}>
          {[
            { to: '/listings', icon: Search, label: 'Browse leases' },
            { to: '/roommates', icon: Users, label: 'Requests' },
            ...(user ? [{ to: '/messages', icon: MessageCircle, label: 'Messages' }] : []),
          ].map(item => (
            <Link key={item.to} to={item.to} onClick={() => setMenuOpen(false)}
              style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '12px 10px', textDecoration: 'none', color: t.ink, fontSize: 15, fontWeight: 600, borderRadius: t.radius }}>
              <item.icon size={18} color={t.inkSoft} /> {item.label}
            </Link>
          ))}
        </div>
      )}
    </nav>
  );
}
