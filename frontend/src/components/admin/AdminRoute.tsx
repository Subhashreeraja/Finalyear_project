import { Navigate, useLocation } from 'react-router-dom';
import { getAdminToken } from '../../lib/adminApi';

interface AdminRouteProps {
  children: React.ReactNode;
}

export default function AdminRoute({ children }: AdminRouteProps) {
  const location = useLocation();
  const token = getAdminToken();

  if (!token) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}

