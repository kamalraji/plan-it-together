import React from 'react';
import { Navigate, Route, Routes, useParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useMyOrganizations, useOrganizationBySlug } from '@/hooks/useOrganization';
import { ConsoleLayout } from '@/components/routing/ConsoleLayout';
import { OrganizerDashboard } from '@/components/dashboard/OrganizerDashboard';
import { EventService } from '@/components/routing/services';
import { OrganizationProvider } from './OrganizationContext';
import { OrganizationSwitcher } from './OrganizationSwitcher';
import { OrganizationAnalyticsDashboard } from './OrganizationAnalyticsDashboard';
import { OrganizationTeamManagement } from './OrganizationTeamManagement';

export const OrgScopedLayout: React.FC = () => {
  const { orgSlug } = useParams<{ orgSlug: string }>();
  const { user, isAuthenticated, isLoading } = useAuth();
  const { data: myOrganizations, isLoading: orgsLoading } = useMyOrganizations();
  const { data: organization, isLoading: orgLoading } = useOrganizationBySlug(orgSlug || '');

  const isLoadingAny = isLoading || orgsLoading || orgLoading;

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
      <div className="min-h-screen bg-background">
        <div className="border-b bg-card px-6 py-3">
          <OrganizationSwitcher />
        </div>
        <ConsoleLayout 
          showServiceNavigation={false} 
          showBreadcrumbs={false}
        >
          <Routes>
            <Route path="dashboard" element={<OrganizerDashboard />} />
            <Route path="eventmanagement/*" element={<EventService />} />
            <Route path="analytics" element={<OrganizationAnalyticsDashboard />} />
            <Route path="team" element={<OrganizationTeamManagement />} />
            <Route path="*" element={<Navigate to="dashboard" replace />} />
          </Routes>
        </ConsoleLayout>
      </div>
    </OrganizationProvider>
  );
};
