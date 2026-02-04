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
import { getCharacter } from '../doodles';

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

// Enhanced Forgot Password page with doodle design system
const ForgotPasswordPage = () => {
  const LightbulbIdea = getCharacter('lightbulb-idea');
  const HeartDoodle = getCharacter('heart-doodle');
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-lavender/5 to-mint/10">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="flex justify-center mb-6">
            {LightbulbIdea && (
              <LightbulbIdea 
                size="xl" 
                color="sunny" 
                animation="pop-in" 
                className="animate-pop-in" 
              />
            )}
          </div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-coral to-teal bg-clip-text text-transparent mb-4">
            Reset Password
          </h2>
          <p className="text-gray-600 mb-8">
            Don't worry! Password reset functionality will be implemented in later tasks
          </p>
          
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-coral/20 p-8 shadow-soft">
            <div className="flex items-center justify-center space-x-4 mb-6">
              {HeartDoodle && (
                <HeartDoodle 
                  size="md" 
                  color="coral" 
                  animation="float" 
                />
              )}
              <div className="text-left">
                <h3 className="font-semibold text-gray-900">Coming Soon!</h3>
                <p className="text-sm text-gray-600">We're working on this feature</p>
              </div>
            </div>
            
            <Link 
              to="/login" 
              className="inline-flex items-center justify-center w-full py-3 px-6 border border-transparent rounded-xl text-base font-medium text-white bg-gradient-to-r from-coral to-coral-light hover:shadow-doodle transition-all duration-200 hover:scale-105"
            >
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

// Enhanced Console Dashboard with doodle design system
const ConsoleDashboard = () => {
  const CalendarDoodle = getCharacter('calendar-doodle');
  const PeopleGroup = getCharacter('people-group');
  const RocketDoodle = getCharacter('rocket-doodle');
  const WavingPerson = getCharacter('waving-person');
  
  return (
    <div className="px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-cream to-lavender/20 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Hero Section with Doodle Character */}
        <div className="mb-12 text-center py-8">
          <div className="flex justify-center mb-6">
            {WavingPerson && (
              <WavingPerson 
                size="xl" 
                animation="wave" 
                className="animate-float" 
              />
            )}
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-coral to-teal bg-clip-text text-transparent mb-4">
            Welcome to Your Console
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Manage your events, collaborate with teams, and discover amazing services - all in one delightful place
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Event Management Card */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-coral/20 p-8 hover:shadow-doodle transition-all duration-300 hover:scale-105 hover:-translate-y-1 group">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-4">
                {CalendarDoodle && (
                  <CalendarDoodle 
                    size="lg" 
                    color="coral" 
                    className="group-hover:animate-bounce-gentle" 
                  />
                )}
                <h3 className="text-xl font-bold text-gray-900">Event Management</h3>
              </div>
            </div>
            <p className="text-gray-600 mb-6">Create and manage your events with style</p>
            <div className="space-y-2 text-sm text-gray-500 mb-6">
              <div className="flex justify-between">
                <span>Active Events:</span>
                <span className="font-semibold text-coral">5</span>
              </div>
              <div className="flex justify-between">
                <span>Draft Events:</span>
                <span className="font-semibold text-teal">2</span>
              </div>
            </div>
            <button className="w-full bg-gradient-to-r from-coral to-coral-light text-white font-semibold py-3 px-6 rounded-xl hover:shadow-soft transition-all duration-200 hover:scale-105">
              Manage Events
            </button>
          </div>

          {/* Workspaces Card */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-teal/20 p-8 hover:shadow-doodle transition-all duration-300 hover:scale-105 hover:-translate-y-1 group">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-4">
                {PeopleGroup && (
                  <PeopleGroup 
                    size="lg" 
                    color="teal" 
                    className="group-hover:animate-float" 
                  />
                )}
                <h3 className="text-xl font-bold text-gray-900">Workspaces</h3>
              </div>
            </div>
            <p className="text-gray-600 mb-6">Collaborate with your amazing team</p>
            <div className="space-y-2 text-sm text-gray-500 mb-6">
              <div className="flex justify-between">
                <span>Active Workspaces:</span>
                <span className="font-semibold text-teal">3</span>
              </div>
              <div className="flex justify-between">
                <span>Team Members:</span>
                <span className="font-semibold text-coral">12</span>
              </div>
            </div>
            <button className="w-full bg-gradient-to-r from-teal to-teal-light text-white font-semibold py-3 px-6 rounded-xl hover:shadow-soft transition-all duration-200 hover:scale-105">
              View Workspaces
            </button>
          </div>

          {/* Marketplace Card */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-sunny/20 p-8 hover:shadow-doodle transition-all duration-300 hover:scale-105 hover:-translate-y-1 group">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-4">
                {RocketDoodle && (
                  <RocketDoodle 
                    size="lg" 
                    color="sunny" 
                    className="group-hover:animate-slide-up" 
                  />
                )}
                <h3 className="text-xl font-bold text-gray-900">Marketplace</h3>
              </div>
            </div>
            <p className="text-gray-600 mb-6">Discover and book incredible services</p>
            <div className="space-y-2 text-sm text-gray-500 mb-6">
              <div className="flex justify-between">
                <span>Available Services:</span>
                <span className="font-semibold text-sunny">150+</span>
              </div>
              <div className="flex justify-between">
                <span>Active Bookings:</span>
                <span className="font-semibold text-coral">8</span>
              </div>
            </div>
            <button className="w-full bg-gradient-to-r from-sunny to-sunny/80 text-white font-semibold py-3 px-6 rounded-xl hover:shadow-soft transition-all duration-200 hover:scale-105">
              Explore Marketplace
            </button>
          </div>
        </div>

        {/* Quick Actions Section */}
        <div className="mt-16 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">Quick Actions</h2>
          <div className="flex flex-wrap justify-center gap-4">
            <button className="bg-white/80 backdrop-blur-sm border border-coral/20 text-coral font-semibold py-3 px-6 rounded-xl hover:bg-coral hover:text-white transition-all duration-200 hover:scale-105 hover:shadow-soft">
              Create Event
            </button>
            <button className="bg-white/80 backdrop-blur-sm border border-teal/20 text-teal font-semibold py-3 px-6 rounded-xl hover:bg-teal hover:text-white transition-all duration-200 hover:scale-105 hover:shadow-soft">
              Join Workspace
            </button>
            <button className="bg-white/80 backdrop-blur-sm border border-sunny/20 text-sunny font-semibold py-3 px-6 rounded-xl hover:bg-sunny hover:text-white transition-all duration-200 hover:scale-105 hover:shadow-soft">
              Browse Services
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const WorkspaceService = () => {
  const PeopleGroup = getCharacter('people-group');
  const LightbulbIdea = getCharacter('lightbulb-idea');
  
  return (
    <div className="px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-teal/5 to-mint/10 min-h-screen">
      <div className="max-w-7xl mx-auto py-8">
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            {PeopleGroup && (
              <PeopleGroup 
                size="xl" 
                color="teal" 
                animation="float" 
                className="animate-float" 
              />
            )}
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-teal to-mint bg-clip-text text-transparent mb-4">
            Workspace Service
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Collaborate, create, and achieve amazing things together
          </p>
        </div>
        
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-teal/20 p-8 shadow-soft">
          <div className="flex items-center space-x-4 mb-6">
            {LightbulbIdea && (
              <LightbulbIdea 
                size="md" 
                color="sunny" 
                animation="pop-in" 
              />
            )}
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Coming Soon!</h2>
              <p className="text-gray-600">Workspace functionality will be implemented in later tasks</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
            <div className="text-center p-4 bg-teal/5 rounded-xl">
              <h3 className="font-semibold text-teal mb-2">Team Collaboration</h3>
              <p className="text-sm text-gray-600">Work together seamlessly</p>
            </div>
            <div className="text-center p-4 bg-mint/5 rounded-xl">
              <h3 className="font-semibold text-teal mb-2">Project Management</h3>
              <p className="text-sm text-gray-600">Organize your projects</p>
            </div>
            <div className="text-center p-4 bg-teal/5 rounded-xl">
              <h3 className="font-semibold text-teal mb-2">Real-time Updates</h3>
              <p className="text-sm text-gray-600">Stay in sync with your team</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const AnalyticsService = () => {
  const TrophyDoodle = getCharacter('trophy-doodle');
  const RocketDoodle = getCharacter('rocket-doodle');
  
  return (
    <div className="px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-sunny/5 to-coral/10 min-h-screen">
      <div className="max-w-7xl mx-auto py-8">
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            {TrophyDoodle && (
              <TrophyDoodle 
                size="xl" 
                color="sunny" 
                animation="bounce" 
                className="animate-bounce-gentle" 
              />
            )}
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-sunny to-coral bg-clip-text text-transparent mb-4">
            Analytics Service
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Discover insights and track your success with beautiful analytics
          </p>
        </div>
        
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-sunny/20 p-8 shadow-soft">
          <div className="flex items-center space-x-4 mb-6">
            {RocketDoodle && (
              <RocketDoodle 
                size="md" 
                color="coral" 
                animation="slide-up" 
              />
            )}
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Powerful Analytics Coming Soon!</h2>
              <p className="text-gray-600">Analytics functionality will be implemented in later tasks</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
            <div className="text-center p-4 bg-sunny/5 rounded-xl">
              <h3 className="font-semibold text-sunny mb-2">Event Metrics</h3>
              <p className="text-sm text-gray-600">Track event performance</p>
            </div>
            <div className="text-center p-4 bg-coral/5 rounded-xl">
              <h3 className="font-semibold text-coral mb-2">User Insights</h3>
              <p className="text-sm text-gray-600">Understand your audience</p>
            </div>
            <div className="text-center p-4 bg-sunny/5 rounded-xl">
              <h3 className="font-semibold text-sunny mb-2">Revenue Reports</h3>
              <p className="text-sm text-gray-600">Monitor your earnings</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const ProfileService = () => {
  const WavingPerson = getCharacter('waving-person');
  const CertificateBadge = getCharacter('certificate-badge');
  
  return (
    <div className="px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-lavender/5 to-cream/20 min-h-screen">
      <div className="max-w-7xl mx-auto py-8">
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            {WavingPerson && (
              <WavingPerson 
                size="xl" 
                color="coral" 
                animation="wave" 
                className="animate-wave" 
              />
            )}
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-coral to-lavender bg-clip-text text-transparent mb-4">
            Profile Management
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Customize your profile and showcase your achievements
          </p>
        </div>
        
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-coral/20 p-8 shadow-soft">
          <div className="flex items-center space-x-4 mb-6">
            {CertificateBadge && (
              <CertificateBadge 
                size="md" 
                color="sunny" 
                animation="pop-in" 
              />
            )}
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Your Profile Awaits!</h2>
              <p className="text-gray-600">Profile management functionality will be implemented in later tasks</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
            <div className="text-center p-4 bg-coral/5 rounded-xl">
              <h3 className="font-semibold text-coral mb-2">Personal Info</h3>
              <p className="text-sm text-gray-600">Update your details</p>
            </div>
            <div className="text-center p-4 bg-lavender/5 rounded-xl">
              <h3 className="font-semibold text-lavender mb-2">Achievements</h3>
              <p className="text-sm text-gray-600">Show off your badges</p>
            </div>
            <div className="text-center p-4 bg-coral/5 rounded-xl">
              <h3 className="font-semibold text-coral mb-2">Preferences</h3>
              <p className="text-sm text-gray-600">Customize your experience</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

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