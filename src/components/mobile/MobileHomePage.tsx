import React from 'react';
import { format } from 'date-fns';
import { useAuth } from '@/hooks/useAuth';
import { useMobileHomeData } from '@/hooks/useMobileHomeData';
import { useNotificationFeed } from '@/hooks/useNotificationFeed';
import { 
  MobilePriorityCard, 
  MobileQuickActionChips, 
  MobileTasksDueToday,
  MobileActivityFeed,
  MobileRecentWorkspaces
} from './home';
import { ListSkeleton } from './shared/MobileSkeleton';

interface MobileHomePageProps {
  organization: {
    id: string;
    name: string;
    slug: string;
  };
}

export const MobileHomePage: React.FC<MobileHomePageProps> = ({ organization }) => {
  const { user } = useAuth();
  const { notifications, markAsRead } = useNotificationFeed();
  const homeData = useMobileHomeData(organization.id);

  // Get time-based greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  // Get first name from user
  const firstName = user?.name?.split(' ')[0] || 'there';

  // Format today's date
  const formattedDate = format(new Date(), 'EEEE, MMMM d');

  if (homeData.isLoading) {
    return (
      <div className="px-4 py-4 space-y-4">
        {/* Greeting Skeleton */}
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-48 mb-2" />
          <div className="h-4 bg-muted rounded w-32" />
        </div>

        {/* Priority Card Skeleton */}
        <div className="h-40 bg-gradient-to-br from-muted to-muted/50 rounded-2xl animate-pulse" />

        {/* Quick Actions Skeleton */}
        <div className="flex gap-2 overflow-hidden">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-10 w-28 bg-muted rounded-full animate-pulse shrink-0" />
          ))}
        </div>

        {/* Cards Skeleton */}
        <ListSkeleton count={2} />
      </div>
    );
  }

  return (
    <div className="px-4 py-4 space-y-5">
      {/* Personalized Greeting */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          {getGreeting()}, {firstName}
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          {formattedDate}
        </p>
      </div>

      {/* Priority Card - Context Aware */}
      <MobilePriorityCard
        todayEvents={homeData.todayEvents}
        upcomingShifts={homeData.upcomingShifts}
        tasksDueCount={homeData.tasksDueToday.length}
        orgSlug={organization.slug}
      />

      {/* Quick Action Chips */}
      <MobileQuickActionChips
        orgSlug={organization.slug}
        unreadCount={homeData.unreadNotificationCount}
      />

      {/* Tasks Due Today */}
      <MobileTasksDueToday
        tasks={homeData.tasksDueToday}
        orgSlug={organization.slug}
      />

      {/* Recent Workspaces */}
      <MobileRecentWorkspaces
        workspaces={homeData.recentWorkspaces}
        orgSlug={organization.slug}
      />

      {/* Activity Feed */}
      <MobileActivityFeed
        notifications={notifications}
        onMarkAsRead={markAsRead}
        orgSlug={organization.slug}
      />

      {/* Bottom spacing for nav bar */}
      <div className="h-4" />
    </div>
  );
};
