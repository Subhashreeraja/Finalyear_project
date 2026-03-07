import { Link, useLocation } from 'react-router-dom';
import { getAdminInfo, adminLogout } from '../../lib/adminApi';

interface AdminLayoutProps {
  children: React.ReactNode;
}

const navItems = [
  { to: '/admin/dashboard', label: 'Dashboard' },
  { to: '/admin/cameras', label: 'Cameras' },
  { to: '/admin/gate-control', label: 'Gate Control' },
  { to: '/admin/alerts', label: 'Alerts' },
];

export default function AdminLayout({ children }: AdminLayoutProps) {
  const location = useLocation();
  const admin = getAdminInfo();

  return (
    <div className="flex flex-col min-h-screen bg-body">
      {/* Header */}
      <header className="bg-header text-white flex items-center justify-between px-6 py-4 shadow">
        <div>
          <h1 className="text-xl font-semibold">CrowdAi Admin</h1>
          {admin && (
            <p className="text-sm text-body-light/80">
              {admin.name} ({admin.email})
            </p>
          )}
        </div>
        <nav className="flex space-x-4">
          {navItems.map((item) => {
            const active = location.pathname.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  active
                    ? 'bg-header-dark text-white'
                    : 'text-body-light hover:bg-header-dark/70'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <button
          type="button"
          onClick={() => {
            adminLogout();
            window.location.href = '/admin/login';
          }}
          className="ml-4 px-3 py-2 rounded-md text-sm font-medium bg-body-light text-header hover:bg-white transition-colors"
        >
          Logout
        </button>
      </header>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto px-6 py-6 max-w-7xl mx-auto">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-header-dark text-white text-center py-4 mt-auto">
        &copy; {new Date().getFullYear()} CrowdAi. All rights reserved.
      </footer>
    </div>
  );
}