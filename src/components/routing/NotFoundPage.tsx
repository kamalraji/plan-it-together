import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

export const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const handleGoBack = () => {
    navigate(-1);
  };

  const getHomeLink = () => {
    return isAuthenticated ? '/dashboard' : '/login';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-cream to-lavender/20 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-lg">
        <div className="text-center">

          {/* Error Message */}
          <h1 className="text-6xl font-bold bg-gradient-to-r from-coral to-teal bg-clip-text text-transparent mb-4">
            404
          </h1>
          <h2 className="text-2xl font-semibold text-foreground mb-4">
            Oops! Page Not Found
          </h2>
          <p className="text-muted-foreground mb-8 max-w-md mx-auto">
            Looks like this page decided to take a little adventure! Don't worry, we'll help you find your way back.
          </p>

          {/* Action Buttons */}
          <div className="space-y-4 sm:space-y-0 sm:space-x-4 sm:flex sm:justify-center mb-8">
            <button
              onClick={handleGoBack}
              className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 border border-coral/20 rounded-xl shadow-soft text-base font-medium text-coral bg-card/80 backdrop-blur-sm hover:bg-coral hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-coral transition-all duration-200 hover:scale-105"
            >
              <svg
                className="w-5 h-5 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
              Go Back
            </button>

            <Link
              to={getHomeLink()}
              className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 border border-transparent rounded-xl shadow-soft text-base font-medium text-white bg-gradient-to-r from-teal to-teal-light hover:shadow-doodle focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal transition-all duration-200 hover:scale-105"
            >
              <svg
                className="w-5 h-5 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                />
              </svg>
              {isAuthenticated ? 'Go to Dashboard' : 'Go to Login'}
            </Link>
          </div>

          {/* Friendly Helper */}
          <div className="bg-card/80 backdrop-blur-sm rounded-2xl border border-sunny/20 p-6 shadow-soft">
            <div className="flex items-center justify-center space-x-4 mb-4">
              <div className="text-left">
                <h3 className="font-semibold text-foreground">Need a hand?</h3>
                <p className="text-sm text-muted-foreground">We're here to help you find what you're looking for!</p>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row sm:justify-center space-y-2 sm:space-y-0 sm:space-x-6">
              <Link
                to="/dashboard/support"
                className="text-sm text-teal hover:text-teal-light transition-colors font-medium"
              >
                Help Center
              </Link>
              <Link
                to="/dashboard/support"
                className="text-sm text-teal hover:text-teal-light transition-colors font-medium"
              >
                Contact Support
              </Link>
              {isAuthenticated && (
                <Link
                  to="/dashboard"
                  className="text-sm text-teal hover:text-teal-light transition-colors font-medium"
                >
                  Dashboard
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;