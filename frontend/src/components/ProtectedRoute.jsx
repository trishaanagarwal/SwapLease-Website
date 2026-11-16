import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="center-fill"><div className="spinner" role="status" aria-label="Loading" /></div>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}
