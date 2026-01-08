import React, { useCallback } from 'react';
import { SidebarInset, SidebarProvider, useSidebar } from '@/components/ui/sidebar';
import { WorkspaceSidebar } from './WorkspaceSidebar';
import { ConsoleHeader } from '@/components/routing/ConsoleHeader';
import { useAuth } from '@/hooks/useAuth';
import { Workspace } from '@/types';
import { WorkspaceTab } from './WorkspaceSidebar';

/**
 * Thin wrapper that reuses the global ConsoleHeader but
 * wires the three-line menu to the Shadcn sidebar for workspace routes.
 */
const WorkspaceConsoleHeader: React.FC<{ user: any; onLogout: () => Promise<void> }> = ({ user, onLogout }) => {
  const { toggleSidebar } = useSidebar();

  const handleServiceChange = useCallback((service: string) => {
    console.log('Workspace console service change:', service);
  }, []);

  const handleSearch = useCallback((query: string) => {
    console.log('Workspace console global search:', query);
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

interface WorkspaceLayoutProps {
  workspace: Workspace;
  activeTab: WorkspaceTab;
  onTabChange: (tab: WorkspaceTab) => void;
  orgSlug: string;
  canCreateSubWorkspace?: boolean;
  canInviteMembers?: boolean;
  onCreateSubWorkspace?: () => void;
  onInviteMember?: () => void;
  onManageSettings?: () => void;
  children: React.ReactNode;
}

export const WorkspaceLayout: React.FC<WorkspaceLayoutProps> = ({
  workspace,
  activeTab,
  onTabChange,
  orgSlug,
  canCreateSubWorkspace,
  canInviteMembers,
  onCreateSubWorkspace,
  onInviteMember,
  onManageSettings,
  children,
}) => {
  const { user, logout } = useAuth();

  const handleLogout = useCallback(async () => {
    await logout();
  }, [logout]);

  return (
    <SidebarProvider defaultOpen={true} className="flex-col">
      {/* Global console header fixed at the top */}
      <WorkspaceConsoleHeader user={user} onLogout={handleLogout} />

      {/* Sidebar + content */}
      <div className="relative h-[calc(100vh-4rem)] w-full bg-gradient-to-br from-background via-background/95 to-background/90 overflow-hidden mt-16">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_hsl(var(--primary)/0.20),_transparent_55%),radial-gradient(circle_at_bottom,_hsl(var(--primary)/0.10),_transparent_55%)]" />
        <div className="relative flex w-full h-full">
          <WorkspaceSidebar
            workspace={workspace}
            activeTab={activeTab}
            onTabChange={onTabChange}
            orgSlug={orgSlug}
            canCreateSubWorkspace={canCreateSubWorkspace}
            canInviteMembers={canInviteMembers}
            onCreateSubWorkspace={onCreateSubWorkspace}
            onInviteMember={onInviteMember}
            onManageSettings={onManageSettings}
          />

          <SidebarInset className="flex w-full min-h-0 overflow-y-auto">
            <div className="my-4 sm:my-6 w-full mx-1 sm:mx-2 px-2 sm:px-3 md:px-4 rounded-2xl sm:rounded-3xl border border-border/60 bg-card/75 py-4 sm:py-6 shadow-lg shadow-primary/20 backdrop-blur-xl animate-fade-in overflow-x-hidden min-h-min">
              {children}
            </div>
          </SidebarInset>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default WorkspaceLayout;
