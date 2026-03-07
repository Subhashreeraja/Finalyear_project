import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getAdminInfo } from '../lib/adminApi';

const navLinks = [
  { to: '/', label: 'Home' },
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/alerts', label: 'Alerts' },
  { to: '/location', label: 'Location', hasDropdown: true },
  { to: '/events', label: 'Events', hasDropdown: true },
];

export default function Header() {
  const { user, isAuthenticated, openAuthModal, logout } = useAuth();
  const [eventsOpen, setEventsOpen] = useState(false);
  const [locationOpen, setLocationOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const profileRefMobile = useRef<HTMLDivElement>(null);
  const eventsRef = useRef<HTMLDivElement>(null);
  const locationRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as Node;
      const insideProfile = (profileRef.current?.contains(target) || profileRefMobile.current?.contains(target));
      const insideEvents = eventsRef.current?.contains(target);
      const insideLocation = locationRef.current?.contains(target);
      if (!insideProfile && !insideEvents && !insideLocation) {
        setProfileOpen(false);
        setEventsOpen(false);
        setLocationOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="bg-header text-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="text-xl font-bold tracking-tight">
            CrowdAi
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) =>
              link.hasDropdown ? (
                <div
                  key={link.to}
                  className="relative"
                  ref={link.to === '/events' ? eventsRef : link.to === '/location' ? locationRef : undefined}
                >
                  <button
                    onClick={() => {
                      if (link.to === '/events') setEventsOpen((o) => !o);
                      else if (link.to === '/location') setLocationOpen((o) => !o);
                    }}
                    className="flex items-center gap-1 hover:opacity-90"
                  >
                    {link.label}
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                  {link.to === '/events' && eventsOpen && (
                    <div className="absolute top-full left-0 mt-1 w-48 py-2 bg-white text-accent-primary rounded-lg shadow-lg">
                      <Link to="/events" className="block px-4 py-2 hover:bg-body">All Events</Link>
                      <Link to="/events/live" className="block px-4 py-2 hover:bg-body">Live</Link>
                    </div>
                  )}
                  {link.to === '/location' && locationOpen && (
                    <div className="absolute top-full left-0 mt-1 w-48 py-2 bg-white text-accent-primary rounded-lg shadow-lg">
                      <Link to="/location" className="block px-4 py-2 hover:bg-body" onClick={() => setLocationOpen(false)}>Districts</Link>
                      <Link to="/location" className="block px-4 py-2 hover:bg-body" onClick={() => setLocationOpen(false)}>Map View</Link>
                    </div>
                  )}
                </div>
              ) : (
                <Link key={link.to} to={link.to} className="hover:opacity-90">
                  {link.label}
                </Link>
              )
            )}
            {getAdminInfo() ? (
              <Link to="/admin/dashboard" className="hover:opacity-90 text-white/90">
                Admin
              </Link>
            ) : (
              <Link to="/admin/login" className="hover:opacity-90 text-white/80 text-sm">
                Admin login
              </Link>
            )}

            {/* Profile: icon with "Profile" below */}
            <div className="relative flex flex-col items-center" ref={profileRef}>
              <button
                onClick={() =>
                  isAuthenticated ? setProfileOpen((o) => !o) : openAuthModal('login')
                }
                className="hover:opacity-90"
                aria-label="Profile"
              >
                <span className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                  {isAuthenticated && user?.name ? (
                    <span className="text-sm font-semibold">
                      {user.name.charAt(0).toUpperCase()}
                    </span>
                  ) : (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden>
                      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                    </svg>
                  )}
                </span>
              </button>
              {isAuthenticated && profileOpen && (
                <div className="absolute right-0 top-full mt-1 w-52 py-2 bg-white text-accent-primary rounded-lg shadow-lg">
                  <div className="px-4 py-2 border-b border-body">
                    <p className="font-medium truncate">{user?.name}</p>
                    <p className="text-sm text-accent-muted truncate">{user?.mobile}</p>
                    <p className="text-xs text-accent-muted capitalize">{user?.role?.replace('_', ' ')}</p>
                  </div>
                  <Link
                    to="/dashboard"
                    className="block px-4 py-2 hover:bg-body"
                    onClick={() => setProfileOpen(false)}
                  >
                    Dashboard
                  </Link>
                  <button
                    onClick={() => {
                      logout();
                      setProfileOpen(false);
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-body text-red-600"
                  >
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </nav>

          {/* Mobile: profile icon with Profile below */}
          <div className="md:hidden relative flex flex-col items-center" ref={profileRefMobile}>
            <button
              onClick={() => (isAuthenticated ? setProfileOpen((o) => !o) : openAuthModal('login'))}
              className="p-1"
              aria-label="Profile"
            >
              <span className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                {isAuthenticated && user?.name ? (
                  <span className="text-sm font-semibold">
                    {user.name.charAt(0).toUpperCase()}
                  </span>
                ) : (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                  </svg>
                )}
              </span>
            </button>
            {isAuthenticated && profileOpen && (
              <div className="absolute right-0 top-full mt-1 w-52 py-2 bg-white text-accent-primary rounded-lg shadow-lg z-50">
                <div className="px-4 py-2 border-b border-body">
                  <p className="font-medium truncate">{user?.name}</p>
                  <p className="text-sm text-accent-muted truncate">{user?.mobile}</p>
                  <p className="text-xs text-accent-muted capitalize">{user?.role?.replace('_', ' ')}</p>
                </div>
                <Link to="/dashboard" className="block px-4 py-2 hover:bg-body" onClick={() => setProfileOpen(false)}>Dashboard</Link>
                <button onClick={() => { logout(); setProfileOpen(false); }} className="w-full text-left px-4 py-2 hover:bg-body text-red-600">Sign Out</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
