import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link, useNavigate, useLocation, useParams } from 'react-router-dom';
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/looseClient';
import { AuthProvider, useAuth } from '../../hooks/useAuth';
import { UserRole } from '../../types';
import { ConsoleRoute } from './ConsoleRoute';
import { ConsoleLayout } from './ConsoleLayout';
import { NotFoundPage } from './NotFoundPage';
import { SearchPage } from './SearchPage';
import { MarketplaceService, OrganizationService as OrganizationServiceComponent } from './services';
import { HelpPage } from '../help';
import { NotificationPage } from './NotificationPage';
import { CommunicationPage } from './CommunicationPage';
import { LoginForm } from '../auth/LoginForm';
import { RegisterForm } from '../auth/RegisterForm';
import { AuthLayout } from '../auth/AuthLayout';
import { DashboardDataLab } from '../enhanced/DashboardDataLab';
import { DashboardRouter } from '../dashboard/DashboardRouter';
import { FollowedOrganizationsPage } from '../organization/FollowedOrganizationsPage';
import { ParticipantEventsPage } from '../events/ParticipantEventsPage';
import { EventLandingPage } from '../events/EventLandingPage';
import { OrgScopedLayout } from '../organization/OrgScopedLayout';
import { OrganizationRegistrationPage } from '../organization/OrganizationRegistrationPage';
import { JoinOrganizationPage } from '../organization/JoinOrganizationPage';
import { OrganizerOnboardingPage } from '../organization/OrganizerOnboardingPage';
import { ProfilePage } from '../profile/ProfilePage';
import { ProfileSettingsPage } from '../profile/ProfileSettingsPage';
import { PublicProfilePage } from '../profile/PublicProfilePage';
import { GlobalErrorBoundary } from '@/components/common/GlobalErrorBoundary';
import { OrganizerSpecificDashboard } from '../dashboard/OrganizerSpecificDashboard';
import { OrganizerDashboardLayout } from '../dashboard/OrganizerDashboardLayout';
import { ParticipantPortfolioPage } from '../portfolio/ParticipantPortfolioPage';
import { PortfolioPreviewCard } from '../portfolio/PortfolioPreviewCard';
import { OrganizationLandingPage } from '../organization/OrganizationLandingPage';
import { OrganizationProductsLandingPage } from '../organization/OrganizationProductsLandingPage';
import { VendorPublicProfilePage } from './services/VendorPublicProfilePage';
import { OrgScopedRedirect } from './OrgScopedRedirect';
import AttendflowLanding from '@/pages/AttendflowLanding';
import PricingPage from '@/pages/PricingPage';


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

// Forgot Password page using shared AuthLayout
const ForgotPasswordPage = () => {
  return (
    <AuthLayout>
      <div className="space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-coral to-teal bg-clip-text text-transparent mb-3">
            Forgot your password?
          </h2>
          <p className="text-sm text-muted-foreground">
            Password reset functionality will be implemented in upcoming updates.
          </p>
        </div>

        <div className="relative bg-white/5 backdrop-blur-2xl rounded-3xl border border-white/15 p-8 shadow-[0_18px_60px_rgba(0,0,0,0.55)]">
          <div className="space-y-4 text-center">
            <div>
              <h3 className="text-base font-semibold text-foreground mb-1">Coming soon</h3>
              <p className="text-sm text-muted-foreground">
                You&apos;ll be able to request a secure reset link to your email from here.
              </p>
            </div>

            <Link
              to="/login"
              className="inline-flex items-center justify-center w-full py-3 px-6 rounded-xl text-sm font-medium text-primary-foreground bg-gradient-to-r from-coral to-coral-light shadow-sm hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-coral transition-transform duration-200 hover:-translate-y-0.5"
            >
              Back to login
            </Link>
          </div>
        </div>
      </div>
    </AuthLayout>
  );
};

