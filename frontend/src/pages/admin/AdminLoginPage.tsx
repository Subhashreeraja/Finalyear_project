import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { adminLogin, getAdminToken } from '../../lib/adminApi';

export default function AdminLoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('admin@crowdai.local');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // If already logged in, redirect directly to dashboard
  useEffect(() => {
    if (getAdminToken()) {
      navigate('/admin/dashboard', { replace: true });
    }
  }, [navigate]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await adminLogin(email, password);
      const from = (location.state as any)?.from as { pathname?: string } | undefined;
      navigate((from && from.pathname) || '/admin/dashboard', { replace: true });
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-body">
      <div className="w-full max-w-md bg-white shadow-lg rounded-xl p-8">
        <h1 className="text-2xl font-semibold text-accent-primary text-center">Admin Login</h1>
        <p className="mt-2 text-sm text-accent-muted text-center">
          Sign in to manage live crowd monitoring and gate control.
        </p>
        <form className="mt-6 space-y-4" onSubmit={onSubmit}>
          <div>
            <label className="block text-sm font-medium text-accent-primary mb-1">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-md border border-accent-muted/30 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-primary focus:border-accent-primary bg-body-light"
              placeholder="admin@crowdai.local"
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
              placeholder="Enter admin password"
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

