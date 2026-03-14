import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type { User } from '../types/auth';
import { AUTH_TOKEN_KEY, AUTH_USER_KEY } from '../types/auth';

interface AuthContextValue {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isLocationAdmin: boolean;
  isPublicUser: boolean;
  isGuest: boolean;
  login: (name: string, email: string, mobile: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (name: string, email: string, mobile: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  openAuthModal: (mode: 'login' | 'register') => void;
  closeAuthModal: () => void;
  authModalMode: 'login' | 'register' | null;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function loadStored(): { user: User | null; token: string | null } {
  try {
    const storedUser = localStorage.getItem(AUTH_USER_KEY);
    const storedToken = localStorage.getItem(AUTH_TOKEN_KEY);
    if (storedUser && storedToken) {
      const user = JSON.parse(storedUser) as User;
      return { user, token: storedToken };
    }
  } catch {
    /* ignore */
  }
  return { user: null, token: null };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [auth, setAuth] = useState<{ user: User | null; token: string | null }>(loadStored);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register' | null>(null);

  const openAuthModal = useCallback((mode: 'login' | 'register') => {
    setAuthModalMode(mode);
  }, []);

  const closeAuthModal = useCallback(() => {
    setAuthModalMode(null);
  }, []);

  const login = useCallback(
    async (
      name: string,
      email: string,
      mobile: string,
      password: string,
    ): Promise<{ success: boolean; error?: string }> => {
      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, mobile, password }),
        });
        const data = await res.json().catch(() => ({}));
        if (res.ok) {
          setAuth({ user: data.user, token: data.token });
          localStorage.setItem(AUTH_USER_KEY, JSON.stringify(data.user));
          localStorage.setItem(AUTH_TOKEN_KEY, data.token);
          return { success: true };
        }
        return { success: false, error: data.error || 'Login failed' };
      } catch {
        return { success: false, error: 'Network error' };
      }
    },
    [],
  );

  const register = useCallback(
    async (
      name: string,
      email: string,
      mobile: string,
      password: string,
    ): Promise<{ success: boolean; error?: string }> => {
      try {
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, mobile, password }),
        });
        const data = await res.json().catch(() => ({}));
        if (res.ok) {
          setAuth({ user: data.user, token: data.token });
          localStorage.setItem(AUTH_USER_KEY, JSON.stringify(data.user));
          localStorage.setItem(AUTH_TOKEN_KEY, data.token);
          return { success: true };
        }
        return { success: false, error: data.error || 'Registration failed' };
      } catch {
        return { success: false, error: 'Network error' };
      }
    },
    [],
  );

  const logout = useCallback(() => {
    setAuth({ user: null, token: null });
    localStorage.removeItem(AUTH_USER_KEY);
    localStorage.removeItem(AUTH_TOKEN_KEY);
    setAuthModalMode(null);
    // Clear admin session if present
    localStorage.removeItem('crowdai_admin_token');
    localStorage.removeItem('crowdai_admin_info');
  }, []);

  const user = auth.user;
  const token = auth.token;
  const isAuthenticated = !!user && !!token;
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SYSTEM_ADMIN';
  const isLocationAdmin = user?.role === 'LOCATION_ADMIN' || user?.role === 'MONITOR';
  const isPublicUser = user?.role === 'PUBLIC';
  const isGuest = !isAuthenticated || user?.role === 'GUEST';

  const value: AuthContextValue = {
    user,
    token,
    isAuthenticated,
    isAdmin,
    isLocationAdmin,
    isPublicUser,
    isGuest,
    login,
    register,
    logout,
    openAuthModal,
    closeAuthModal,
    authModalMode,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