// Password Reset page placeholder using shared AuthLayout
const ResetPasswordPage = () => {
  return (
    <AuthLayout>
      <div className="space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-coral to-teal bg-clip-text text-transparent mb-3">
            Reset your password
          </h2>
          <p className="text-sm text-muted-foreground">
            The secure password reset experience will be available soon.
          </p>
        </div>

        <div className="relative bg-white/5 backdrop-blur-2xl rounded-3xl border border-white/15 p-8 shadow-[0_18px_60px_rgba(0,0,0,0.55)]">
          <div className="space-y-4 text-center">
            <p className="text-sm text-muted-foreground">
              Once implemented, this page will let you choose a new password after opening a
              verified reset link from your email.
            </p>
            <Link
              to="/login"
              className="inline-flex items-center justify-center w-full py-3 px-6 rounded-xl text-sm font-medium text-primary-foreground bg-gradient-to-r from-coral to-coral-light shadow-sm hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-coral transition-transform duration-200 hover:-translate-y-0.5"
            >
              Back to login
            </Link>
          </div>
        </div>
      </div>
    </AuthLayout>
  );
};

// Types for unified dashboard metrics
interface DashboardMetrics {
  activeEvents: number;
  draftEvents: number;
  completedEvents: number;
  totalRegistrations: number;
  activeWorkspaces: number;
  teamMembers: number;
  availableServices: number;
  activeBookings: number;
  totalRevenue: number;
}

