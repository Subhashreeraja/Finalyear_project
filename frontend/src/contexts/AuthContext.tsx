import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type { User } from '../types/auth';

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  login: (mobile: string, otp: string) => Promise<boolean>;
  register: (name: string, mobile: string, otp: string) => Promise<boolean>;
  sendOtp: (mobile: string) => Promise<boolean>;
  logout: () => void;
  openAuthModal: (mode: 'login' | 'register') => void;
  closeAuthModal: () => void;
  authModalMode: 'login' | 'register' | null;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem('crowdai_user');
    return stored ? JSON.parse(stored) : null;
  });
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register' | null>(null);

  const openAuthModal = useCallback((mode: 'login' | 'register') => {
    setAuthModalMode(mode);
  }, []);

  const closeAuthModal = useCallback(() => {
    setAuthModalMode(null);
  }, []);

  const sendOtp = useCallback(async (mobile: string): Promise<boolean> => {
    // TODO: call backend POST /api/auth/send-otp
    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobile }),
      });
      if (!res.ok) {
        // Demo: accept any 10-digit and "send" OTP (no backend yet)
        if (mobile.replace(/\D/g, '').length >= 10) return true;
        return false;
      }
      return true;
    } catch {
      // Demo: allow 10-digit mobile without backend
      return mobile.replace(/\D/g, '').length >= 10;
    }
  }, []);

  const login = useCallback(async (mobile: string, otp: string): Promise<boolean> => {
    // TODO: call backend POST /api/auth/login
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobile, otp }),
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        localStorage.setItem('crowdai_user', JSON.stringify(data.user));
        return true;
      }
    } catch {
      // Demo: accept OTP 123456 without backend
      if (otp === '123456' && mobile.replace(/\D/g, '').length >= 10) {
        const demoUser: User = {
          id: 'demo-1',
          name: 'Demo User',
          mobile,
          role: 'registered_user',
        };
        setUser(demoUser);
        localStorage.setItem('crowdai_user', JSON.stringify(demoUser));
        return true;
      }
    }
    return false;
  }, []);

  const register = useCallback(async (name: string, mobile: string, otp: string): Promise<boolean> => {
    // TODO: call backend POST /api/auth/register
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, mobile, otp }),
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        localStorage.setItem('crowdai_user', JSON.stringify(data.user));
        return true;
      }
    } catch {
      // Demo: accept OTP 123456 without backend
      if (otp === '123456' && name.trim() && mobile.replace(/\D/g, '').length >= 10) {
        const demoUser: User = {
          id: 'demo-' + Date.now(),
          name: name.trim(),
          mobile,
          role: 'registered_user',
        };
        setUser(demoUser);
        localStorage.setItem('crowdai_user', JSON.stringify(demoUser));
        return true;
      }
    }
    return false;
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('crowdai_user');
    setAuthModalMode(null);
  }, []);

  const value: AuthContextValue = {
    user,
    isAuthenticated: !!user,
    login,
    register,
    sendOtp,
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
