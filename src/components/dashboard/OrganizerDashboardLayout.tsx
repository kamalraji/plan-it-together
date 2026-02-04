import React, { useCallback } from 'react';
import { Outlet } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { SidebarProvider, SidebarInset, useSidebar } from '@/components/ui/sidebar';
import { OrganizerSidebar } from './OrganizerSidebar';
import { ConsoleHeader } from '@/components/routing/ConsoleHeader';
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * Mobile header with sidebar trigger
 */
const MobileHeader: React.FC = () => {
  const { toggleSidebar } = useSidebar();

  return (
    <div className="flex md:hidden items-center gap-2 px-4 py-2 border-b border-border/40 bg-background/95 backdrop-blur-sm">
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleSidebar}
        className="h-9 w-9"
      >
        <Menu className="h-5 w-5" />
        <span className="sr-only">Toggle sidebar</span>
      </Button>
      <span className="text-sm font-medium text-foreground">Organizer Console</span>
    </div>
  );
};

/**
 * Header wrapper that uses sidebar context
 */
const OrganizerConsoleHeader: React.FC<{ user: any; onLogout: () => Promise<void> }> = ({
  user,
  onLogout,
}) => {
  const { toggleSidebar } = useSidebar();

  const handleServiceChange = useCallback((_service: string) => {
    // TODO: Implement service navigation
  }, []);

  const handleSearch = useCallback((_query: string) => {
    // TODO: Implement global search
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

export const OrganizerDashboardLayout: React.FC = () => {
  const { user, logout } = useAuth();

  const handleLogout = useCallback(async () => {
    await logout();
  }, [logout]);

  return (
    <SidebarProvider defaultOpen={true} className="flex-col min-h-screen">
      {/* Global console header - fixed at top */}
      <OrganizerConsoleHeader user={user} onLogout={handleLogout} />

      {/* Mobile header with sidebar trigger - visible only on mobile */}
      <MobileHeader />

      {/* Main content area below header */}
      <div className="relative flex flex-1 w-full pt-16">
        {/* Gradient background */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-background via-background/98 to-primary/5" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,_hsl(var(--primary)/0.08),_transparent_50%)]" />

        {/* Sidebar */}
        <OrganizerSidebar />

        {/* Main content */}
        <SidebarInset className="relative flex-1">
          <div className="mx-2 sm:mx-4 my-4 sm:my-6 rounded-2xl border border-border/50 bg-card/80 backdrop-blur-sm px-3 sm:px-6 py-4 sm:py-6 shadow-lg shadow-primary/5 animate-fade-in">
            <Outlet />
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default OrganizerDashboardLayout;
