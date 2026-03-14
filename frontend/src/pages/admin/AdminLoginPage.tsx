import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getAdminToken } from '../../lib/adminApi';
import { useAuth } from '../../contexts/AuthContext';

export default function AdminLoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, logout } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('systemadmin@smartcity.local');
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (getAdminToken()) {
      navigate('/admin/dashboard', { replace: true });
    }
  }, [navigate]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const result = await login(name, email, mobile, password);
    setLoading(false);
    if (result.success) {
      const userRaw = localStorage.getItem('crowdai_user');
      if (userRaw) {
        try {
          const user = JSON.parse(userRaw) as { role?: string };
          if (user.role === 'ADMIN' || user.role === 'SYSTEM_ADMIN') {
            const from = (location.state as { from?: { pathname?: string } })?.from;
            navigate((from?.pathname) || '/admin/dashboard', { replace: true });
            return;
          }
          logout();
        } catch {
          /* ignore */
        }
      }
      setError('Admin access required. Use Admin credentials.');
    } else {
      setError(result.error || 'Login failed');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-body">
      <div className="w-full max-w-md bg-white shadow-lg rounded-xl p-8">
        <h1 className="text-2xl font-semibold text-accent-primary text-center">System Admin Login</h1>
        <p className="mt-2 text-sm text-accent-muted text-center">
          Full city-wide access. Sign in with name, email, mobile and password.
        </p>
        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-medium text-accent-primary mb-1">Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-md border border-accent-muted/30 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-primary focus:border-accent-primary bg-body-light"
              placeholder="System Admin"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-accent-primary mb-1">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-md border border-accent-muted/30 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-primary focus:border-accent-primary bg-body-light"
              placeholder="systemadmin@smartcity.local"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-accent-primary mb-1">Mobile</label>
            <input
              type="tel"
              required
              value={mobile}
              onChange={(e) => setMobile(e.target.value.replace(/\D/g, '').slice(0, 14))}
              className="w-full rounded-md border border-accent-muted/30 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-primary focus:border-accent-primary bg-body-light"
              placeholder="9999999999"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-accent-primary mb-1">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-md border border-accent-muted/30 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-primary focus:border-accent-primary bg-body-light"
              placeholder="Enter password"
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full inline-flex items-center justify-center px-4 py-2 rounded-md text-sm font-semibold bg-accent-primary text-white hover:bg-header-dark transition-colors disabled:opacity-60"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
}