// Console Dashboard using real backend metrics
export const ConsoleDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { data: metrics, isLoading, error } = useQuery<DashboardMetrics>({
    queryKey: ['dashboard-metrics'],
    queryFn: async () => {
      // Ensure we have an authenticated user so RLS-scoped metrics work correctly
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!userData?.user) {
        throw new Error('User not authenticated');
      }

      const [
        activeEventsRes,
        draftEventsRes,
        completedEventsRes,
        registrationsRes,
        activeWorkspacesRes,
        servicesRes,
        activeBookingsRes,
        revenueRes,
      ] = await Promise.all([
        supabase
          .from('events')
          .select('*', { count: 'exact', head: true })
          .in('status', ['PUBLISHED', 'ONGOING']),
        supabase
          .from('events')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'DRAFT'),
        supabase
          .from('events')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'COMPLETED'),
        supabase
          .from('registrations')
          .select('*', { count: 'exact', head: true }),
        supabase
          .from('workspaces')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'ACTIVE'),
        supabase
          .from('services')
          .select('*', { count: 'exact', head: true })
          .eq('is_active', true),
        supabase
          .from('bookings')
          .select('*', { count: 'exact', head: true })
          .in('status', ['PENDING', 'CONFIRMED']),
        supabase
          .from('bookings')
          .select('amount')
          .eq('status', 'COMPLETED'),
      ]);

      if (activeEventsRes.error) throw activeEventsRes.error;
      if (draftEventsRes.error) throw draftEventsRes.error;
      if (completedEventsRes.error) throw completedEventsRes.error;
      if (registrationsRes.error) throw registrationsRes.error;
      if (activeWorkspacesRes.error) throw activeWorkspacesRes.error;
      if (servicesRes.error) throw servicesRes.error;
      if (activeBookingsRes.error) throw activeBookingsRes.error;
      if (revenueRes.error) throw revenueRes.error;

      const totalRevenue = (revenueRes.data ?? []).reduce(
        (sum: number, row: { amount: number | null }) => sum + Number(row.amount ?? 0),
        0,
      );

      return {
        activeEvents: activeEventsRes.count ?? 0,
        draftEvents: draftEventsRes.count ?? 0,
        completedEvents: completedEventsRes.count ?? 0,
        totalRegistrations: registrationsRes.count ?? 0,
        activeWorkspaces: activeWorkspacesRes.count ?? 0,
        teamMembers: 0, // Team metrics will be wired to dedicated tables later
        availableServices: servicesRes.count ?? 0,
        activeBookings: activeBookingsRes.count ?? 0,
        totalRevenue,
      } satisfies DashboardMetrics;
    },
  });

  useEffect(() => {
    document.title = 'Dashboard | Thittam1Hub';

    const description =
      'Unified dashboard for events, workspaces, marketplace activity, and registrations in Thittam1Hub.';

    let meta = document.querySelector('meta[name="description"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute('name', 'description');
      document.head.appendChild(meta);
    }
    meta.setAttribute('content', description);

    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', window.location.origin + '/dashboard');
  }, []);

  return (
    <div className="px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-cream to-lavender/20 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="mb-12 text-center py-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-coral to-teal bg-clip-text text-transparent mb-4">
            Your Thittam1Hub Dashboard
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Live overview of your events, participants, and marketplace activity in one place.
          </p>
        </div>

        {isLoading && (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-coral" />
          </div>
        )}

        {error && (
          <div className="mb-8 max-w-2xl mx-auto rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            Unable to load live metrics right now. Data cards below may be empty.
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Events Card */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-coral/20 p-8 hover:shadow-doodle transition-all duration-300 hover:scale-105 hover:-translate-y-1 group">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-4">
                <h3 className="text-xl font-bold text-gray-900">Event Management</h3>
              </div>
            </div>
            <p className="text-gray-600 mb-6">Create, publish, and track your events and participants.</p>
            <div className="space-y-2 text-sm text-gray-500 mb-6">
              <div className="flex justify-between">
                <span>Active Events</span>
                <span className="font-semibold text-coral">{metrics?.activeEvents ?? 0}</span>
              </div>
              <div className="flex justify-between">
                <span>Draft Events</span>
                <span className="font-semibold text-teal">{metrics?.draftEvents ?? 0}</span>
              </div>
              <div className="flex justify-between">
                <span>Completed Events</span>
                <span className="font-semibold text-sunny">{metrics?.completedEvents ?? 0}</span>
              </div>
              <div className="flex justify-between">
                <span>Total Registrations</span>
                <span className="font-semibold text-gray-900">{metrics?.totalRegistrations ?? 0}</span>
              </div>
            </div>
            <button onClick={() => {
              const orgSlugCandidate = location.pathname.split('/')[1];
              if (orgSlugCandidate && orgSlugCandidate !== 'dashboard') {
                navigate(`/${orgSlugCandidate}/eventmanagement`);
              } else {
                navigate('/dashboard/eventmanagement');
              }
            }} className="w-full bg-gradient-to-r from-coral to-coral-light text-white font-semibold py-3 px-6 rounded-xl hover:shadow-soft transition-all duration-200 hover:scale-105">
              Go to Events
            </button>
          </div>

          {/* Workspaces Card */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-teal/20 p-8 hover:shadow-doodle transition-all duration-300 hover:scale-105 hover:-translate-y-1 group">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-4">
                <h3 className="text-xl font-bold text-gray-900">Workspaces</h3>
              </div>
            </div>
            <p className="text-gray-600 mb-6">Collaborate with your team on event prep and execution.</p>
            <div className="space-y-2 text-sm text-gray-500 mb-6">
              <div className="flex justify-between">
                <span>Active Workspaces</span>
                <span className="font-semibold text-teal">{metrics?.activeWorkspaces ?? 0}</span>
              </div>
              <div className="flex justify-between">
                <span>Team Members</span>
                <span className="font-semibold text-coral">{metrics?.teamMembers ?? 0}</span>
              </div>
            </div>
            <button onClick={() => {
              const orgSlugCandidate = location.pathname.split('/')[1];
              if (orgSlugCandidate && orgSlugCandidate !== 'dashboard') {
                navigate(`/${orgSlugCandidate}/workspaces`);
              } else {
                navigate('/dashboard/workspaces');
              }
            }} className="w-full bg-gradient-to-r from-teal to-teal-light text-white font-semibold py-3 px-6 rounded-xl hover:shadow-soft transition-all duration-200 hover:scale-105">
              Go to Workspaces
            </button>
          </div>

          {/* Marketplace Card */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-sunny/20 p-8 hover:shadow-doodle transition-all duration-300 hover:scale-105 hover:-translate-y-1 group">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-4">
                <h3 className="text-xl font-bold text-gray-900">Marketplace</h3>
              </div>
            </div>
            <p className="text-gray-600 mb-6">Discover and book verified vendors for your events.</p>
            <div className="space-y-2 text-sm text-gray-500 mb-6">
              <div className="flex justify-between">
                <span>Available Services</span>
                <span className="font-semibold text-sunny">{metrics?.availableServices ?? 0}</span>
              </div>
              <div className="flex justify-between">
                <span>Active Bookings</span>
                <span className="font-semibold text-coral">{metrics?.activeBookings ?? 0}</span>
              </div>
              <div className="flex justify-between">
                <span>Total Revenue</span>
                <span className="font-semibold text-gray-900">
                  {metrics ? `$${metrics.totalRevenue.toLocaleString()}` : '$0'}
                </span>
              </div>
            </div>
            <button
              onClick={() => window.location.href = '/marketplace'}
              className="w-full bg-gradient-to-r from-sunny to-sunny/80 text-white font-semibold py-3 px-6 rounded-xl hover:shadow-soft transition-all duration-200 hover:scale-105"
            >
              Go to Marketplace
            </button>
          </div>
        </div>

        <div className="mt-16 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">Quick Actions</h2>
          <div className="flex flex-wrap justify-center gap-4">
            <button className="bg-white/80 backdrop-blur-sm border border-coral/20 text-coral font-semibold py-3 px-6 rounded-xl hover:bg-coral hover:text-white transition-all duration-200 hover:scale-105 hover:shadow-soft">
              Create Event
            </button>
            <button className="bg-white/80 backdrop-blur-sm border border-teal/20 text-teal font-semibold py-3 px-6 rounded-xl hover:bg-teal hover:text-white transition-all duration-200 hover:scale-105 hover:shadow-soft">
              Join Workspace
            </button>
            <button
              onClick={() => window.location.href = '/marketplace'}
              className="bg-white/80 backdrop-blur-sm border border-sunny/20 text-sunny font-semibold py-3 px-6 rounded-xl hover:bg-sunny hover:text-white transition-all duration-200 hover:scale-105 hover:shadow-soft"
            >
              Browse Services
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Profile service routes
const ProfileService = () => {
  return (
    <Routes>
      <Route index element={<ProfilePage />} />
      <Route path="settings" element={<ProfileSettingsPage />} />
      <Route path=":userId/public" element={<PublicProfilePage />} />
      <Route path="*" element={<Navigate to="." replace />} />
    </Routes>
  );
};

const RootLandingRoute: React.FC = () => {
  const { isAuthenticated } = useAuth();

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <AttendflowLanding />;
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

const EmbedPortfolioRoute: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();

  useEffect(() => {
    document.title = 'Participant Portfolio Preview | Thittam1Hub';

    const description =
      'Compact public portfolio preview card for embedding participant profiles from Thittam1Hub.';

    let meta = document.querySelector('meta[name="description"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute('name', 'description');
      document.head.appendChild(meta);
    }
    meta.setAttribute('content', description);

    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', window.location.origin + window.location.pathname);
  }, []);

  if (!userId) return null;

  return (
    <main className="min-h-screen flex items-center justify-center bg-background">
      <div className="max-w-md w-full p-4">
        <PortfolioPreviewCard userId={userId} />
      </div>
    </main>
  );
};

export const AppRouter: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
             {/* Attendflow-style marketing landing at root */}
             <Route path="/" element={<RootLandingRoute />} />
             <Route path="/pricing" element={<PricingPage />} />

            {/* Public authentication routes */}
            <Route path="/login" element={<LoginForm />} />
            <Route path="/register" element={<RegisterForm />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />

            {/* Organizer onboarding - appears for new organizers */}
            <Route
              path="/dashboard/onboarding/organizer"
              element={
                <ConsoleRoute requiredRoles={[UserRole.ORGANIZER, UserRole.SUPER_ADMIN]}>
                  <OrganizerOnboardingPage />
                </ConsoleRoute>
              }
            />

            {/* Organizer onboarding - legacy entry point now redirects to organization discovery */}
            <Route
              path="/onboarding/organization"
              element={
                <ConsoleRoute requireEmailVerification={false}>
                  <Navigate to="/dashboard/organizations/join" replace />
                </ConsoleRoute>
              }
            />

            {/* Create organization page */}
            <Route
              path="/organizations/create"
              element={
                <ConsoleRoute requireEmailVerification={false}>
                  <OrganizationRegistrationPage />
                </ConsoleRoute>
              }
            />

            {/* Public participant event listing */}
            <Route path="/events" element={<ParticipantEventsPage />} />
            <Route path="/events/:eventId/*" element={<EventLandingPage />} />

            {/* Public participant portfolio */}
            <Route path="/portfolio/:userId" element={<ParticipantPortfolioPage />} />
            <Route path="/embed/portfolio/:userId" element={<EmbedPortfolioRoute />} />

            {/* Public vendor profile */}
            <Route path="/vendor/:vendorId" element={<VendorPublicProfilePage />} />

            {/* Public organization landing by slug */}
            <Route path="/:orgSlug" element={<OrganizationLandingPage />} />
            <Route
              path="/:orgSlug/products"
              element={<OrganizationProductsLandingPage />}
            />

            {/* Organization-scoped organizer console */}
            <Route
              path="/:orgSlug/*"
              element={
                <ConsoleRoute requiredRoles={[UserRole.ORGANIZER, UserRole.SUPER_ADMIN]}>
                  <GlobalErrorBoundary>
                    <OrgScopedLayout />
                  </GlobalErrorBoundary>
                </ConsoleRoute>
              }
            />

            {/* Organizer root dashboard (org-agnostic) */}
            <Route
              path="/organizer/dashboard"
              element={
                <ConsoleRoute requiredRoles={[UserRole.ORGANIZER, UserRole.SUPER_ADMIN]}>
                  <GlobalErrorBoundary>
                    <OrganizerDashboardLayout />
                  </GlobalErrorBoundary>
                </ConsoleRoute>
              }
            >
              <Route index element={<OrganizerSpecificDashboard />} />
            </Route>

            {/* Dashboard routes - all protected with enhanced authentication */}
            <Route
              path="/dashboard"
              element={
                <ConsoleRoute>
                  <GlobalErrorBoundary>
                    <ConsoleLayout />
                  </GlobalErrorBoundary>
                </ConsoleRoute>
              }
            >
              <Route index element={<DashboardRouter />} />
              <Route path="home" element={<DashboardRouter />} />
              <Route
                path="followed-organizations"
                element={
                  <ConsoleRoute requireEmailVerification={false}>
                    <FollowedOrganizationsPage />
                  </ConsoleRoute>
                }
              />
              <Route
                path="participant-events"
                element={
                  <ConsoleRoute requireEmailVerification={false}>
                    <ParticipantEventsPage />
                  </ConsoleRoute>
                }
              />
              <Route
                path="organizations/join"
                element={
                  <ConsoleRoute requireEmailVerification={false}>
                    <JoinOrganizationPage />
                  </ConsoleRoute>
                }
              />
              {/* Redirect organizer routes to org-scoped equivalents */}
              <Route
                path="eventmanagement/*"
                element={
                  <ConsoleRoute requiredRoles={[UserRole.ORGANIZER, UserRole.SUPER_ADMIN]}>
                    <OrgScopedRedirect servicePath="eventmanagement" fallbackPath="/dashboard" />
                  </ConsoleRoute>
                }
              />
              <Route
                path="workspaces/*"
                element={
                  <ConsoleRoute requiredRoles={[UserRole.ORGANIZER, UserRole.SUPER_ADMIN]}>
                    <OrgScopedRedirect servicePath="workspaces" fallbackPath="/dashboard" />
                  </ConsoleRoute>
                }
              />
              <Route
                path="marketplace/*"
                element={
                  <ConsoleRoute requiredRoles={[UserRole.ORGANIZER, UserRole.SUPER_ADMIN]}>
                    <OrgScopedRedirect servicePath="marketplace" fallbackPath="/marketplace" />
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
                  <ConsoleRoute requiredRoles={[UserRole.ORGANIZER, UserRole.SUPER_ADMIN]}>
                    <OrgScopedRedirect servicePath="analytics" fallbackPath="/dashboard" />
                  </ConsoleRoute>
                }
              />
              {/* Admin routes moved to /:orgSlug/admin - redirect legacy paths */}
              <Route path="admin/*" element={<Navigate to="/dashboard" replace />} />
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
              <Route
                path="data-lab"
                element={
                  <ConsoleRoute>
                    <DashboardDataLab />
                  </ConsoleRoute>
                }
              />
            </Route>

            {/* Standalone Marketplace - public marketplace for browsing services */}
            <Route
              path="/marketplace/*"
              element={
                <ConsoleRoute requiredRoles={[UserRole.ORGANIZER, UserRole.SUPER_ADMIN]}>
                  <MarketplaceService />
                </ConsoleRoute>
              }
            />

            {/* Legacy console redirect */}
            <Route path="/console/*" element={<Navigate to="/dashboard" replace />} />

            {/* 404 Not Found - must be last */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes >
        </BrowserRouter >
      </AuthProvider >
    </QueryClientProvider >
  );
};

export default AppRouter;