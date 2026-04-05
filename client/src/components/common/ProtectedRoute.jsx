import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export default function ProtectedRoute({ children, adminOnly = false }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{
        display: 'flex', justifyContent: 'center', alignItems: 'center',
        height: '100vh', background: 'var(--bg-primary)'
      }}>
        <div style={{
          width: 40, height: 40, border: '3px solid var(--border-color)',
          borderTopColor: 'var(--primary-pink)', borderRadius: '50%',
          animation: 'spin 0.8s linear infinite'
        }} />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (adminOnly && user.role && user.role.name !== 'ADMIN') {
    return <Navigate to="/feed" replace />;
  }

  return children;
}
