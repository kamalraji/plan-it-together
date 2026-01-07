import React, { useCallback } from 'react';
import { Navigate, Route, Routes, useParams, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useMyMemberOrganizations, useOrganizationBySlug } from '@/hooks/useOrganization';
import { OrganizerDashboard } from '@/components/dashboard/OrganizerDashboard';
import { EventService, WorkspaceService, OrganizationService } from '@/components/routing/services';
import { OrgTemplatesPage } from '@/components/routing/services/OrgTemplatesPage';
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
import { OrgScopedBreadcrumbs } from './OrgScopedBreadcrumbs';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { AdminDashboard } from '@/components/admin/AdminDashboard';
import { AdminUserRolesPage } from '@/components/admin/AdminUserRolesPage';
import { RolesDiagramPage } from '@/components/admin/RolesDiagramPage';
import { UserRole } from '@/types';
import { useIsMobile } from '@/hooks/use-mobile';
import { MobileAppShell } from '@/components/mobile/MobileAppShell';

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
  const isMobile = useIsMobile();

  const isLoadingAny = isLoading || orgsLoading || orgLoading;

  const handleLogout = useCallback(async () => {
    await logout();
  }, [logout]);

  // Check if current route is the page builder (needs fullscreen)
  const isPageBuilder = location.pathname.includes('/page-builder');
  
  // Check if current route needs narrower content (settings, team, event details, admin, members, etc.)
  const isNarrowPage = location.pathname.includes('/settings') || 
                       location.pathname.includes('/team') ||
                       location.pathname.includes('/analytics') ||
                       location.pathname.includes('/eventmanagement') ||
                       location.pathname.includes('/admin') ||
                       location.pathname.includes('/organizations/members');
  
  // Check if user has SUPER_ADMIN role (for admin routes)
  const isSuperAdmin = user?.role === UserRole.SUPER_ADMIN;

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

  // Render mobile layout on small screens
  if (isMobile) {
    return (
      <OrganizationProvider value={{ organization }}>
        <MobileAppShell
          organization={organization}
          user={{
            id: user.id,
            name: user.name,
            email: user.email,
            avatarUrl: (user as any).avatarUrl || (user as any).avatar_url,
          }}
        >
          {/* Mobile renders the same routes as desktop, just wrapped in mobile shell */}
          <Routes>
            <Route path="dashboard" element={<OrganizerDashboard />} />
            <Route path="settings" element={<Navigate to="settings/dashboard" replace />} />
            <Route path="settings/dashboard" element={<OrgSettingsDashboard />} />
            <Route path="settings/story" element={<OrgStorySettingsPage />} />
            <Route path="eventmanagement/*" element={<EventService />} />
            <Route path="workspaces/*" element={<WorkspaceService />} />
            <Route path="templates" element={<OrgTemplatesPage />} />
            <Route path="marketplace" element={<OrgMarketplacePage />} />
            <Route path="organizations/*" element={<OrganizationService />} />
            <Route path="analytics" element={<OrganizationAnalyticsDashboard />} />
            <Route path="team" element={<OrganizationTeamManagement />} />
            {isSuperAdmin && (
              <Route path="admin" element={<AdminLayout />}>
                <Route index element={<AdminDashboard />} />
                <Route path="users" element={<AdminUserRolesPage />} />
                <Route path="roles-diagram" element={<RolesDiagramPage />} />
              </Route>
            )}
            <Route path="*" element={<Navigate to="dashboard" replace />} />
          </Routes>
        </MobileAppShell>
      </OrganizationProvider>
    );
  }

  return (
    <OrganizationProvider value={{ organization }}>
      <SidebarProvider open={false} onOpenChange={() => {}} className="flex-col">
        {/* Global console header fixed at the top */}
        <OrgConsoleHeader user={user} onLogout={handleLogout} />

        {/* Sidebar + content, padded so it sits below the fixed header */}
        <div className="relative min-h-screen w-full bg-gradient-to-br from-background via-background/95 to-background/90 overflow-hidden">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_hsl(var(--primary)/0.20),_transparent_55%),radial-gradient(circle_at_bottom,_hsl(var(--primary)/0.10),_transparent_55%)]" />
          <div className="relative flex w-full pt-16 items-stretch">
            <OrganizationSidebar />

            <SidebarInset className="flex justify-center overflow-hidden w-full">
              <div className={`my-4 sm:my-6 w-full ${isNarrowPage ? 'mx-auto max-w-5xl xl:max-w-6xl px-3 sm:px-4 md:px-6 lg:px-8' : 'mx-1 sm:mx-2 px-2 sm:px-3 md:px-4'} rounded-2xl sm:rounded-3xl border border-border/60 bg-card/75 py-4 sm:py-6 shadow-lg shadow-primary/20 backdrop-blur-xl animate-fade-in overflow-x-hidden`}>
                {isNarrowPage && <OrgScopedBreadcrumbs className="mb-4" />}
                <Routes>
                  <Route path="dashboard" element={<OrganizerDashboard />} />
                  <Route path="settings" element={<Navigate to="settings/dashboard" replace />} />
                  <Route path="settings/dashboard" element={<OrgSettingsDashboard />} />
                  <Route path="settings/story" element={<OrgStorySettingsPage />} />
                  <Route path="eventmanagement/*" element={<EventService />} />
                  <Route path="workspaces/*" element={<WorkspaceService />} />
                  <Route path="templates" element={<OrgTemplatesPage />} />
                  <Route path="marketplace" element={<OrgMarketplacePage />} />
                  <Route path="organizations/*" element={<OrganizationService />} />
                  <Route path="analytics" element={<OrganizationAnalyticsDashboard />} />
                  <Route path="team" element={<OrganizationTeamManagement />} />
                  {/* Admin routes - only for SUPER_ADMIN */}
                  {isSuperAdmin && (
                    <Route path="admin" element={<AdminLayout />}>
                      <Route index element={<AdminDashboard />} />
                      <Route path="users" element={<AdminUserRolesPage />} />
                      <Route path="roles-diagram" element={<RolesDiagramPage />} />
                    </Route>
                  )}
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
