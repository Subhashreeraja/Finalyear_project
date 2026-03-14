import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function AuthModal() {
  const { authModalMode, closeAuthModal, login, register, openAuthModal } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (authModalMode) {
      setName('');
      setEmail('');
      setMobile('');
      setPassword('');
      setError('');
    }
  }, [authModalMode]);

  const isRegister = authModalMode === 'register';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const digits = mobile.replace(/\D/g, '');
    if (digits.length < 10) {
      setError('Enter a valid 10-digit mobile number.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (isRegister && !name.trim()) {
      setError('Please enter your name.');
      return;
    }
    if (!email.trim()) {
      setError('Please enter your email.');
      return;
    }

    setLoading(true);
    const result = isRegister
      ? await register(name.trim(), email.trim().toLowerCase(), mobile, password)
      : await login(name.trim(), email.trim().toLowerCase(), mobile, password);
    setLoading(false);

    if (result.success) {
      closeAuthModal();
      const raw = localStorage.getItem('crowdai_user');
      let role: string | null = null;
      if (raw) {
        try {
          role = (JSON.parse(raw) as { role?: string }).role ?? null;
        } catch {
          /* ignore */
        }
      }
      if (role === 'ADMIN' || role === 'SYSTEM_ADMIN') navigate('/admin/dashboard');
      else if (role === 'LOCATION_ADMIN' || role === 'MONITOR') navigate('/location-admin/dashboard');
      else if (role === 'PUBLIC') navigate('/dashboard');
    } else {
      setError(result.error || 'Something went wrong.');
    }
  };

  const resetAndClose = () => {
    setName('');
    setEmail('');
    setMobile('');
    setPassword('');
    setError('');
    closeAuthModal();
  };

  if (!authModalMode) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50" onClick={resetAndClose}>
      <div
        className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 text-accent-primary"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">
            {isRegister ? 'Create account' : 'Sign In'}
          </h2>
          <button
            onClick={resetAndClose}
            className="p-2 rounded-full hover:bg-body text-accent-muted"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <label className="block mb-4">
            <span className="block text-sm font-medium text-accent-muted mb-1">Name</span>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-header focus:border-transparent"
              required
            />
          </label>
          <label className="block mb-4">
            <span className="block text-sm font-medium text-accent-muted mb-1">Email</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-header focus:border-transparent"
              required
            />
          </label>
          <label className="block mb-4">
            <span className="block text-sm font-medium text-accent-muted mb-1">Mobile number</span>
            <input
              type="tel"
              value={mobile}
              onChange={(e) => setMobile(e.target.value.replace(/\D/g, '').slice(0, 14))}
              placeholder="10-digit mobile number"
              maxLength={14}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-header focus:border-transparent"
              required
            />
          </label>
          <label className="block mb-4">
            <span className="block text-sm font-medium text-accent-muted mb-1">Password</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
              minLength={6}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-header focus:border-transparent"
              required
            />
          </label>

          {error && (
            <p className="text-red-600 text-sm mb-4">{error}</p>
          )}

          <div className="flex gap-3 mt-6">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 px-4 bg-header text-white font-medium rounded-lg hover:bg-header-dark disabled:opacity-60"
            >
              {loading ? 'Please wait…' : isRegister ? 'Register' : 'Sign In'}
            </button>
            <button
              type="button"
              onClick={resetAndClose}
              className="py-2.5 px-4 border border-gray-300 rounded-lg hover:bg-body"
            >
              Cancel
            </button>
          </div>
        </form>

        <p className="mt-4 text-center text-sm text-accent-muted">
          {isRegister ? (
            <>Already have an account?{' '}
              <button type="button" onClick={() => openAuthModal('login')} className="text-header font-medium hover:underline">
                Sign In
              </button>
            </>
          ) : (
            <>New user?{' '}
              <button type="button" onClick={() => openAuthModal('register')} className="text-header font-medium hover:underline">
                Register
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
