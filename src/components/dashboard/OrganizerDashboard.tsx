import { useState } from 'react';
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
    user
  } = useAuth();
  const organization = useCurrentOrganization();
  const [activeTab, setActiveTab] = useState<'events' | 'workspaces' | 'analytics'>('events');
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
                                Manage your organization's events and insights in one focused workspace.
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
            key: 'workspaces',
            label: 'My Workspaces'
          }, {
            key: 'analytics',
            label: 'Analytics'
          }].map(tab => <button key={tab.key} onClick={() => setActiveTab(tab.key as 'events' | 'workspaces' | 'analytics')} className={`px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium whitespace-nowrap transition-colors ${activeTab === tab.key ? 'bg-primary text-primary-foreground shadow-sm' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}>
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

                {/* My Workspaces Tab Content */}
                {activeTab === 'workspaces' && <div className="order-1">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 sm:mb-6">
                        <h2 className="text-lg sm:text-2xl font-bold text-foreground">My Workspaces</h2>
                        <Link to={`/${organization.slug}/workspaces`} className="bg-primary text-primary-foreground px-3 py-1.5 rounded-md text-xs sm:text-sm hover:bg-primary/90 transition-colors">
                            View All Workspaces
                        </Link>
                    </div>
                    {workspaces && workspaces.length > 0 ? (
                        <div className="grid gap-3 sm:gap-6 md:grid-cols-2 2xl:grid-cols-3">
                            {workspaces.map(ws => (
                                <div key={ws.id} className="bg-card rounded-lg shadow p-3 sm:p-6 border border-border/60">
                                    <h3 className="text-sm sm:text-lg font-semibold text-foreground mb-1.5 sm:mb-2">{ws.name}</h3>
                                    {ws.event && <p className="text-muted-foreground text-xs sm:text-sm mb-3 sm:mb-4">Event: {ws.event.name}</p>}
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs text-muted-foreground capitalize">{ws.status}</span>
                                        <Link to={`/${organization.slug}/workspaces/${ws.id}`} className="text-primary hover:text-primary/80 text-xs sm:text-sm font-medium">
                                            Open Workspace
                                        </Link>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="bg-card rounded-lg shadow p-6 text-center border border-border/60">
                            <p className="text-muted-foreground text-sm">No workspaces yet for this organization.</p>
                            <Link to={`/${organization.slug}/workspaces`} className="text-primary hover:text-primary/80 text-sm font-medium mt-2 inline-block">
                                Create your first workspace
                            </Link>
                        </div>
                    )}
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