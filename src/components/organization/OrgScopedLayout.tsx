import React, { useCallback } from 'react';
import { Navigate, Route, Routes, useParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useMyOrganizations, useOrganizationBySlug } from '@/hooks/useOrganization';
import { OrganizerDashboard } from '@/components/dashboard/OrganizerDashboard';
import { EventService, WorkspaceService, OrganizationService } from '@/components/routing/services';
import { OrganizationProvider } from './OrganizationContext';
import { OrganizationAnalyticsDashboard } from './OrganizationAnalyticsDashboard';
import { OrganizationTeamManagement } from './OrganizationTeamManagement';
import { SidebarInset, SidebarProvider, useSidebar } from '@/components/ui/sidebar';
import { OrganizationSidebar } from './OrganizationSidebar';
import { ConsoleHeader } from '@/components/routing/ConsoleHeader';

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
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const { data: myOrganizations, isLoading: orgsLoading } = useMyOrganizations();
  const { data: organization, isLoading: orgLoading } = useOrganizationBySlug(orgSlug || '');

  const isLoadingAny = isLoading || orgsLoading || orgLoading;

  const handleLogout = useCallback(async () => {
    await logout();
  }, [logout]);

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

  const isAdminOfOrg = !!myOrganizations?.some((org: { id: string }) => org.id === organization.id);
  const allowedAdminOrgSlug = 'thittam1hub';

  if (!isAdminOfOrg || orgSlug !== allowedAdminOrgSlug) {
    // User is authenticated but not an admin of this org, or trying to access a non-primary org; send them back to generic dashboard
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <OrganizationProvider value={{ organization }}>
      <SidebarProvider defaultOpen={false}>
        {/* Global console header fixed at the top */}
        <OrgConsoleHeader user={user} onLogout={handleLogout} />

        {/* Sidebar + content, padded so it sits below the fixed header */}
        <div className="min-h-screen flex w-full bg-background pt-16">
          <OrganizationSidebar />

          <SidebarInset>
            <div className="px-4 py-6">
              <Routes>
                <Route path="dashboard" element={<OrganizerDashboard />} />
                <Route path="eventmanagement/*" element={<EventService />} />
                <Route path="workspaces/*" element={<WorkspaceService />} />
                <Route path="organizations/*" element={<OrganizationService />} />
                <Route path="analytics" element={<OrganizationAnalyticsDashboard />} />
                <Route path="team" element={<OrganizationTeamManagement />} />
                <Route path="*" element={<Navigate to="dashboard" replace />} />
              </Routes>
            </div>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </OrganizationProvider>
  );
};
