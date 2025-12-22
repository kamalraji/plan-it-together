import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '../../hooks/useAuth';
import { ProtectedRoute } from '../auth/ProtectedRoute';
import { NotFoundPage } from './NotFoundPage';
import { UserRole } from '../../types';

// Create a query client instance
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// Placeholder components for now - these will be implemented in later tasks
const LoginPage = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="max-w-md w-full space-y-8">
      <div className="text-center">
        <h2 className="mt-6 text-3xl font-extrabold text-gray-900">Login Page</h2>
        <p className="mt-2 text-sm text-gray-600">Login functionality will be implemented in later tasks</p>
      </div>
    </div>
  </div>
);

const RegisterPage = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="max-w-md w-full space-y-8">
      <div className="text-center">
        <h2 className="mt-6 text-3xl font-extrabold text-gray-900">Register Page</h2>
        <p className="mt-2 text-sm text-gray-600">Registration functionality will be implemented in later tasks</p>
      </div>
    </div>
  </div>
);

const DashboardPage = () => (
  <div className="min-h-screen bg-gray-50 p-8">
    <div className="max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Dashboard</h1>
      <p className="text-gray-600">Dashboard functionality will be implemented in later tasks</p>
    </div>
  </div>
);

interface RouteConfig {
  path: string;
  element: React.ReactElement;
  protected?: boolean;
  roles?: UserRole[];
  children?: RouteConfig[];
}

// Route configuration
const routes: RouteConfig[] = [
  {
    path: '/login',
    element: <LoginPage />,
    protected: false,
  },
  {
    path: '/register',
    element: <RegisterPage />,
    protected: false,
  },
  {
    path: '/dashboard',
    element: <DashboardPage />,
    protected: true,
  },
];

// Component to render routes recursively
const RouteRenderer: React.FC<{ routes: RouteConfig[] }> = ({ routes }) => {
  return (
    <>
      {routes.map((route, index) => {
        const element = route.protected ? (
          <ProtectedRoute requiredRoles={route.roles}>
            {route.element}
          </ProtectedRoute>
        ) : (
          route.element
        );

        return (
          <Route key={index} path={route.path} element={element}>
            {route.children && <RouteRenderer routes={route.children} />}
          </Route>
        );
      })}
    </>
  );
};

export const AppRouter: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Root redirect */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            
            {/* Render configured routes */}
            <RouteRenderer routes={routes} />
            
            {/* 404 Not Found - must be last */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default AppRouter;