import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import type { UserRole } from '../types/auth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
  requireAuth?: boolean;
}

/**
 * allowedRoles: only these roles can access. If not set, any authenticated user can access.
 * requireAuth: if true, redirect to home when not logged in (and show login option via header).
 */
export default function ProtectedRoute({
  children,
  allowedRoles,
  requireAuth = true,
}: ProtectedRouteProps) {
  const { user, isAuthenticated, openAuthModal } = useAuth();
  const location = useLocation();

  if (!requireAuth) return <>{children}</>;

  if (!isAuthenticated || !user) {
    openAuthModal('login');
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <p className="text-accent-muted">You don&apos;t have permission to view this page.</p>
      </div>
    );
  }

  return <>{children}</>;
}
