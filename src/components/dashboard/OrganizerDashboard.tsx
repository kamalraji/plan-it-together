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

            {/* Compact Hero Section */}
            <section className="mt-3">
                <div className="relative overflow-hidden rounded-xl border border-border/40 bg-card/50 backdrop-blur-sm">
                    {/* Subtle accent line */}
                    <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-primary/40 to-transparent" />

                    <div className="relative px-4 sm:px-6 py-3 sm:py-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Dashboard</span>
                                <span className="h-1 w-1 rounded-full bg-primary/60" />
                                <span className="text-[10px] text-muted-foreground">{organization.name}</span>
                            </div>
                            <h1 className="text-lg sm:text-xl font-semibold tracking-tight text-foreground">
                                Welcome back{user?.name ? `, ${user.name}` : ''}
                            </h1>
                            <p className="mt-0.5 text-xs sm:text-sm text-muted-foreground">
                                Manage your events and insights
                            </p>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                            <Link to={eventCreatePath} className="inline-flex items-center justify-center rounded-lg bg-primary text-primary-foreground px-3 py-1.5 text-xs font-medium hover:bg-primary/90 transition-colors">
                                + New Event
                            </Link>
                            <button onClick={logout} className="inline-flex items-center justify-center rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-colors">
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            {/* Quick Links */}
            <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Quick:</span>
                <Link to={`/${organization.slug}/eventmanagement`} className="inline-flex items-center rounded-md px-2.5 py-1 bg-muted/50 border border-border/40 text-foreground hover:bg-muted text-[11px] font-medium transition-colors">
                    Events
                </Link>
                <Link to={`/${organization.slug}/workspaces`} className="inline-flex items-center rounded-md px-2.5 py-1 bg-muted/50 border border-border/40 text-foreground hover:bg-muted text-[11px] font-medium transition-colors">
                    Workspaces
                </Link>
                <Link to={`/${organization.slug}/organizations`} className="inline-flex items-center rounded-md px-2.5 py-1 bg-muted/50 border border-border/40 text-foreground hover:bg-muted text-[11px] font-medium transition-colors">
                    Organizations
                </Link>
            </div>


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