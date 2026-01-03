import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import api from '../../lib/api';
import { useAuth } from '../../hooks/useAuth';
import { useCurrentOrganization } from '../organization/OrganizationContext';
import { OrganizerOnboardingChecklist } from '../organization/OrganizerOnboardingChecklist';
import { supabase } from '@/integrations/supabase/client';
import { useApiHealth } from '@/hooks/useApiHealth';
import { useEventCreatePath } from '@/hooks/useEventCreatePath';
import { OrgRoleAccessBanner } from '@/components/organization/OrgRoleAccessBanner';

import { OrganizerBreadcrumbs } from '@/components/organization/OrganizerBreadcrumbs';
import { OrgPageWrapper } from '@/components/organization/OrgPageWrapper';
interface Event {
  id: string;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  status: string;
  registrationCount: number;
  capacity?: number | null;
}
interface WorkspaceSummary {
  id: string;
  name: string;
  status: string;
  updatedAt: string;
  event?: {
    id: string;
    name: string;
  } | null;
}
export function OrganizerDashboard() {
  const {
    user,
    logout
  } = useAuth();
  const organization = useCurrentOrganization();
  const [activeTab, setActiveTab] = useState<'events' | 'analytics'>('events');
  const [isChecklistOpen, setIsChecklistOpen] = useState(true);
  const [isAccessInfoOpen, setIsAccessInfoOpen] = useState(false);
  const {
    isHealthy
  } = useApiHealth();

  // Check if profile completion is needed (Requirements 2.4, 2.5)
  const isProfileIncomplete = !user?.profileCompleted || !user?.bio || !user?.organization;
  // Fetch events directly from Supabase
  const {
    data: events
  } = useQuery<Event[]>({
    queryKey: ['organizer-events-supabase', organization.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('events')
        .select(`
          id,
          name,
          description,
          start_date,
          end_date,
          status,
          capacity
        `)
        .eq('organization_id', organization.id)
        .order('start_date', { ascending: false });
      
      if (error) throw error;
      
      // Get registration counts for each event
      const eventsWithCounts = await Promise.all(
        (data || []).map(async (event) => {
          const { count } = await supabase
            .from('registrations')
            .select('*', { count: 'exact', head: true })
            .eq('event_id', event.id);
          
          return {
            id: event.id,
            name: event.name,
            description: event.description || '',
            startDate: event.start_date,
            endDate: event.end_date,
            status: event.status,
            registrationCount: count || 0,
            capacity: event.capacity
          };
        })
      );
      
      return eventsWithCounts;
    },
    retry: 1,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false
  });

  // Fetch workspaces directly from Supabase - scoped to user AND organization
  const {
    data: workspaces
  } = useQuery<WorkspaceSummary[]>({
    queryKey: ['organizer-workspaces-supabase', organization.id, user?.id],
    queryFn: async () => {
      // First get event IDs that belong to this organization
      const { data: orgEvents, error: eventsError } = await supabase
        .from('events')
        .select('id')
        .eq('organization_id', organization.id);
      
      if (eventsError) throw eventsError;
      
      const orgEventIds = (orgEvents || []).map(e => e.id);
      
      if (orgEventIds.length === 0) {
        return [];
      }
      
      // Fetch workspaces that belong to the user AND are linked to org events
      const { data, error } = await supabase
        .from('workspaces')
        .select(`
          id,
          name,
          status,
          updated_at,
          event_id,
          events (
            id,
            name
          )
        `)
        .eq('organizer_id', user!.id)
        .in('event_id', orgEventIds)
        .order('updated_at', { ascending: false });
      
      if (error) throw error;
      
      return (data || []).map(ws => ({
        id: ws.id,
        name: ws.name,
        status: ws.status,
        updatedAt: ws.updated_at,
        event: ws.events ? { id: ws.events.id, name: ws.events.name } : null
      }));
    },
    retry: 1,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    enabled: !!user?.id && !!organization.id
  });
  const {
    data: analytics
  } = useQuery<any>({
    queryKey: ['organizer-analytics', organization.id],
    queryFn: async () => {
      const response = await api.get('/analytics/organizer-summary', {
        params: {
          organizationId: organization.id
        }
      });
      return response.data;
    },
    retry: 1,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    enabled: isHealthy !== false
  });
  const eventCreatePath = useEventCreatePath();
  const topWorkspaces = useMemo(() => {
    if (!workspaces) return [];
    return [...workspaces].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()).slice(0, 3);
  }, [workspaces]);
  const upcomingMilestones = useMemo(() => {
    if (!events) return [];
    const now = new Date();
    return [...events].filter(event => new Date(event.startDate) > now).sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()).slice(0, 3);
  }, [events]);
  const {
    data: currentEvent
  } = useQuery({
    queryKey: ['organizer-current-event', organization.id],
    queryFn: async () => {
      const {
        data,
        error
      } = await supabase.from('events').select('*').eq('organization_id', organization.id).in('status', ['PUBLISHED', 'ONGOING']).order('start_date', {
        ascending: true
      }).limit(1).maybeSingle();
      if (error) throw error;
      return data;
    }
  });
  const {
    data: currentEventMetrics
  } = useQuery({
    enabled: !!currentEvent,
    queryKey: ['organizer-current-event-metrics', currentEvent?.id],
    queryFn: async () => {
      if (!currentEvent) return null;
      const eventId = currentEvent.id as string;
      const [registrationsRes, confirmedRes, checkinsRes, tasksRes] = await Promise.all([supabase.from('registrations').select('*', {
        count: 'exact',
        head: true
      }).eq('event_id', eventId), supabase.from('registrations').select('*', {
        count: 'exact',
        head: true
      }).eq('event_id', eventId).eq('status', 'CONFIRMED'), supabase.from('attendance_records').select('*', {
        count: 'exact',
        head: true
      }).eq('event_id', eventId), supabase.from('workspace_activities').select('*', {
        count: 'exact',
        head: true
      }).eq('type', 'task').eq('workspace_id', eventId)]);
      if (registrationsRes.error) throw registrationsRes.error;
      if (confirmedRes.error) throw confirmedRes.error;
      if (checkinsRes.error) throw checkinsRes.error;
      if (tasksRes.error) throw tasksRes.error;
      return {
        totalRegistrations: registrationsRes.count ?? 0,
        confirmedRegistrations: confirmedRes.count ?? 0,
        checkins: checkinsRes.count ?? 0,
        tasks: tasksRes.count ?? 0
      };
    }
  });
  
  return <OrgPageWrapper>
            {/* Breadcrumb */}
            <OrganizerBreadcrumbs current="dashboard" />

            {/* Hero with glassmorphic organization summary */}
            <section className="mt-4">
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
                                Welcome back{user?.name ? `, ${user.name}` : ''}. Manage your organization's events and insights in one
                                focused workspace.
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

                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 w-full">
                                <Link to={eventCreatePath} className="w-full sm:flex-1 min-w-0 inline-flex items-center justify-center rounded-full bg-primary text-primary-foreground px-4 sm:px-5 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold hover:bg-primary/90 hover:scale-105 active:scale-95 transition-all shadow-sm">
                                    Create Event
                                </Link>
                                <button onClick={logout} className="w-full sm:flex-1 min-w-0 inline-flex items-center justify-center rounded-full border-2 border-border/70 bg-background/80 backdrop-blur px-4 sm:px-5 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold text-foreground hover:bg-muted/80 transition-all">
                                    Logout
                                </button>
                            </div>

                            <div className="flex flex-wrap items-center gap-2 justify-center xs:justify-end text-[11px] sm:text-xs text-muted-foreground">
                                <span className="hidden sm:inline">Shortcuts:</span>
                                <Link to={`/${organization.slug}/eventmanagement`} className="inline-flex items-center rounded-full px-3 py-1 bg-background/70 border border-border/60 text-foreground hover:bg-muted/80 text-xs font-medium">
                                    Event Management
                                </Link>
                                <Link to={`/${organization.slug}/workspaces`} className="inline-flex items-center rounded-full px-3 py-1 bg-background/70 border border-border/60 text-foreground hover:bg-muted/80 text-xs font-medium">
                                    Workspaces
                                </Link>
                                <Link to={`/${organization.slug}/organizations`} className="inline-flex items-center rounded-full px-3 py-1 bg-background/70 border border-border/60 text-foreground hover:bg-muted/80 text-xs font-medium">
                                    Organizations
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </section>


            {/* Navigation Tabs */}
            <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 mt-8 sm:mt-10">
                <div className="bg-card border border-border/60 rounded-2xl px-2 sm:px-3 py-2 shadow-sm overflow-x-auto">
                    <nav className="flex gap-2 sm:gap-3 min-w-max">
                        {[{
            key: 'events',
            label: 'My Events'
          }, {
            key: 'analytics',
            label: 'Analytics'
          }].map(tab => <button key={tab.key} onClick={() => setActiveTab(tab.key as 'events' | 'analytics')} className={`px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium whitespace-nowrap transition-colors ${activeTab === tab.key ? 'bg-primary text-primary-foreground shadow-sm' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}>
                                {tab.label}
                            </button>)}
                    </nav>
                </div>
            </div>

            {/* Content */}
            <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 pt-10 sm:pt-14 flex flex-col gap-6 sm:gap-8 sm:py-[5px]">
                {/* Onboarding Checklist - only for orgs with no events, collapsible */}
                {false && <section className="mb-6">
                        <div className="bg-card border border-border/60 rounded-2xl shadow-sm">
                            <button type="button" onClick={() => setIsChecklistOpen(prev => !prev)} className="w-full flex items-center justify-between px-4 sm:px-5 py-3 sm:py-3.5 text-xs sm:text-sm font-medium text-foreground">
                                <span>Getting started checklist</span>
                                <span className="text-muted-foreground text-[11px] sm:text-xs">
                                    {isChecklistOpen ? 'Hide' : 'Show'}
                                </span>
                            </button>
                            {isChecklistOpen && <div className="border-t border-border/60 px-4 sm:px-5 py-3 sm:py-4">
                                    <OrganizerOnboardingChecklist />
                                </div>}
                        </div>
                    </section>}

                {/* Organizer overview widgets */}
                <div className="order-2 mb-5 sm:mb-8 grid gap-3 sm:gap-6 lg:grid-cols-2 lg:items-start">
                    <div className="bg-card rounded-lg shadow p-3 sm:p-6">
                        <h2 className="text-sm sm:text-lg font-semibold text-foreground mb-2 sm:mb-3">Top Workspaces</h2>
                        {topWorkspaces.length > 0 ? <ul className="space-y-2 sm:space-y-3 text-xs sm:text-sm text-muted-foreground">
                                {topWorkspaces.map(ws => <li key={ws.id} className="flex items-center justify-between">
                                        <div>
                                            <div className="font-medium text-foreground text-sm sm:text-base">{ws.name}</div>
                                            {ws.event && <div className="text-[11px] sm:text-xs text-muted-foreground">Event: {ws.event.name}</div>}
                                        </div>
                                        <Link to={`/${organization.slug}/workspaces/${ws.id}`} className="text-primary hover:text-primary/80 text-xs font-medium">
                                            Open
                                        </Link>
                                    </li>)}
                            </ul> : <p className="text-xs sm:text-sm text-muted-foreground">No workspaces yet for this organization.</p>}
                    </div>

                    <div className="bg-card rounded-lg shadow p-3 sm:p-6">
                        <h2 className="text-sm sm:text-lg font-semibold text-foreground mb-2 sm:mb-3">Upcoming Event Milestones</h2>
                        {upcomingMilestones.length > 0 ? <ul className="space-y-2 sm:space-y-3 text-xs sm:text-sm text-muted-foreground">
                                {upcomingMilestones.map(event => <li key={event.id} className="flex items-center justify-between">
                                        <div>
                                            <div className="font-medium text-foreground text-sm sm:text-base">{event.name}</div>
                                            <div className="text-[11px] sm:text-xs text-muted-foreground">
                                                Starts {new Date(event.startDate).toLocaleDateString()}
                                            </div>
                                        </div>
                                        <Link to={`/events/${event.id}`} className="text-primary hover:text-primary/80 text-xs font-medium">
                                            View
                                        </Link>
                                    </li>)}
                            </ul> : <p className="text-xs sm:text-sm text-muted-foreground">No upcoming events scheduled.</p>}
                    </div>
                </div>

                {/* Current event overview */}
                {currentEvent && currentEventMetrics && <div className="order-3 mb-6 sm:mb-8 bg-card rounded-lg shadow p-4 sm:p-6">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-4 mb-3 md:mb-4">
                            <div>
                                <h2 className="text-lg md:text-xl font-semibold text-foreground">Current Event Overview</h2>
                                <p className="text-xs sm:text-sm text-muted-foreground">
                                    {currentEvent.name} · {new Date(currentEvent.start_date).toLocaleDateString()} –{' '}
                                    {new Date(currentEvent.end_date).toLocaleDateString()}
                                </p>
                            </div>
                            <Link to={`/events/${currentEvent.id}`} className="text-xs sm:text-sm font-medium text-primary hover:text-primary/80">
                                View event details
                            </Link>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 text-xs sm:text-sm">
                            <div className="bg-background rounded-lg border border-border p-3 sm:p-4">
                                <p className="text-[11px] sm:text-xs text-muted-foreground mb-1">Total registrations</p>
                                <p className="text-xl sm:text-2xl font-bold text-foreground">
                                    {currentEventMetrics.totalRegistrations}
                                </p>
                            </div>
                            <div className="bg-background rounded-lg border border-border p-3 sm:p-4">
                                <p className="text-[11px] sm:text-xs text-muted-foreground mb-1">Confirmed</p>
                                <p className="text-xl sm:text-2xl font-bold text-emerald-500">
                                    {currentEventMetrics.confirmedRegistrations}
                                </p>
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
                    </div>}

                {/* Profile Completion Prompt (Requirements 2.4, 2.5) */}
                {isProfileIncomplete}

                {activeTab === 'events' && <div className="order-1">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 sm:mb-6">
                            <h2 className="text-lg sm:text-2xl font-bold text-foreground">My Events</h2>
                            <Link to={eventCreatePath} className="bg-primary text-primary-foreground px-3 py-1.5 rounded-md text-xs sm:text-sm hover:bg-primary/90 transition-colors">
                                Create New Event
                            </Link>
                        </div>

                        {events && events.length > 0 ? <div className="grid gap-3 sm:gap-6 md:grid-cols-2 2xl:grid-cols-3">
                                {events.map(event => <div key={event.id} className="bg-card rounded-lg shadow p-3 sm:p-6 border border-border/60">
                                        <h3 className="text-sm sm:text-lg font-semibold text-foreground mb-1.5 sm:mb-2">{event.name}</h3>
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
                                            <Link to={`/events/${event.id}`} className="text-primary hover:text-primary/80 text-xs sm:text-sm font-medium">
                                                View details
                                            </Link>
                                            <Link to={`/events/${event.id}/edit`} className="text-muted-foreground hover:text-foreground text-xs sm:text-sm font-medium">
                                                Edit
                                            </Link>
                                            <Link to={`/${organization.slug}/workspaces?eventId=${event.id}`} className="text-emerald-600 hover:text-emerald-700 text-xs sm:text-sm font-medium">
                                                Event workspace
                                            </Link>
                                        </div>
                                    </div>)}
                            </div> : <div className="text-center py-10 sm:py-12 bg-card rounded-lg border border-border/60">
                                <h3 className="text-base sm:text-lg font-medium text-foreground mb-2">No events yet</h3>
                                <p className="text-xs sm:text-sm text-muted-foreground mb-4">Get started by creating your first event.</p>
                                <Link to={eventCreatePath} className="bg-primary text-primary-foreground px-4 py-2 rounded-full hover:bg-primary/90 transition-colors text-xs sm:text-sm font-medium">
                                    Create your first event
                                </Link>
                            </div>}
                    </div>}

                {activeTab === 'analytics' && <div className="order-1 mt-6 sm:mt-8">
                        <h2 className="text-lg sm:text-2xl font-bold text-foreground mb-4 sm:mb-6">Analytics Overview</h2>
                        {analytics ? <div className="grid gap-3 sm:gap-6 md:grid-cols-2 lg:grid-cols-4">
                                <div className="bg-card rounded-lg shadow p-3 sm:p-6">
                                    <h3 className="text-sm sm:text-base font-semibold text-foreground mb-1.5 sm:mb-2">Total Events</h3>
                                    <p className="text-xl sm:text-3xl font-bold text-primary">{analytics.totalEvents || 0}</p>
                                </div>
                                <div className="bg-card rounded-lg shadow p-3 sm:p-6">
                                    <h3 className="text-sm sm:text-base font-semibold text-foreground mb-1.5 sm:mb-2">
                                        Total Registrations
                                    </h3>
                                    <p className="text-xl sm:text-3xl font-bold text-emerald-500">
                                        {analytics.totalRegistrations || 0}
                                    </p>
                                </div>
                                <div className="bg-card rounded-lg shadow p-3 sm:p-6">
                                    <h3 className="text-sm sm:text-base font-semibold text-foreground mb-1.5 sm:mb-2">Active Events</h3>
                                    <p className="text-xl sm:text-3xl font-bold text-sky-500">{analytics.activeEvents || 0}</p>
                                </div>
                                <div className="bg-card rounded-lg shadow p-3 sm:p-6">
                                    <h3 className="text-sm sm:text-base font-semibold text-foreground mb-1.5 sm:mb-2">
                                        Certificates Issued
                                    </h3>
                                    <p className="text-xl sm:text-3xl font-bold text-violet-500">
                                        {analytics.certificatesIssued || 0}
                                    </p>
                                </div>
                            </div> : <div className="text-center py-8 sm:py-12">
                                <p className="text-sm sm:text-base text-muted-foreground">Loading analytics...</p>
                            </div>}
                    </div>}

                {/* Access in this organization - compact, collapsible row at the bottom */}
                <section className="order-5 mt-8 sm:mt-10">
                    <div className="bg-card/80 border border-border/60 rounded-2xl shadow-sm">
                        <button type="button" onClick={() => setIsAccessInfoOpen(prev => !prev)} className="w-full flex items-center justify-between px-4 sm:px-5 py-3 sm:py-3.5 text-xs sm:text-sm font-medium text-foreground">
                            <span>Access in this organization</span>
                            <span className="text-muted-foreground text-[11px] sm:text-xs">
                                {isAccessInfoOpen ? 'Hide' : 'Show'}
                            </span>
                        </button>
                        {isAccessInfoOpen && <div className="border-t border-border/60 px-3 sm:px-4 py-3 sm:py-4">
                                <OrgRoleAccessBanner />
                            </div>}
                    </div>
                </section>

                {/* Getting started checklist - collapsible section at the very bottom */}
                {(events?.length ?? 0) === 0 && <section className="order-6 mt-6 sm:mt-8">
                        <div className="bg-card border border-border/60 rounded-2xl shadow-sm">
                            <button type="button" onClick={() => setIsChecklistOpen(prev => !prev)} className="w-full flex items-center justify-between px-4 sm:px-5 py-3 sm:py-3.5 text-xs sm:text-sm font-medium text-foreground">
                                <span>Getting started checklist</span>
                                <span className="text-muted-foreground text-[11px] sm:text-xs">
                                    {isChecklistOpen ? 'Hide' : 'Show'}
                                </span>
                            </button>
                            {isChecklistOpen && <div className="border-t border-border/60 px-4 sm:px-5 py-3 sm:py-4">
                                    <OrganizerOnboardingChecklist />
                                </div>}
                        </div>
                    </section>}
            </main>
        </OrgPageWrapper>;
}