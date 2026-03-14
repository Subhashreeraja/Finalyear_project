import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getAdminInfo } from '../lib/adminApi';

function getNavLinks(isAuthenticated: boolean, isLocationAdmin: boolean) {
  const links = [
    { to: '/', label: 'Home' },
    ...(isAuthenticated ? [{ to: '/dashboard', label: 'Dashboard' }, { to: '/alerts', label: 'Alerts' }] : []),
    ...(isLocationAdmin ? [{ to: '/location-admin/dashboard', label: 'Location Admin' }] : []),
    { to: '/location', label: 'Location', hasDropdown: true },
    { to: '/events', label: 'Events', hasDropdown: true },
  ];
  return links;
}

export default function Header() {
  const { isAuthenticated, isLocationAdmin, openAuthModal, logout } = useAuth();
  const navLinks = getNavLinks(isAuthenticated, isLocationAdmin);
  const [eventsOpen, setEventsOpen] = useState(false);
  const [locationOpen, setLocationOpen] = useState(false);
  const eventsRef = useRef<HTMLDivElement>(null);
  const locationRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as Node;
      const insideEvents = eventsRef.current?.contains(target);
      const insideLocation = locationRef.current?.contains(target);
      if (!insideEvents && !insideLocation) {
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
                System Admin
              </Link>
            ) : (
              <button
                type="button"
                onClick={() => openAuthModal('login')}
                className="flex items-center gap-2 hover:opacity-90 text-white font-medium"
                aria-label="Login"
              >
                <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <circle cx="12" cy="8" r="4" />
                  <path d="M4 20c0-4 4-6 8-6s8 2 8 6" />
                </svg>
                <span>Login</span>
              </button>
            )}
            {isAuthenticated && (
              <button
                type="button"
                onClick={() => logout()}
                className="hover:opacity-90 text-white/90 text-sm font-medium"
              >
                Sign Out
              </button>
            )}
          </nav>

          {/* Mobile: Login / Sign Out */}
          <div className="md:hidden flex items-center gap-3">
            {isAuthenticated ? (
              <button
                type="button"
                onClick={() => logout()}
                className="hover:opacity-90 text-white/90 text-sm font-medium"
              >
                Sign Out
              </button>
            ) : (
              <button
                type="button"
                onClick={() => openAuthModal('login')}
                className="hover:opacity-90 text-white font-medium text-sm"
              >
                Login
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
