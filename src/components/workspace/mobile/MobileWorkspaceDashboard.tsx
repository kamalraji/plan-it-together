import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Home,
  CalendarDays,
  BarChart3,
  Search,
  Plus,
  Users,
  SlidersHorizontal,
  Image,
  MessageSquare,
  RefreshCw
} from 'lucide-react';

import { MobileTaskSummary } from './MobileTaskSummary';
import { MobileWorkspaceHeader } from './MobileWorkspaceHeader';
import { MobileNavigation } from './MobileNavigation';
import { MobileWorkspaceDashboardSkeleton } from './MobileWorkspaceDashboardSkeleton';
import { MobileWorkspaceAnalytics } from './MobileWorkspaceAnalytics';
import { MobileWorkspaceSearch } from './MobileWorkspaceSearch';
import { MobileWorkspaceCommunication } from '../communication/MobileWorkspaceCommunication';
import { useWorkspaceShell } from '@/hooks/useWorkspaceShell';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';
import { useQueryClient } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';

interface MobileWorkspaceDashboardProps {
  workspaceId?: string;
  orgSlug?: string;
}

export function MobileWorkspaceDashboard({ workspaceId, orgSlug }: MobileWorkspaceDashboardProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [mobileActiveTab, setMobileActiveTab] = useState<'home' | 'events' | 'communication' | 'analytics' | 'search'>('home');

  // Use shared shell hook
  const { state, actions } = useWorkspaceShell({ workspaceId, orgSlug });
  const { workspace, userWorkspaces, isLoading, error } = state;

  const handleQuickAction = (action: string) => {
    setIsMenuOpen(false);
    switch (action) {
      case 'create-task':
        actions.handleCreateTask();
        break;
      case 'invite-member':
        actions.handleInviteTeamMember();
        break;
      case 'settings':
        actions.handleManageSettings();
        break;
    }
  };

  if (isLoading) {
    return <MobileWorkspaceDashboardSkeleton />;
  }

  if (error || !workspace) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="text-center">
          <h2 className="text-xl font-bold text-foreground mb-4">Workspace Not Found</h2>
          <p className="text-muted-foreground mb-4 text-sm">The workspace you're looking for doesn't exist or you don't have access to it.</p>
          <button
            onClick={() => navigate(orgSlug ? `/${orgSlug}/dashboard` : '/dashboard')}
            className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 text-sm transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Quick action grid items (2x2 layout like Thittam1Hub)
  const quickActionCards = [
    { icon: Users, label: 'Contacts', color: 'text-primary' },
    { icon: SlidersHorizontal, label: 'Segments', color: 'text-primary' },
    { icon: Image, label: 'Assets', color: 'text-primary' },
    { icon: MessageSquare, label: 'Team', color: 'text-primary' },
  ];

  return (
    <div className="min-h-screen w-full bg-background flex flex-col">
      {/* Mobile Header */}
      <MobileWorkspaceHeader
        workspace={workspace}
        isMenuOpen={isMenuOpen}
        onMenuToggle={() => setIsMenuOpen(!isMenuOpen)}
      />

      {/* Mobile Navigation Overlay */}
      {isMenuOpen && (
        <MobileNavigation
          workspace={workspace}
          userWorkspaces={userWorkspaces}
          activeTab={mobileActiveTab === 'home' ? 'overview' : mobileActiveTab === 'events' ? 'tasks' : mobileActiveTab === 'analytics' ? 'analytics' : 'overview'}
          onTabChange={(tab) => {
            if (tab === 'overview') setMobileActiveTab('home');
            else if (tab === 'tasks') setMobileActiveTab('events');
            else if (tab === 'analytics') setMobileActiveTab('analytics');
            setIsMenuOpen(false);
          }}
          onWorkspaceSwitch={(newWorkspaceId) => {
            actions.handleWorkspaceSwitch(newWorkspaceId);
            setIsMenuOpen(false);
          }}
          onQuickAction={handleQuickAction}
          onClose={() => setIsMenuOpen(false)}
        />
      )}

      {/* Pull to Refresh Handler */}
      {(() => {
        const handleRefresh = async () => {
          await queryClient.invalidateQueries({ queryKey: ['workspace-tasks', workspace.id] });
          await queryClient.invalidateQueries({ queryKey: ['workspace-channels', workspace.id] });
        };

        const { pullDistance, isRefreshing, progress, handlers, containerRef } = usePullToRefresh({
          onRefresh: handleRefresh,
        });

        return (
          <>
            {/* Pull Indicator */}
            <div 
              className="absolute left-0 right-0 flex items-center justify-center pointer-events-none z-10"
              style={{ 
                top: 80, // Below header
                height: pullDistance,
                opacity: progress,
                transition: pullDistance > 0 ? 'none' : 'all 0.3s ease-out'
              }}
            >
              <div 
                className={cn(
                  "p-2 rounded-full bg-primary/10",
                  isRefreshing && "animate-spin"
                )}
                style={{
                  transform: `rotate(${progress * 360}deg)`,
                  transition: pullDistance > 0 ? 'none' : 'transform 0.3s ease-out'
                }}
              >
                <RefreshCw className="h-5 w-5 text-primary" />
              </div>
            </div>

            {/* Main Content - Scrollable with Pull to Refresh */}
            <div 
              ref={containerRef}
              className="flex-1 overflow-y-auto pt-20 pb-24 px-4"
              {...handlers}
              style={{
                transform: `translateY(${pullDistance}px)`,
                transition: pullDistance > 0 ? 'none' : 'transform 0.3s ease-out'
              }}
            >
              {mobileActiveTab === 'home' && (
                <div className="space-y-6">
                  {/* 2x2 Quick Action Grid - 48px min touch targets */}
                  <div className="grid grid-cols-2 gap-3">
                    {quickActionCards.map((card, index) => (
                      <button
                        key={index}
                        className="bg-card border border-border rounded-xl p-5 flex flex-col items-center justify-center gap-2 hover:bg-muted/50 active:scale-[0.98] transition-all min-h-[80px]"
                      >
                        <card.icon className={`w-6 h-6 ${card.color}`} />
                        <span className="text-sm font-medium text-foreground">{card.label}</span>
                      </button>
                    ))}
                  </div>

                  {/* Tasks Section */}
                  <section className="space-y-3">
                    <div className="flex items-center justify-between min-h-[48px]">
                      <h2 className="text-lg font-semibold text-foreground">Tasks</h2>
                      <button className="text-sm font-medium text-primary hover:underline min-h-[48px] px-2 flex items-center">
                        View all
                      </button>
                    </div>
                    {workspace.taskSummary?.total === 0 ? (
                      <div className="py-8 text-center">
                        <p className="text-muted-foreground">No tasks yet</p>
                      </div>
                    ) : (
                      <MobileTaskSummary
                        workspace={workspace}
                        onViewTasks={() => {}}
                      />
                    )}
                  </section>

                  {/* Upcoming Meetings Section */}
                  <section className="space-y-3">
                    <div className="flex items-center justify-between min-h-[48px]">
                      <h2 className="text-lg font-semibold text-foreground">Upcoming Meetings</h2>
                      <button className="text-sm font-medium text-primary hover:underline min-h-[48px] px-2 flex items-center">
                        View all
                      </button>
                    </div>
                    <div className="py-8 text-center">
                      <p className="text-muted-foreground">No upcoming meetings</p>
                    </div>
                  </section>

                  {/* Upcoming Events Section */}
                  <section className="space-y-3">
                    <div className="flex items-center justify-between min-h-[48px]">
                      <h2 className="text-lg font-semibold text-foreground">Upcoming Events</h2>
                      <button className="text-sm font-medium text-primary hover:underline min-h-[48px] px-2 flex items-center">
                        View all
                      </button>
                    </div>
                    <div className="py-8 text-center">
                      <p className="text-muted-foreground">No upcoming events</p>
                    </div>
                  </section>
                </div>
              )}

              {mobileActiveTab === 'events' && (
                <div className="space-y-4">
                  <h2 className="text-lg font-semibold text-foreground">Events</h2>
                  <div className="py-8 text-center text-muted-foreground">
                    No events to display
                  </div>
                </div>
              )}

              {mobileActiveTab === 'communication' && (
                <MobileWorkspaceCommunication
                  workspaceId={workspace.id}
                  userId={user?.id || ''}
                  onChannelSelect={(channelId) => {
                    console.log('Navigate to channel:', channelId);
                  }}
                />
              )}

              {mobileActiveTab === 'analytics' && (
                <div className="space-y-4">
                  <h2 className="text-lg font-semibold text-foreground">Analytics</h2>
                  <MobileWorkspaceAnalytics workspace={workspace} />
                </div>
              )}

              {mobileActiveTab === 'search' && (
                <div className="space-y-4">
                  <h2 className="text-lg font-semibold text-foreground">Search</h2>
                  <MobileWorkspaceSearch 
                    workspace={workspace}
                    onResultClick={(type, id) => {
                      console.log('Navigate to:', type, id);
                    }}
                  />
                </div>
              )}
            </div>
          </>
        );
      })()}

      {/* Floating Action Button - 48px+ touch target */}
      <button
        onClick={() => handleQuickAction('create-task')}
        className="fixed bottom-24 right-4 w-14 h-14 rounded-full bg-gradient-to-br from-primary via-primary to-cyan-400 text-primary-foreground shadow-lg flex items-center justify-center hover:shadow-xl active:scale-95 transition-all z-40"
        aria-label="Create new task"
      >
        <Plus className="w-6 h-6" />
      </button>

      {/* Bottom Navigation - 48px min touch targets */}
      <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50">
        <div className="flex justify-around items-center h-16 px-2 pb-safe">
          <button
            onClick={() => setMobileActiveTab('home')}
            className={cn(
              "flex flex-col items-center justify-center flex-1 min-h-[48px] min-w-[48px] py-2 transition-colors",
              mobileActiveTab === 'home' ? 'text-primary' : 'text-muted-foreground'
            )}
            aria-label="Home"
            aria-current={mobileActiveTab === 'home' ? 'page' : undefined}
          >
            <Home className="w-5 h-5" />
            <span className="text-xs mt-1 font-medium">Home</span>
          </button>
          <button
            onClick={() => setMobileActiveTab('events')}
            className={cn(
              "flex flex-col items-center justify-center flex-1 min-h-[48px] min-w-[48px] py-2 transition-colors",
              mobileActiveTab === 'events' ? 'text-primary' : 'text-muted-foreground'
            )}
            aria-label="Events"
            aria-current={mobileActiveTab === 'events' ? 'page' : undefined}
          >
            <CalendarDays className="w-5 h-5" />
            <span className="text-xs mt-1 font-medium">Events</span>
          </button>
          <button
            onClick={() => setMobileActiveTab('communication')}
            className={cn(
              "flex flex-col items-center justify-center flex-1 min-h-[48px] min-w-[48px] py-2 transition-colors",
              mobileActiveTab === 'communication' ? 'text-primary' : 'text-muted-foreground'
            )}
            aria-label="Messages"
            aria-current={mobileActiveTab === 'communication' ? 'page' : undefined}
          >
            <MessageSquare className="w-5 h-5" />
            <span className="text-xs mt-1 font-medium">Chat</span>
          </button>
          <button
            onClick={() => setMobileActiveTab('analytics')}
            className={cn(
              "flex flex-col items-center justify-center flex-1 min-h-[48px] min-w-[48px] py-2 transition-colors",
              mobileActiveTab === 'analytics' ? 'text-primary' : 'text-muted-foreground'
            )}
            aria-label="Analytics"
            aria-current={mobileActiveTab === 'analytics' ? 'page' : undefined}
          >
            <BarChart3 className="w-5 h-5" />
            <span className="text-xs mt-1 font-medium">Analytics</span>
          </button>
          <button
            onClick={() => setMobileActiveTab('search')}
            className={cn(
              "flex flex-col items-center justify-center flex-1 min-h-[48px] min-w-[48px] py-2 transition-colors",
              mobileActiveTab === 'search' ? 'text-primary' : 'text-muted-foreground'
            )}
            aria-label="Search"
            aria-current={mobileActiveTab === 'search' ? 'page' : undefined}
          >
            <Search className="w-5 h-5" />
            <span className="text-xs mt-1 font-medium">Search</span>
          </button>
        </div>
      </div>
    </div>
  );
}
