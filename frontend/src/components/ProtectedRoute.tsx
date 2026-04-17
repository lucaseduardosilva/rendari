import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../stores/auth';

export function ProtectedRoute({ adminOnly = false }: { adminOnly?: boolean }) {
  const user = useAuth((s) => s.user);
  if (!user) return <Navigate to="/login" replace />;
  if (adminOnly && user.role !== 'ADMIN') return <Navigate to="/dashboard" replace />;
  return <Outlet />;
}
