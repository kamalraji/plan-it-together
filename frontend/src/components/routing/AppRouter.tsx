import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '../../hooks/useAuth';
import { UserRole } from '../../types';
import { ConsoleRoute } from './ConsoleRoute';
import { ConsoleLayout } from './ConsoleLayout';
import { NotFoundPage } from './NotFoundPage';
import { SearchPage } from './SearchPage';
import { EventService, MarketplaceService, OrganizationService as OrganizationServiceComponent } from './services';
import { HelpPage } from '../help';
import { NotificationPage } from './NotificationPage';
import { CommunicationPage } from './CommunicationPage';
import { LoginForm } from '../auth/LoginForm';
import { RegisterForm } from '../auth/RegisterForm';

// Create a query client instance with optimized settings for the console application
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 10 * 60 * 1000, // 10 minutes
    },
    mutations: {
      retry: 1,
    },
  },
});

// Forgot Password placeholder - will be implemented in later tasks
const ForgotPasswordPage = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="max-w-md w-full space-y-8">
      <div className="text-center">
        <h2 className="mt-6 text-3xl font-extrabold text-gray-900">Reset Password</h2>
        <p className="mt-2 text-sm text-gray-600">Password reset functionality will be implemented in later tasks</p>
        <div className="mt-4">
          <a 
            href="/login" 
            className="font-medium text-indigo-600 hover:text-indigo-500"
          >
            Back to Login
          </a>
        </div>
      </div>
    </div>
  </div>
);

// AWS Console-style placeholder pages
const ConsoleDashboard = () => (
  <div className="px-4 sm:px-6 lg:px-8">
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Console Dashboard</h1>
        <p className="mt-2 text-gray-600">Welcome to your AWS-style console dashboard</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Service Cards */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center space-x-3 mb-4">
            <span className="text-2xl">📅</span>
            <h3 className="text-lg font-semibold text-gray-900">Event Management</h3>
          </div>
          <p className="text-gray-600 text-sm mb-4">Create and manage your events</p>
          <div className="text-sm text-gray-500">
            <div>Active Events: 5</div>
            <div>Draft Events: 2</div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center space-x-3 mb-4">
            <span className="text-2xl">👥</span>
            <h3 className="text-lg font-semibold text-gray-900">Workspaces</h3>
          </div>
          <p className="text-gray-600 text-sm mb-4">Collaborate with your team</p>
          <div className="text-sm text-gray-500">
            <div>Active Workspaces: 3</div>
            <div>Team Members: 12</div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center space-x-3 mb-4">
            <span className="text-2xl">🛒</span>
            <h3 className="text-lg font-semibold text-gray-900">Marketplace</h3>
          </div>
          <p className="text-gray-600 text-sm mb-4">Find and book services</p>
          <div className="text-sm text-gray-500">
            <div>Available Services: 150+</div>
            <div>Active Bookings: 8</div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

const WorkspaceService = () => (
  <div className="px-4 sm:px-6 lg:px-8">
    <div className="max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Workspace Service</h1>
      <p className="text-gray-600">Workspace functionality will be implemented in later tasks</p>
    </div>
  </div>
);

const AnalyticsService = () => (
  <div className="px-4 sm:px-6 lg:px-8">
    <div className="max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Analytics Service</h1>
      <p className="text-gray-600">Analytics functionality will be implemented in later tasks</p>
    </div>
  </div>
);

const ProfileService = () => (
  <div className="px-4 sm:px-6 lg:px-8">
    <div className="max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Profile Management</h1>
      <p className="text-gray-600">Profile management functionality will be implemented in later tasks</p>
    </div>
  </div>
);

const SupportService = () => {
  // Get current context from URL or other means
  const currentContext = window.location.pathname.includes('/events') ? 'events' :
                         window.location.pathname.includes('/workspaces') ? 'workspaces' :
                         window.location.pathname.includes('/marketplace') ? 'marketplace' :
                         undefined;

  return <HelpPage currentContext={currentContext} />;
};

const NotificationService = () => {
  return <NotificationPage />;
};

const CommunicationService = () => {
  return <CommunicationPage />;
};

export const AppRouter: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Root redirect to console */}
            <Route path="/" element={<Navigate to="/console" replace />} />
            
            {/* Public authentication routes */}
            <Route path="/login" element={<LoginForm />} />
            <Route path="/register" element={<RegisterForm />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            
            {/* Console routes - all protected with enhanced console authentication */}
            <Route
              path="/console"
              element={
                <ConsoleRoute>
                  <ConsoleLayout />
                </ConsoleRoute>
              }
            >
              {/* Console dashboard - default route */}
              <Route index element={<ConsoleDashboard />} />
              <Route path="dashboard" element={<ConsoleDashboard />} />
              
              {/* Service routes with role-based access control */}
              <Route 
                path="events/*" 
                element={
                  <ConsoleRoute requiredRoles={[UserRole.ORGANIZER, UserRole.SUPER_ADMIN]}>
                    <EventService />
                  </ConsoleRoute>
                } 
              />
              <Route 
                path="workspaces/*" 
                element={
                  <ConsoleRoute>
                    <WorkspaceService />
                  </ConsoleRoute>
                } 
              />
              <Route 
                path="marketplace/*" 
                element={
                  <ConsoleRoute>
                    <MarketplaceService />
                  </ConsoleRoute>
                } 
              />
              <Route 
                path="organizations/*" 
                element={
                  <ConsoleRoute requiredRoles={[UserRole.ORGANIZER, UserRole.SUPER_ADMIN]}>
                    <OrganizationServiceComponent />
                  </ConsoleRoute>
                } 
              />
              <Route 
                path="analytics/*" 
                element={
                  <ConsoleRoute>
                    <AnalyticsService />
                  </ConsoleRoute>
                } 
              />
              <Route 
                path="profile/*" 
                element={
                  <ConsoleRoute requireEmailVerification={false}>
                    <ProfileService />
                  </ConsoleRoute>
                } 
              />
              <Route 
                path="support/*" 
                element={
                  <ConsoleRoute requireEmailVerification={false}>
                    <SupportService />
                  </ConsoleRoute>
                } 
              />
              <Route 
                path="notifications/*" 
                element={
                  <ConsoleRoute requireEmailVerification={false}>
                    <NotificationService />
                  </ConsoleRoute>
                } 
              />
              <Route 
                path="communications/*" 
                element={
                  <ConsoleRoute requireEmailVerification={false}>
                    <CommunicationService />
                  </ConsoleRoute>
                } 
              />
              <Route 
                path="search" 
                element={
                  <ConsoleRoute requireEmailVerification={false}>
                    <SearchPage />
                  </ConsoleRoute>
                } 
              />
            </Route>

            {/* Legacy dashboard redirect */}
            <Route path="/dashboard" element={<Navigate to="/console" replace />} />
            
            {/* 404 Not Found - must be last */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default AppRouter;