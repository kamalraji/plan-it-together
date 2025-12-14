import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { UserRole } from '../../types';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRoles?: UserRole[];
  requireEmailVerification?: boolean;
}

export function ProtectedRoute({ 
  children, 
  requiredRoles = [], 
  requireEmailVerification = false 
}: ProtectedRouteProps) {
  const { user, isLoading, isAuthenticated } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requireEmailVerification && !user?.emailVerified) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
              Email Verification Required
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Please check your email and click the verification link to continue.
            </p>
            <div className="mt-4">
              <button
                onClick={() => window.location.reload()}
                className="text-indigo-600 hover:text-indigo-500 font-medium"
              >
                I've verified my email
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (requiredRoles.length > 0 && user && !requiredRoles.includes(user.role)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
              Access Denied
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              You don't have permission to access this page.
            </p>
            <div className="mt-4">
              <Navigate to="/dashboard" replace />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}