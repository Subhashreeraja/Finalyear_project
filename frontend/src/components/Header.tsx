import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getAdminInfo } from '../lib/adminApi';

function getNavLinks(isAuthenticated: boolean, isLocationAdmin: boolean) {
  const links = [
    { to: '/', label: 'Home' },
    ...(isAuthenticated ? [{ to: '/dashboard', label: 'Dashboard' }, { to: '/alerts', label: 'Alerts' }] : []),
    ...(isLocationAdmin ? [{ to: '/location-admin/dashboard', label: 'Location Admin' }] : []),
    { to: '/location', label: 'Location' },
  ];
  return links;
}

export default function Header() {
  const { isAuthenticated, isLocationAdmin, openAuthModal, logout } = useAuth();
  const navLinks = getNavLinks(isAuthenticated, isLocationAdmin);

  return (
    <header className="bg-header text-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="text-xl font-bold tracking-tight">
            CrowdAi
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link key={link.to} to={link.to} className="hover:opacity-90">
                {link.label}
              </Link>
            ))}
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
