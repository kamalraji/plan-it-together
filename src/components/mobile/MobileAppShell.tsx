import React, { useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { MobileHeader } from './MobileHeader';
import { MobileBottomNav } from './MobileBottomNav';
import { MobileFAB } from './MobileFAB';
import { MobileQuickActionsSheet } from './MobileQuickActionsSheet';
import { MobileSearchOverlay } from './MobileSearchOverlay';
import { MobileHomePage } from './MobileHomePage';
import { PullToRefresh } from './shared/PullToRefresh';
import { useQueryClient } from '@tanstack/react-query';

export type MobileTab = 'home' | 'events' | 'workspaces' | 'analytics' | 'search';

interface MobileAppShellProps {
  organization: {
    id: string;
    name: string;
    slug: string;
    logo_url?: string | null;
  };
  user: {
    id: string;
    name?: string;
    email?: string;
    avatarUrl?: string;
  };
  children?: React.ReactNode;
}

export const MobileAppShell: React.FC<MobileAppShellProps> = ({
  organization,
  user,
  children,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<MobileTab>('home');
  const [isQuickActionsOpen, setIsQuickActionsOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Determine if we're on a specific route that should show its content directly
  const isOnSpecificRoute = () => {
    const path = location.pathname;
    // Check for workspace detail, event detail, or other specific pages
    return (
      path.includes('/workspaces/') && path.split('/').length > 4 ||
      path.includes('/eventmanagement/') && !path.endsWith('/eventmanagement') ||
      path.includes('/team') ||
      path.includes('/settings') ||
      path.includes('/analytics') ||
      path.includes('/marketplace')
    );
  };

  // If we're on a specific route, render the children (actual page content) with mobile wrapper
  if (isOnSpecificRoute() && children) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        {children}
      </div>
    );
  }

  const handleTabChange = (tab: MobileTab) => {
    if (tab === 'search') {
      setIsSearchOpen(true);
      return;
    }
    setActiveTab(tab);
    // Navigate to corresponding route when tab changes
    switch (tab) {
      case 'home':
        navigate(`/${organization.slug}/dashboard`);
        break;
      case 'events':
        navigate(`/${organization.slug}/eventmanagement`);
        break;
      case 'workspaces':
        navigate(`/${organization.slug}/workspaces`);
        break;
      case 'analytics':
        navigate(`/${organization.slug}/analytics`);
        break;
    }
  };

  const handleFABPress = () => {
    setIsQuickActionsOpen(true);
  };

  const handleQuickAction = (action: string) => {
    setIsQuickActionsOpen(false);
    switch (action) {
      case 'create-event':
        navigate(`/${organization.slug}/eventmanagement/create`);
        break;
      case 'create-task':
        navigate(`/${organization.slug}/workspaces`);
        break;
      case 'invite-member':
        navigate(`/${organization.slug}/team?tab=invite`);
        break;
      case 'view-analytics':
        setActiveTab('analytics');
        navigate(`/${organization.slug}/analytics`);
        break;
      case 'settings':
        navigate(`/${organization.slug}/settings`);
        break;
      default:
        break;
    }
  };

  const handleRefresh = useCallback(async () => {
    // Invalidate relevant queries based on active tab
    await queryClient.invalidateQueries({ 
      queryKey: ['mobile-events', organization.id] 
    });
    await queryClient.invalidateQueries({ 
      queryKey: ['mobile-workspaces', organization.id] 
    });
    await queryClient.invalidateQueries({ 
      queryKey: ['organizer-events-supabase', organization.id] 
    });
  }, [queryClient, organization.id]);

  // Determine if we're on the home/dashboard route
  const isOnHomeRoute = () => {
    const path = location.pathname;
    return path.endsWith('/dashboard') || path === `/${organization.slug}`;
  };

  // Render content based on the actual route or fallback to children
  const renderContent = () => {
    // If on home route, render the dedicated mobile home page
    if (isOnHomeRoute()) {
      return <MobileHomePage organization={organization} />;
    }

    // If children are provided, render them (this handles most routes)
    if (children) {
      return children;
    }

    // Fallback content based on tab (shouldn't normally hit this)
    return (
      <div className="px-4 py-4 text-center text-muted-foreground">
        Select a tab to get started
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Fixed Header */}
      <MobileHeader 
        organization={organization} 
        user={user} 
      />

      {/* Scrollable Content Area with Pull to Refresh */}
      <PullToRefresh onRefresh={handleRefresh} className="flex-1 pt-16 pb-20 overflow-y-auto">
        {renderContent()}
      </PullToRefresh>

      {/* Floating Action Button */}
      <MobileFAB onPress={handleFABPress} />

      {/* Fixed Bottom Navigation */}
      <MobileBottomNav 
        activeTab={activeTab} 
        onTabChange={handleTabChange} 
      />

      {/* Quick Actions Bottom Sheet */}
      <MobileQuickActionsSheet
        isOpen={isQuickActionsOpen}
        onClose={() => setIsQuickActionsOpen(false)}
        onAction={handleQuickAction}
        organization={organization}
      />

      {/* Search Overlay */}
      <MobileSearchOverlay
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        organizationId={organization.id}
        organizationSlug={organization.slug}
      />
    </div>
  );
};
