import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import api from '../../lib/api';
import { useAuth } from '../../hooks/useAuth';
import { useVendorStatus } from '../../hooks/useVendorStatus';
import { MarketplaceOrganizerInterface } from '../marketplace';
import { useCurrentOrganization } from '../organization/OrganizationContext';
import { OrganizerOnboardingChecklist } from '../organization/OrganizerOnboardingChecklist';
import { supabase } from '@/integrations/supabase/client';
import { useApiHealth } from '@/hooks/useApiHealth';


interface Event {
  id: string;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  status: string;
  registrationCount: number;
  capacity?: number;
}

interface WorkspaceSummary {
  id: string;
  name: string;
  status: string;
  updatedAt: string;
  event?: { id: string; name: string } | null;
}
 
export function OrganizerDashboard() {
  const { user, logout } = useAuth();
  const organization = useCurrentOrganization();
  const { isVendor, isLoading: vendorLoading } = useVendorStatus(user?.id || '');
  const [activeTab, setActiveTab] = useState<'events' | 'analytics' | 'marketplace' | 'profile'>('events');
  const [, setShowProfilePrompt] = useState(false);

  const { isHealthy } = useApiHealth();

  // Check if profile completion is needed (Requirements 2.4, 2.5)
  const isProfileIncomplete = !user?.profileCompleted || 
    !user?.bio || 
    !user?.organization;

  const { data: events, isLoading } = useQuery<Event[]>({
    queryKey: ['organizer-events', organization.id],
    queryFn: async () => {
      const response = await api.get('/events/my-events', {
        params: { organizationId: organization.id },
      });
      return response.data.events as Event[];
    },
    retry: 1,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    enabled: isHealthy !== false,
  });
 
  const { data: workspaces } = useQuery<WorkspaceSummary[]>({
    queryKey: ['organizer-workspaces', organization.id],
    queryFn: async () => {
      const response = await api.get('/workspaces/my-workspaces', {
        params: { orgSlug: organization.slug },
      });
      return response.data.workspaces as WorkspaceSummary[];
    },
    retry: 1,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    enabled: isHealthy !== false,
  });
 
  const { data: analytics } = useQuery<any>({
    queryKey: ['organizer-analytics', organization.id],
    queryFn: async () => {
      const response = await api.get('/analytics/organizer-summary', {
        params: { organizationId: organization.id },
      });
      return response.data;
    },
    retry: 1,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    enabled: isHealthy !== false,
  });

  const topWorkspaces = useMemo(() => {
    if (!workspaces) return [];
    return [...workspaces]
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 3);
  }, [workspaces]);
 
  const upcomingMilestones = useMemo(() => {
    if (!events) return [];
    const now = new Date();
    return [...events]
      .filter((event) => new Date(event.startDate) > now)
      .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
      .slice(0, 3);
  }, [events]);
 
  const { data: currentEvent } = useQuery({
    queryKey: ['organizer-current-event', organization.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('organization_id', organization.id)
        .in('status', ['PUBLISHED', 'ONGOING'])
        .order('start_date', { ascending: true })
        .limit(1)
        .maybeSingle();
 
      if (error) throw error;
      return data;
    },
  });
 
  const { data: currentEventMetrics } = useQuery({
    enabled: !!currentEvent,
    queryKey: ['organizer-current-event-metrics', currentEvent?.id],
    queryFn: async () => {
      if (!currentEvent) return null;
      const eventId = currentEvent.id as string;

      const [registrationsRes, confirmedRes, checkinsRes, tasksRes] = await Promise.all([
        supabase
          .from('registrations')
          .select('*', { count: 'exact', head: true })
          .eq('event_id', eventId),
        supabase
          .from('registrations')
          .select('*', { count: 'exact', head: true })
          .eq('event_id', eventId)
          .eq('status', 'CONFIRMED'),
        supabase
          .from('attendance_records')
          .select('*', { count: 'exact', head: true })
          .eq('event_id', eventId),
        supabase
          .from('workspace_activities')
          .select('*', { count: 'exact', head: true })
          .eq('type', 'task')
          .eq('workspace_id', eventId),
      ]);

      if (registrationsRes.error) throw registrationsRes.error;
      if (confirmedRes.error) throw confirmedRes.error;
      if (checkinsRes.error) throw checkinsRes.error;
      if (tasksRes.error) throw tasksRes.error;

      return {
        totalRegistrations: registrationsRes.count ?? 0,
        confirmedRegistrations: confirmedRes.count ?? 0,
        checkins: checkinsRes.count ?? 0,
        tasks: tasksRes.count ?? 0,
      };
    },
  });

  const totalEvents = analytics?.totalEvents ?? (events?.length ?? 0);
  const activeEvents = analytics?.activeEvents ?? 0;
  const totalRegistrations = analytics?.totalRegistrations ?? 0;

  const isSummaryLoading = isLoading && isHealthy !== false;

  return (
    <div className="min-h-screen bg-background">
      {/* Breadcrumb */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 text-xs sm:text-sm text-muted-foreground flex items-center gap-1">
        <span className="text-muted-foreground/70">Home</span>
        <span>/</span>
        <span className="text-foreground font-medium">Organizer Dashboard</span>
      </div>

      {/* Hero with glassmorphic organization summary */}
      <section className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl shadow-xl min-h-[150px] sm:min-h-[200px]">
          {/* Themed gradient background */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/15 via-background to-primary/5" />

          {/* Glassmorphic overlay */}
          <div className="relative px-4 sm:px-10 py-4 sm:py-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="max-w-xl rounded-2xl border border-border/60 bg-background/75 backdrop-blur-xl px-4 sm:px-6 py-3 sm:py-4 shadow-2xl">
              <p className="text-xs sm:text-sm text-muted-foreground mb-1">/ Organizer view</p>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-foreground">
                Organizer Dashboard
              </h1>
              <p className="mt-2 text-sm sm:text-base text-muted-foreground">
                Welcome back{user?.name ? `, ${user.name}` : ''}. Manage your events, analytics, marketplace,
                and organizer profile in one place.
              </p>
            </div>

            <div className="flex flex-col items-stretch xs:items-end gap-2 sm:gap-3 w-full sm:w-auto">
              <div className="rounded-2xl border border-border/60 bg-background/75 backdrop-blur-xl px-4 py-3 shadow-xl min-w-[220px] max-w-xs self-stretch sm:self-auto">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">
                  Active organization
                </p>
                <p className="text-sm sm:text-base font-semibold text-foreground truncate">
                  {organization.name}
                </p>
                <p className="text-[11px] sm:text-xs text-muted-foreground truncate">
                  {organization.slug}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full">
                {!vendorLoading && (
                  <Link
                    to={isVendor ? '/vendor/dashboard' : '/vendor/register'}
                    className="flex-1 min-w-[120px] text-center text-[11px] sm:text-xs md:text-sm font-medium text-foreground hover:text-foreground/80 underline-offset-2 hover:underline"
                  >
                    {isVendor ? 'Vendor Dashboard' : 'Become a Vendor'}
                  </Link>
                )}
                <Link
                  to="/events/create"
                  className="flex-1 min-w-[120px] inline-flex items-center justify-center rounded-full bg-primary text-primary-foreground px-3 py-1.5 text-xs sm:text-sm font-medium hover:bg-primary/90 transition-colors"
                >
                  Create event
                </Link>
                <button
                  onClick={logout}
                  className="flex-1 min-w-[120px] inline-flex items-center justify-center rounded-full border border-border/70 bg-background/80 backdrop-blur px-3 py-1.5 text-xs sm:text-sm font-medium text-foreground hover:bg-background/90 transition-colors"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Summary metrics */}
      <section className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 mt-10 sm:mt-16">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
          {isSummaryLoading ? (
            [...Array(3)].map((_, index) => (
              <div
                key={index}
                className="bg-muted border border-border/60 rounded-2xl shadow-sm px-4 py-3 sm:px-5 sm:py-4 animate-pulse h-24 sm:h-28"
              />
            ))
          ) : (
            <>
              <div className="bg-card border border-border/60 rounded-2xl shadow-sm px-4 py-3 sm:px-5 sm:py-4 flex flex-col justify-between">
                <div className="text-xs font-medium text-muted-foreground mb-1">Total events</div>
                <div className="flex items-end justify-between gap-2">
                  <div className="text-2xl sm:text-3xl font-semibold text-foreground">
                    {totalEvents}
                  </div>
                  <span className="text-[11px] sm:text-xs text-muted-foreground">Across all time</span>
                </div>
              </div>

              <div className="bg-card border border-border/60 rounded-2xl shadow-sm px-4 py-3 sm:px-5 sm:py-4 flex flex-col justify-between">
                <div className="text-xs font-medium text-muted-foreground mb-1">Active events</div>
                <div className="flex items-end justify-between gap-2">
                  <div className="text-2xl sm:text-3xl font-semibold text-foreground">
                    {activeEvents}
                  </div>
                  <span className="text-[11px] sm:text-xs text-muted-foreground">Published or ongoing</span>
                </div>
              </div>

              <div className="bg-card border border-border/60 rounded-2xl shadow-sm px-4 py-3 sm:px-5 sm:py-4 flex flex-col justify-between">
                <div className="text-xs font-medium text-muted-foreground mb-1">Total registrations</div>
                <div className="flex items-end justify-between gap-2">
                  <div className="text-2xl sm:text-3xl font-semibold text-foreground">
                    {totalRegistrations}
                  </div>
                  <span className="text-[11px] sm:text-xs text-muted-foreground">All events combined</span>
                </div>
              </div>
            </>
          )}
        </div>
      </section>

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 mt-8 sm:mt-10">
        <div className="bg-card border border-border/60 rounded-2xl px-2 sm:px-3 py-2 shadow-sm overflow-x-auto">
          <nav className="flex gap-2 sm:gap-3 min-w-max">
            {[
              { key: 'events', label: 'My Events' },
              { key: 'analytics', label: 'Analytics' },
              { key: 'marketplace', label: 'Marketplace' },
              { key: 'profile', label: 'Profile' },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium whitespace-nowrap transition-colors ${
                  activeTab === tab.key
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-8 pt-10 sm:pt-14">
         {/* Onboarding Checklist */}
         {/* Onboarding Checklist */}
         <div className="mb-6">
           <OrganizerOnboardingChecklist />
         </div>
 
         {/* Organizer overview widgets */}
         <div className="mb-6 sm:mb-8 grid gap-4 sm:gap-6 lg:grid-cols-3 lg:items-start">
           <div className="bg-card rounded-lg shadow p-4 sm:p-6">
             <h2 className="text-base sm:text-lg font-semibold text-foreground mb-2 sm:mb-3">Top Workspaces</h2>
             {topWorkspaces.length > 0 ? (
               <ul className="space-y-2.5 sm:space-y-3 text-xs sm:text-sm text-muted-foreground">
                 {topWorkspaces.map((ws) => (
                   <li key={ws.id} className="flex items-center justify-between">
                     <div>
                       <div className="font-medium text-foreground text-sm sm:text-base">{ws.name}</div>
                       {ws.event && (
                         <div className="text-[11px] sm:text-xs text-muted-foreground">Event: {ws.event.name}</div>
                       )}
                     </div>
                     <Link
                       to={`/${organization.slug}/workspaces/${ws.id}`}
                       className="text-primary hover:text-primary/80 text-xs font-medium"
                     >
                       Open
                     </Link>
                   </li>
                 ))}
               </ul>
             ) : (
               <p className="text-xs sm:text-sm text-muted-foreground">No workspaces yet for this organization.</p>
             )}
           </div>
 
           <div className="bg-card rounded-lg shadow p-4 sm:p-6">
             <h2 className="text-base sm:text-lg font-semibold text-foreground mb-2 sm:mb-3">Upcoming Event Milestones</h2>
             {upcomingMilestones.length > 0 ? (
               <ul className="space-y-2.5 sm:space-y-3 text-xs sm:text-sm text-muted-foreground">
                 {upcomingMilestones.map((event) => (
                   <li key={event.id} className="flex items-center justify-between">
                     <div>
                       <div className="font-medium text-foreground text-sm sm:text-base">{event.name}</div>
                       <div className="text-[11px] sm:text-xs text-muted-foreground">
                         Starts {new Date(event.startDate).toLocaleDateString()}
                       </div>
                     </div>
                     <Link
                       to={`/events/${event.id}`}
                       className="text-primary hover:text-primary/80 text-xs font-medium"
                     >
                       View
                     </Link>
                   </li>
                 ))}
               </ul>
             ) : (
               <p className="text-xs sm:text-sm text-muted-foreground">No upcoming events scheduled.</p>
             )}
           </div>
 
           <div className="bg-card rounded-lg shadow p-4 sm:p-6">
             <h2 className="text-base sm:text-lg font-semibold text-foreground mb-2 sm:mb-3">Quick Links</h2>
              <div className="space-y-2.5 sm:space-y-3 text-xs sm:text-sm">
                <Link
                  to={`/${organization.slug}/workspaces`}
                  className="block w-full text-left px-3 py-2 rounded-md bg-primary/10 text-primary hover:bg-primary/20 font-medium"
                >
                  Go to Workspaces
                </Link>
                <Link
                  to={`/${organization.slug}/organizations`}
                  className="block w-full text-left px-3 py-2 rounded-md bg-muted text-foreground hover:bg-muted/80 font-medium"
                >
                  Manage Organizations
                </Link>
              </div>
           </div>
         </div>
 
         {/* Current event overview */}
         {currentEvent && currentEventMetrics && (
           <div className="mb-6 sm:mb-8 bg-card rounded-lg shadow p-4 sm:p-6">
             <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-4 mb-3 md:mb-4">
               <div>
                 <h2 className="text-lg md:text-xl font-semibold text-foreground">Current Event Overview</h2>
                 <p className="text-xs sm:text-sm text-muted-foreground">
                   {currentEvent.name} · {new Date(currentEvent.start_date).toLocaleDateString()} –{' '}
                   {new Date(currentEvent.end_date).toLocaleDateString()}
                 </p>
               </div>
               <Link
                 to={`/events/${currentEvent.id}`}
                 className="text-xs sm:text-sm font-medium text-primary hover:text-primary/80"
               >
                 View event details
               </Link>
             </div>
             <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 text-xs sm:text-sm">
               <div className="bg-background rounded-lg border border-border p-3 sm:p-4">
                 <p className="text-[11px] sm:text-xs text-muted-foreground mb-1">Total registrations</p>
                 <p className="text-xl sm:text-2xl font-bold text-foreground">{currentEventMetrics.totalRegistrations}</p>
               </div>
               <div className="bg-background rounded-lg border border-border p-3 sm:p-4">
                 <p className="text-[11px] sm:text-xs text-muted-foreground mb-1">Confirmed</p>
                 <p className="text-xl sm:text-2xl font-bold text-emerald-500">{currentEventMetrics.confirmedRegistrations}</p>
               </div>
               <div className="bg-background rounded-lg border border-border p-3 sm:p-4">
                 <p className="text-[11px] sm:text-xs text-muted-foreground mb-1">Check-ins</p>
                 <p className="text-xl sm:text-2xl font-bold text-sky-500">{currentEventMetrics.checkins}</p>
               </div>
               <div className="bg-background rounded-lg border border-border p-3 sm:p-4">
                 <p className="text-[11px] sm:text-xs text-muted-foreground mb-1">Workspace tasks</p>
                 <p className="text-xl sm:text-2xl font-bold text-violet-500">{currentEventMetrics.tasks}</p>
               </div>
             </div>
           </div>
         )}
 
          {/* Profile Completion Prompt (Requirements 2.4, 2.5) */}
          {isProfileIncomplete && (
            <div className="mb-6 bg-amber-950/10 border border-amber-500/40 rounded-lg p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-amber-500" viewBox="0 0 20 20" fill="currentColor">
                    <path
                      fillRule="evenodd"
                      d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-amber-800 dark:text-amber-300">
                    Complete your profile
                  </h3>
                  <div className="mt-2 text-sm text-amber-700 dark:text-amber-200">
                    <p>
                      Complete your organizer profile to unlock all dashboard features and improve your event
                      management experience.
                    </p>
                  </div>
                  <div className="mt-4">
                    <div className="-mx-2 -my-1.5 flex">
                      <Link
                        to="/complete-profile"
                        className="bg-amber-500/10 px-2 py-1.5 rounded-md text-sm font-medium text-amber-800 dark:text-amber-100 hover:bg-amber-500/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500"
                      >
                        Complete profile
                      </Link>
                      <button
                        type="button"
                        onClick={() => setShowProfilePrompt(false)}
                        className="ml-3 bg-amber-500/5 px-2 py-1.5 rounded-md text-sm font-medium text-amber-800 dark:text-amber-100 hover:bg-amber-500/15 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500"
                      >
                        Dismiss
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

        {activeTab === 'events' && (
           <div>
             <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 sm:mb-6">
               <h2 className="text-xl sm:text-2xl font-bold text-foreground">My Events</h2>
               <Link
                 to={`/${organization.slug}/eventmanagement/create`}
                 className="bg-primary text-primary-foreground px-3 py-1.5 rounded-md text-sm hover:bg-primary/90 transition-colors"
               >
                 Create New Event
               </Link>
             </div>

              {events && events.length > 0 ? (
                <div className="grid gap-4 sm:gap-6 md:grid-cols-2 2xl:grid-cols-3">
                  {events.map((event) => (
                    <div key={event.id} className="bg-card rounded-lg shadow p-4 sm:p-6 border border-border/60">
                      <h3 className="text-base sm:text-lg font-semibold text-foreground mb-1.5 sm:mb-2">
                        {event.name}
                      </h3>
                      <p className="text-muted-foreground text-xs sm:text-sm mb-3 sm:mb-4 line-clamp-2">
                        {event.description}
                      </p>
                      <div className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-muted-foreground">
                        <p>Start: {new Date(event.startDate).toLocaleDateString()}</p>
                        <p>End: {new Date(event.endDate).toLocaleDateString()}</p>
                        <p>
                          Status: <span className="capitalize text-foreground">{event.status}</span>
                        </p>
                        <p>
                          Registrations: <span className="text-foreground">{event.registrationCount}</span>
                          {event.capacity && <span className="text-muted-foreground">{` / ${event.capacity}`}</span>}
                        </p>
                      </div>
                      <div className="mt-4 flex flex-wrap gap-2">
                        <Link
                          to={`/events/${event.id}`}
                          className="text-primary hover:text-primary/80 text-sm font-medium"
                        >
                          View details
                        </Link>
                        <Link
                          to={`/events/${event.id}/edit`}
                          className="text-muted-foreground hover:text-foreground text-sm font-medium"
                        >
                          Edit
                        </Link>
                        <Link
                          to={`/${organization.slug}/workspaces?eventId=${event.id}`}
                          className="text-emerald-600 hover:text-emerald-700 text-sm font-medium"
                        >
                          Event workspace
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-card rounded-lg border border-border/60">
                  <h3 className="text-lg font-medium text-foreground mb-2">No events yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Get started by creating your first event.
                  </p>
                  <Link
                    to="/events/create"
                    className="bg-primary text-primary-foreground px-4 py-2 rounded-full hover:bg-primary/90 transition-colors text-sm font-medium"
                  >
                    Create your first event
                  </Link>
                </div>
              )}
          </div>
        )}

        {activeTab === 'analytics' && (
           <div>
             <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-4 sm:mb-6">Analytics Overview</h2>
             {analytics ? (
               <div className="grid gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-4">
                 <div className="bg-card rounded-lg shadow p-4 sm:p-6">
                   <h3 className="text-sm sm:text-base font-semibold text-foreground mb-1.5 sm:mb-2">
                     Total Events
                   </h3>
                   <p className="text-2xl sm:text-3xl font-bold text-primary">
                     {analytics.totalEvents || 0}
                   </p>
                 </div>
                 <div className="bg-card rounded-lg shadow p-4 sm:p-6">
                   <h3 className="text-sm sm:text-base font-semibold text-foreground mb-1.5 sm:mb-2">
                     Total Registrations
                   </h3>
                   <p className="text-2xl sm:text-3xl font-bold text-emerald-500">
                     {analytics.totalRegistrations || 0}
                   </p>
                 </div>
                 <div className="bg-card rounded-lg shadow p-4 sm:p-6">
                   <h3 className="text-sm sm:text-base font-semibold text-foreground mb-1.5 sm:mb-2">
                     Active Events
                   </h3>
                   <p className="text-2xl sm:text-3xl font-bold text-sky-500">
                     {analytics.activeEvents || 0}
                   </p>
                 </div>
                 <div className="bg-card rounded-lg shadow p-4 sm:p-6">
                   <h3 className="text-sm sm:text-base font-semibold text-foreground mb-1.5 sm:mb-2">
                     Certificates Issued
                   </h3>
                   <p className="text-2xl sm:text-3xl font-bold text-violet-500">
                     {analytics.certificatesIssued || 0}
                   </p>
                 </div>
               </div>
             ) : (
               <div className="text-center py-8 sm:py-12">
                 <p className="text-sm sm:text-base text-muted-foreground">Loading analytics...</p>
               </div>
             )}
           </div>
         )}

        {activeTab === 'marketplace' && (
          <MarketplaceOrganizerInterface />
        )}

        {activeTab === 'profile' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-foreground">Profile settings</h2>
              <Link
                to="/complete-profile"
                className="bg-primary text-primary-foreground px-4 py-2 rounded-full hover:bg-primary/90 transition-colors text-sm font-medium"
              >
                Edit profile
              </Link>
            </div>

            {/* Profile Completion Status */}
            <div className="mb-6 bg-card rounded-lg shadow p-6 border border-border/60">
              <h3 className="text-lg font-medium text-foreground mb-4">Profile completion</h3>
              <div className="flex items-center">
                <div className="flex-1">
                  <div className="flex justify-between text-sm text-muted-foreground mb-1">
                    <span>Profile completeness</span>
                    <span>{isProfileIncomplete ? '60%' : '100%'}</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        isProfileIncomplete ? 'bg-amber-400' : 'bg-emerald-500'
                      }`}
                      style={{ width: isProfileIncomplete ? '60%' : '100%' }}
                    ></div>
                  </div>
                </div>
                <div className="ml-4">
                  <span
                    className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      isProfileIncomplete
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {isProfileIncomplete ? 'Incomplete' : 'Complete'}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-card rounded-lg shadow p-6 border border-border/60">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground">Name</label>
                    <p className="mt-1 text-sm text-foreground">{user?.name || 'Not provided'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground">Email</label>
                    <p className="mt-1 text-sm text-foreground">{user?.email}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground">Role</label>
                    <p className="mt-1 text-sm text-foreground">{user?.role}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground">Organization</label>
                    <p className="mt-1 text-sm text-foreground">{user?.organization || 'Not provided'}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground">Phone</label>
                    <p className="mt-1 text-sm text-foreground">{user?.phone || 'Not provided'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground">Website</label>
                    <p className="mt-1 text-sm text-foreground">
                      {user?.website ? (
                        <a
                          href={user.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:text-primary/80"
                        >
                          {user.website}
                        </a>
                      ) : (
                        'Not provided'
                      )}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground">Email status</label>
                    <p className="mt-1 text-sm text-foreground">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          user?.emailVerified
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {user?.emailVerified ? 'Verified' : 'Pending verification'}
                      </span>
                    </p>
                  </div>
                </div>
              </div>

              {user?.bio && (
                <div className="mt-6 pt-6 border-t border-border/60">
                  <label className="block text-sm font-medium text-muted-foreground">Bio</label>
                  <p className="mt-1 text-sm text-foreground">{user.bio}</p>
                </div>
              )}

              {user?.socialLinks && Object.keys(user.socialLinks).length > 0 && (
                <div className="mt-6 pt-6 border-t border-border/60">
                  <label className="block text-sm font-medium text-muted-foreground mb-3">Social links</label>
                  <div className="flex flex-wrap gap-4 text-sm">
                    {user.socialLinks.linkedin && (
                      <a
                        href={user.socialLinks.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:text-primary/80"
                      >
                        LinkedIn
                      </a>
                    )}
                    {user.socialLinks.twitter && (
                      <a
                        href={user.socialLinks.twitter}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:text-primary/80"
                      >
                        Twitter
                      </a>
                    )}
                    {user.socialLinks.github && (
                      <a
                        href={user.socialLinks.github}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:text-primary/80"
                      >
                        GitHub
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}