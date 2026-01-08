import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  CalendarDays,
  SlidersHorizontal,
  Briefcase,
  Users,
  ChevronRight,
  Clock
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useCurrentOrganization } from '../organization/OrganizationContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { buildHierarchyChain, buildWorkspaceUrl, slugify } from '@/lib/workspaceNavigation';

interface Event {
  id: string;
  name: string;
  startDate: string;
  status: string;
}

interface WorkspaceSummary {
  id: string;
  name: string;
  slug: string | null;
  workspaceType: string | null;
  parentWorkspaceId: string | null;
  status: string;
  updatedAt: string;
  eventId: string;
  event?: {
    id: string;
    name: string;
    slug: string | null;
  };
}

/**
 * Compact dashboard view that works for both mobile and desktop narrow views.
 * On mobile: displayed inside MobileAppShell with bottom navigation
 * On desktop: can be used as a compact sidebar or narrow dashboard view
 */
export function CompactDashboard() {
  const { user } = useAuth();
  const organization = useCurrentOrganization();

  // Fetch events
  const { data: events, isLoading: eventsLoading } = useQuery<Event[]>({
    queryKey: ['compact-dashboard-events', organization.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('events')
        .select('id, name, start_date, status')
        .eq('organization_id', organization.id)
        .order('start_date', { ascending: false })
        .limit(5);
      
      if (error) throw error;
      return (data || []).map(e => ({
        id: e.id,
        name: e.name,
        startDate: e.start_date,
        status: e.status
      }));
    }
  });

  // Fetch workspaces with hierarchy data
  const { data: workspaces, isLoading: workspacesLoading } = useQuery<WorkspaceSummary[]>({
    queryKey: ['compact-dashboard-workspaces', organization.id, user?.id],
    queryFn: async () => {
      const { data: orgEvents } = await supabase
        .from('events')
        .select('id, name, slug')
        .eq('organization_id', organization.id);
      
      const orgEventIds = (orgEvents || []).map(e => e.id);
      if (orgEventIds.length === 0) return [];

      const eventMap = new Map(orgEvents!.map(e => [e.id, e]));

      const { data, error } = await supabase
        .from('workspaces')
        .select('id, name, slug, status, updated_at, event_id, workspace_type, parent_workspace_id')
        .eq('organizer_id', user!.id)
        .in('event_id', orgEventIds)
        .order('updated_at', { ascending: false })
        .limit(5);
      
      if (error) throw error;
      return (data || []).map(ws => ({
        id: ws.id,
        name: ws.name,
        slug: ws.slug,
        workspaceType: ws.workspace_type,
        parentWorkspaceId: ws.parent_workspace_id,
        status: ws.status,
        updatedAt: ws.updated_at,
        eventId: ws.event_id,
        event: eventMap.get(ws.event_id),
      }));
    },
    enabled: !!user?.id
  });

  // Build workspace data for hierarchy chain building
  const workspaceDataForHierarchy = useMemo(() => {
    return (workspaces || []).map(ws => ({
      id: ws.id,
      slug: ws.slug || slugify(ws.name),
      name: ws.name,
      workspaceType: ws.workspaceType,
      parentWorkspaceId: ws.parentWorkspaceId,
    }));
  }, [workspaces]);

  const getWorkspaceUrl = (ws: WorkspaceSummary) => {
    const hierarchy = buildHierarchyChain(ws.id, workspaceDataForHierarchy);
    const eventSlug = ws.event?.slug || slugify(ws.event?.name || '');
    return buildWorkspaceUrl({
      orgSlug: organization.slug,
      eventSlug,
      eventId: ws.eventId,
      hierarchy,
    });
  };

  // Quick action grid items
  const quickActionCards = [
    { 
      icon: CalendarDays, 
      label: 'Events', 
      path: `/${organization.slug}/eventmanagement`,
      color: 'bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400'
    },
    { 
      icon: SlidersHorizontal, 
      label: 'Analytics', 
      path: `/${organization.slug}/analytics`,
      color: 'bg-orange-500/10 text-orange-600 dark:bg-orange-500/20 dark:text-orange-400'
    },
    { 
      icon: Briefcase, 
      label: 'Workspaces', 
      path: `/${organization.slug}/workspaces`,
      color: 'bg-green-500/10 text-green-600 dark:bg-green-500/20 dark:text-green-400'
    },
    { 
      icon: Users, 
      label: 'Team', 
      path: `/${organization.slug}/team`,
      color: 'bg-purple-500/10 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400'
    },
  ];

  const upcomingEvents = events?.filter(e => new Date(e.startDate) > new Date()).slice(0, 3) || [];

  // Skeleton component
  const CardSkeleton = () => (
    <div className="bg-card border border-border rounded-xl p-3 sm:p-4 animate-pulse">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-muted" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-muted rounded w-3/4" />
          <div className="h-3 bg-muted rounded w-1/2" />
        </div>
      </div>
    </div>
  );

  return (
    <div className="px-3 sm:px-4 lg:px-6 py-4 sm:py-6 space-y-5 sm:space-y-6 max-w-2xl mx-auto">
      {/* Header Section */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-foreground">
          {organization.name}
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground mt-1">
          Here's what's happening
        </p>
      </div>

      {/* Quick Action Grid - 2x2 on mobile, 4 cols on larger screens */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
        {quickActionCards.map((card, index) => (
          <Link
            key={index}
            to={card.path}
            className="flex flex-col items-center justify-center gap-1.5 sm:gap-2 p-4 sm:p-5 rounded-xl sm:rounded-2xl bg-card border border-border hover:bg-muted/50 active:scale-[0.98] transition-all shadow-sm"
          >
            <div className={`p-2.5 sm:p-3 rounded-lg sm:rounded-xl ${card.color}`}>
              <card.icon className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <span className="text-xs sm:text-sm font-medium text-foreground">{card.label}</span>
          </Link>
        ))}
      </div>

      {/* Tasks Section */}
      <section className="space-y-2 sm:space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm sm:text-base font-semibold text-foreground">Tasks</h2>
          <Link to={`/${organization.slug}/workspaces`} className="text-xs font-medium text-primary flex items-center gap-1 hover:underline">
            View all <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
        <div className="bg-card border border-border rounded-xl p-3 sm:p-4">
          <p className="text-xs sm:text-sm text-muted-foreground text-center py-2">No pending tasks</p>
        </div>
      </section>

      {/* Upcoming Events Section */}
      <section className="space-y-2 sm:space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm sm:text-base font-semibold text-foreground">Upcoming Events</h2>
          <Link to={`/${organization.slug}/eventmanagement`} className="text-xs font-medium text-primary flex items-center gap-1 hover:underline">
            View all <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
        
        {eventsLoading ? (
          <div className="space-y-2">
            <CardSkeleton />
            <CardSkeleton />
          </div>
        ) : upcomingEvents.length > 0 ? (
          <div className="space-y-2">
            {upcomingEvents.map(event => (
              <Link
                key={event.id}
                to={`/${organization.slug}/eventmanagement/${event.id}`}
                className="flex items-center gap-3 p-2.5 sm:p-3 bg-card border border-border rounded-xl hover:bg-muted/50 active:scale-[0.98] transition-all"
              >
                <div className="p-1.5 sm:p-2 rounded-lg bg-primary/10">
                  <CalendarDays className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-foreground truncate">{event.name}</p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                    {format(new Date(event.startDate), 'MMM d, yyyy')}
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              </Link>
            ))}
          </div>
        ) : (
          <div className="bg-card border border-border rounded-xl p-3 sm:p-4">
            <p className="text-xs sm:text-sm text-muted-foreground text-center py-2">No upcoming events</p>
          </div>
        )}
      </section>

      {/* Recent Workspaces Section */}
      <section className="space-y-2 sm:space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm sm:text-base font-semibold text-foreground">Recent Workspaces</h2>
          <Link to={`/${organization.slug}/workspaces`} className="text-xs font-medium text-primary flex items-center gap-1 hover:underline">
            View all <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
        
        {workspacesLoading ? (
          <div className="space-y-2">
            <CardSkeleton />
            <CardSkeleton />
          </div>
        ) : workspaces && workspaces.length > 0 ? (
          <div className="space-y-2">
            {workspaces.slice(0, 3).map(ws => (
              <Link
                key={ws.id}
                to={getWorkspaceUrl(ws)}
                className="flex items-center gap-3 p-2.5 sm:p-3 bg-card border border-border rounded-xl hover:bg-muted/50 active:scale-[0.98] transition-all"
              >
                <div className="p-1.5 sm:p-2 rounded-lg bg-green-500/10 dark:bg-green-500/20">
                  <Briefcase className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 dark:text-green-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-foreground truncate">{ws.name}</p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">
                    Updated {format(new Date(ws.updatedAt), 'MMM d')}
                  </p>
                </div>
                <span className={`text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 rounded-full flex-shrink-0 ${
                  ws.status === 'active' 
                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                    : 'bg-muted text-muted-foreground'
                }`}>
                  {ws.status}
                </span>
              </Link>
            ))}
          </div>
        ) : (
          <div className="bg-card border border-border rounded-xl p-3 sm:p-4">
            <p className="text-xs sm:text-sm text-muted-foreground text-center py-2">No workspaces yet</p>
          </div>
        )}
      </section>
    </div>
  );
}

// Keep the old export name for backward compatibility
export { CompactDashboard as MobileOrganizerDashboard };
