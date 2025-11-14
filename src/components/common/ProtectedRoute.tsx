import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

interface ProtectedRouteProps {
  children: ReactNode;
  requireAdmin?: boolean;
}

export function ProtectedRoute({ children, requireAdmin = false }: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Verificando autenticación...</p>
        </div>
      </div>
    );
  }

  // Not authenticated - redirect to login
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check for admin role if required
  if (requireAdmin) {
    const hasAdminRole = user.roles?.some(role => 
      role.name === 'ADMIN' || role.name === 'admin'
    );

    if (!hasAdminRole) {
      return (
        <div className="access-denied">
          <div className="access-denied-content">
            <div className="access-denied-icon">🚫</div>
            <h2>Acceso Denegado</h2>
            <p>No tienes permisos para acceder a esta página.</p>
            <button 
              onClick={() => window.history.back()}
              className="back-button"
            >
              Volver
            </button>
          </div>
        </div>
      );
    }
  }

  // User is authenticated and has required permissions
  return <>{children}</>;
}