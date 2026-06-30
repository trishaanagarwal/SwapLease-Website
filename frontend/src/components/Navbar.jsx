import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useState, useRef, useEffect } from 'react';
import { MessageCircle, User, LogOut, ChevronDown, Plus, Bookmark } from 'lucide-react';
import logoMark from '../assets/logo-mark.png';
import { t } from '../theme';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
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

  const navLink = { color: t.inkSoft, textDecoration: 'none', fontSize: 14.5, fontWeight: 600, padding: '8px 14px', borderRadius: t.pill, whiteSpace: 'nowrap' };

  return (
    <nav style={{ background: 'rgba(248, 246, 241, 0.80)', backdropFilter: 'blur(14px) saturate(140%)', WebkitBackdropFilter: 'blur(14px) saturate(140%)', borderBottom: `1px solid ${t.border}`, position: 'sticky', top: 0, zIndex: 50 }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 22px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 70 }}>

        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 9, textDecoration: 'none', flexShrink: 0 }}>
          <img src={logoMark} alt="" style={{ height: 30, width: 'auto', display: 'block' }} />
          <span className="font-display nav-wordmark" style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1 }}>
            <span style={{ color: t.navy }}>Swap</span><span style={{ color: t.green }}>Lease</span>
          </span>
        </Link>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Link to="/listings" className="nav-hide-sm" style={navLink}>Browse leases</Link>

          {user ? (
            <>
              <Link to="/create-listing" className="btn btn-coral" style={{ fontSize: 14, padding: '10px 18px', marginLeft: 4 }}>
                <Plus size={16} strokeWidth={2.6} /> List your lease
              </Link>
              <Link to="/saved" className="nav-hide-sm" style={{ ...navLink, display: 'flex', alignItems: 'center', gap: 5 }}>
                <Bookmark size={17} /> Saved
              </Link>
              <Link to="/messages" className="nav-hide-sm" style={{ ...navLink, display: 'flex', alignItems: 'center', gap: 5 }}>
                <MessageCircle size={17} /> Messages
              </Link>
              <div style={{ position: 'relative', marginLeft: 2 }} ref={dropdownRef}>
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '5px 8px 5px 5px', borderRadius: t.pill, border: `1.5px solid ${t.border}`, background: '#fff', cursor: 'pointer', fontWeight: 600, color: t.ink }}
                >
                  {user.photoURL ? (
                    <img src={user.photoURL} alt="" style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: `linear-gradient(135deg, ${t.coral}, ${t.honey})`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 14 }}>
                      {user.name?.[0]?.toUpperCase()}
                    </div>
                  )}
                  <ChevronDown size={15} color={t.inkSoft} />
                </button>
                {dropdownOpen && (
                  <div style={{ position: 'absolute', right: 0, top: 'calc(100% + 10px)', background: '#fff', border: `1px solid ${t.border}`, borderRadius: 18, boxShadow: t.shadowLg, minWidth: 210, zIndex: 100, overflow: 'hidden' }}>
                    <div style={{ padding: '15px 18px', background: t.cream, borderBottom: `1px solid ${t.border}` }}>
                      <div style={{ fontWeight: 800, fontSize: 14.5, color: t.ink }}>{user.name}</div>
                      <div style={{ fontSize: 12.5, color: t.inkSoft, marginTop: 2 }}>{user.email}</div>
                    </div>
                    <Link to="/profile" onClick={() => setDropdownOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 18px', textDecoration: 'none', color: t.ink, fontSize: 14.5, fontWeight: 600 }}>
                      <User size={16} /> My Profile
                    </Link>
                    <Link to="/saved" onClick={() => setDropdownOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 18px', textDecoration: 'none', color: t.ink, fontSize: 14.5, fontWeight: 600 }}>
                      <Bookmark size={16} /> Saved listings
                    </Link>
                    <Link to="/messages" onClick={() => setDropdownOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 18px', textDecoration: 'none', color: t.ink, fontSize: 14.5, fontWeight: 600 }}>
                      <MessageCircle size={16} /> Messages
                    </Link>
                    <button onClick={handleLogout} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 18px', width: '100%', background: 'none', border: 'none', cursor: 'pointer', color: t.coralDeep, fontSize: 14.5, fontWeight: 700, borderTop: `1px solid ${t.border}` }}>
                      <LogOut size={16} /> Sign out
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
        </div>
      </div>
    </nav>
  );
}
