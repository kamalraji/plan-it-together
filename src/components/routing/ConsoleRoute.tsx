import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { UserRole, UserStatus } from '../../types';

interface ConsoleRouteProps {
  children: React.ReactNode;
  requiredRoles?: UserRole[];
  requireEmailVerification?: boolean;
  requireActiveStatus?: boolean;
}

/**
 * ConsoleRoute component provides enhanced authentication-based route protection for console access.
 * Features:
 * - Authentication checks with proper redirect handling
 * - Role-based service access control within the console
 * - Email verification requirements for console access
 * - User status validation (active, suspended, etc.)
 * - Enhanced loading states with console-style UI
 * - Return URL preservation for seamless login flow
 */
export const ConsoleRoute: React.FC<ConsoleRouteProps> = ({
  children,
  requiredRoles = [],
  requireEmailVerification = true, // Console requires email verification by default
  requireActiveStatus = true, // Console requires active user status by default
}) => {
  const { user, isLoading, isRolesLoading, isAuthenticated } = useAuth();
  const location = useLocation();

  // Show console-style loading indicator while checking authentication or loading roles
  if (isLoading || (isAuthenticated && isRolesLoading && requiredRoles.length > 0)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-lg font-medium text-gray-900 mb-2">Loading Console</h2>
          <p className="text-sm text-gray-600">Verifying your access...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated, preserving the console route for return URL
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check user status requirement for console access
  if (requireActiveStatus && user && user.status !== UserStatus.ACTIVE) {
    const statusMessages = {
      [UserStatus.PENDING]: {
        title: 'Account Pending Activation',
        message: 'Your account is pending activation. Please check your email for activation instructions.',
        action: 'Resend Activation Email',
      },
      [UserStatus.SUSPENDED]: {
        title: 'Account Suspended',
        message: 'Your account has been suspended. Please contact support for assistance.',
        action: 'Contact Support',
      },
    };

    const statusConfig = statusMessages[user.status as keyof typeof statusMessages];

    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <div className="mx-auto h-12 w-12 text-yellow-600 mb-4">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {statusConfig?.title || 'Account Status Issue'}
            </h2>
            <p className="text-sm text-gray-600 mb-6">
              {statusConfig?.message || 'There is an issue with your account status.'}
            </p>
            <div className="space-y-3">
              <button
                onClick={() => window.location.reload()}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                {statusConfig?.action || 'Refresh Page'}
              </button>
              <button
                onClick={() => window.location.href = '/profile'}
                className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Go to Profile Settings
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Check email verification requirement for console access
  if (requireEmailVerification && !user?.emailVerified) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <div className="mx-auto h-12 w-12 text-red-600 mb-4">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Email Verification Required
            </h2>
            <p className="text-sm text-gray-600 mb-6">
              Console access requires email verification. Please check your email and click the verification link to continue.
            </p>
            <div className="space-y-3">
              <button
                onClick={() => window.location.reload()}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                I've verified my email
              </button>
              <button
                onClick={() => window.location.href = '/profile'}
                className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Go to Profile Settings
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Check role-based access for specific console services
  if (requiredRoles.length > 0 && user && !requiredRoles.includes(user.role)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <div className="mx-auto h-12 w-12 text-red-600 mb-4">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L5.636 5.636" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Access Denied
            </h2>
            <p className="text-sm text-gray-600 mb-2">
              You don't have permission to access this service.
            </p>
            <p className="text-xs text-gray-500 mb-2">
              Required roles: {requiredRoles.join(', ')}
            </p>
            <p className="text-xs text-gray-500 mb-6">
              Your current role: {user.role}
            </p>
            <div className="space-y-3">
              <button
                onClick={() => window.history.back()}
                className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Go Back
              </button>
              <button
                onClick={() => window.location.href = '/dashboard'}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Return to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // User is authenticated and authorized - render console content
  return <>{children}</>;
};

export default ConsoleRoute;