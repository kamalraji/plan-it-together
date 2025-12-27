import React from 'react';
import { Navigate, Route, Routes, useParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useMyOrganizations, useOrganizationBySlug } from '@/hooks/useOrganization';
import { OrganizerDashboard } from '@/components/dashboard/OrganizerDashboard';
import { EventService } from '@/components/routing/services';
import { OrganizationProvider } from './OrganizationContext';
import { OrganizationSwitcher } from './OrganizationSwitcher';
import { OrganizationAnalyticsDashboard } from './OrganizationAnalyticsDashboard';
import { OrganizationTeamManagement } from './OrganizationTeamManagement';
import { SidebarInset, SidebarProvider, SidebarTrigger, useSidebar } from '@/components/ui/sidebar';
import { OrganizationSidebar } from './OrganizationSidebar';
import { ConsoleHeader } from '@/components/routing/ConsoleHeader';
const OrgConsoleHeader: React.FC<{ user: any; onLogout: () => void }> = ({ user, onLogout }) => {
  const { toggleSidebar } = useSidebar();

  const handleServiceChange = (service: string) => {
    console.log('Service changed to:', service);
  };

  const handleSearch = (query: string) => {
    console.log('Global search:', query);
  };

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

  const handleLogout = async () => {
    await logout();
  };

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

  const isAdminOfOrg = (myOrganizations || []).some((org: any) => org.id === organization.id);

  if (!isAdminOfOrg) {
    // User is authenticated but not an admin of this org; send them back to generic dashboard
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <OrganizationProvider value={{ organization }}>
      <SidebarProvider>
        <div className="min-h-screen flex w-full bg-background">
          <OrganizationSidebar />
          <SidebarInset>
            <OrgConsoleHeader user={user} onLogout={handleLogout} />
            <div className="border-b bg-card px-4 py-3 flex items-center gap-3">
              <SidebarTrigger className="mr-1" />
              <OrganizationSwitcher />
            </div>
            <div className="px-4 py-6">
              <Routes>
                <Route path="dashboard" element={<OrganizerDashboard />} />
                <Route path="eventmanagement/*" element={<EventService />} />
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
