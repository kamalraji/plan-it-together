import React, { useCallback } from 'react';
import { Navigate, Route, Routes, useParams, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useMyMemberOrganizations, useOrganizationBySlug } from '@/hooks/useOrganization';
import { OrganizerDashboard } from '@/components/dashboard/OrganizerDashboard';
import { EventService, WorkspaceService, OrganizationService } from '@/components/routing/services';
import { OrganizationProvider } from './OrganizationContext';
import { OrganizationAnalyticsDashboard } from './OrganizationAnalyticsDashboard';
import { OrganizationTeamManagement } from './OrganizationTeamManagement';
import { SidebarInset, SidebarProvider, useSidebar } from '@/components/ui/sidebar';
import { OrganizationSidebar } from './OrganizationSidebar';
import { ConsoleHeader } from '@/components/routing/ConsoleHeader';
import { OrgSettingsDashboard } from './OrgSettingsDashboard';
import { OrgStorySettingsPage } from './OrgStorySettingsPage';
import { OrgMarketplacePage } from '@/components/routing/services/OrgMarketplacePage';
import { EventPageBuilder } from '@/components/events/EventPageBuilder';

/**
 * Thin wrapper that reuses the global ConsoleHeader but
 * wires the three-line menu to the Shadcn sidebar for org-scoped routes.
 */
const OrgConsoleHeader: React.FC<{ user: any; onLogout: () => Promise<void> }> = ({ user, onLogout }) => {
  const { toggleSidebar } = useSidebar();

  const handleServiceChange = useCallback((service: string) => {
    console.log('Org console service change:', service);
  }, []);

  const handleSearch = useCallback((query: string) => {
    console.log('Org console global search:', query);
  }, []);

  return (
    <ConsoleHeader
      user={user}
      onServiceChange={handleServiceChange}
      onSearch={handleSearch}
      onLogout={onLogout}
      onToggleMobileMenu={toggleSidebar}
    />
  );
};

export const OrgScopedLayout: React.FC = () => {
  const { orgSlug } = useParams<{ orgSlug: string }>();
  const location = useLocation();
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const { data: memberOrganizations, isLoading: orgsLoading } = useMyMemberOrganizations();
  const { data: organization, isLoading: orgLoading } = useOrganizationBySlug(orgSlug || '');

  const isLoadingAny = isLoading || orgsLoading || orgLoading;

  const handleLogout = useCallback(async () => {
    await logout();
  }, [logout]);

  // Check if current route is the page builder (needs fullscreen)
  const isPageBuilder = location.pathname.includes('/page-builder');

  if (isLoadingAny) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
      </div>
    );
  }

  if (!isAuthenticated || !user || !organization || !orgSlug) {
    return <Navigate to="/login" replace />;
  }

  // Treat org owners as implicit members so legacy orgs remain accessible
  const isMemberOfOrg =
    !!memberOrganizations?.some((org: { id: string }) => org.id === organization.id) ||
    organization.owner_id === user.id;

  if (!isMemberOfOrg) {
    // User is authenticated but not a member of this organization; send them to generic dashboard
    return <Navigate to="/dashboard" replace />;
  }

  // Render page builder fullscreen without sidebar/header
  if (isPageBuilder) {
    return (
      <OrganizationProvider value={{ organization }}>
        <Routes>
          <Route path="eventmanagement/:eventId/page-builder" element={<EventPageBuilder />} />
        </Routes>
      </OrganizationProvider>
    );
  }

  return (
    <OrganizationProvider value={{ organization }}>
      <SidebarProvider defaultOpen={false} className="flex-col">
        {/* Global console header fixed at the top */}
        <OrgConsoleHeader user={user} onLogout={handleLogout} />

        {/* Sidebar + content, padded so it sits below the fixed header */}
        <div className="relative min-h-screen w-full bg-gradient-to-br from-background via-background/95 to-background/90 overflow-hidden">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_hsl(var(--primary)/0.20),_transparent_55%),radial-gradient(circle_at_bottom,_hsl(var(--primary)/0.10),_transparent_55%)]" />
          <div className="relative flex w-full pt-16 items-stretch">
            <OrganizationSidebar />

            <SidebarInset className="flex justify-center overflow-hidden w-full">
              <div className="mx-2 sm:mx-4 lg:mx-6 my-4 sm:my-6 w-full rounded-2xl sm:rounded-3xl border border-border/60 bg-card/75 px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 shadow-lg shadow-primary/20 backdrop-blur-xl animate-fade-in overflow-x-hidden">
                <Routes>
                  <Route path="dashboard" element={<OrganizerDashboard />} />
                  <Route path="settings" element={<Navigate to="settings/dashboard" replace />} />
                  <Route path="settings/dashboard" element={<OrgSettingsDashboard />} />
                  <Route path="settings/story" element={<OrgStorySettingsPage />} />
                  <Route path="eventmanagement/*" element={<EventService />} />
                  <Route path="workspaces/*" element={<WorkspaceService />} />
                  <Route path="marketplace" element={<OrgMarketplacePage />} />
                  <Route path="organizations/*" element={<OrganizationService />} />
                  <Route path="analytics" element={<OrganizationAnalyticsDashboard />} />
                  <Route path="team" element={<OrganizationTeamManagement />} />
                  <Route path="*" element={<Navigate to="dashboard" replace />} />
                </Routes>
              </div>
            </SidebarInset>
          </div>
        </div>

      </SidebarProvider>
    </OrganizationProvider>
  );
};
