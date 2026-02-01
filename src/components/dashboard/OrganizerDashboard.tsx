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
import { Calendar, Users, Clock, ArrowRight, Plus, Zap, Eye, Pencil, FolderOpen } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

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
      if (!data || data.length === 0) return [];
      
      // Batch query: Get all registrations for all events in single query
      const eventIds = data.map(e => e.id);
      const { data: registrations } = await supabase
        .from('registrations')
        .select('event_id')
        .in('event_id', eventIds);
      
      // Count registrations per event from batch result
      const regCounts: Record<string, number> = {};
      (registrations || []).forEach(r => {
        regCounts[r.event_id] = (regCounts[r.event_id] || 0) + 1;
      });
      
      // Map events with counts without additional queries
      return data.map(event => ({
        id: event.id,
        name: event.name,
        description: event.description || '',
        startDate: event.start_date,
        endDate: event.end_date,
        status: event.status,
        registrationCount: regCounts[event.id] || 0,
        capacity: event.capacity
      }));
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
    retry: 0, // No retries for faster feedback
    staleTime: 10 * 60 * 1000, // Cache for 10 minutes
    gcTime: 15 * 60 * 1000, // Keep in cache for 15 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    networkMode: 'offlineFirst',
    enabled: isHealthy === true, // Only fetch when API is confirmed healthy
    placeholderData: { totalRegistrations: 0, totalRevenue: 0 }, // Fallback data
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
                                        <Link to={`/${organization.slug}/workspaces`} className="text-primary hover:text-primary/80 text-xs sm:text-sm font-medium">
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

                {activeTab === 'events' && <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="order-1"
                >
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 rounded-xl bg-primary/10">
                                <Calendar className="h-5 w-5 text-primary" />
                            </div>
                            <h2 className="text-xl sm:text-2xl font-bold text-foreground">My Events</h2>
                        </div>
                        <Button asChild size="sm" className="rounded-full gap-2 shadow-md hover:shadow-lg transition-shadow">
                            <Link to={eventCreatePath}>
                                <Plus className="h-4 w-4" />
                                Create Event
                            </Link>
                        </Button>
                    </div>

                    {events && events.length > 0 ? (
                        <div className="grid gap-4 sm:gap-6 md:grid-cols-2 2xl:grid-cols-3">
                            {events.map((event, index) => {
                                const startDate = new Date(event.startDate);
                                const endDate = new Date(event.endDate);
                                const isLive = event.status === 'ONGOING';
                                const isDraft = event.status === 'DRAFT';
                                const isPublished = event.status === 'PUBLISHED';
                                
                                return (
                                    <motion.div
                                        key={event.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.3, delay: index * 0.05 }}
                                        className="group relative bg-card rounded-2xl border-2 border-border/50 overflow-hidden hover:border-primary/40 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300"
                                    >
                                        {/* Live indicator bar */}
                                        {isLive && (
                                            <div className="h-1 bg-gradient-to-r from-red-500 via-orange-500 to-red-500 animate-pulse" />
                                        )}
                                        
                                        <div className="p-4 sm:p-5">
                                            {/* Header with date badge */}
                                            <div className="flex items-start gap-4 mb-4">
                                                <div className={`flex-shrink-0 w-14 text-center rounded-xl p-2.5 transition-colors ${
                                                    isLive 
                                                        ? 'bg-gradient-to-br from-red-500/20 to-orange-500/20 border border-red-500/30' 
                                                        : 'bg-primary/10 group-hover:bg-primary/15'
                                                }`}>
                                                    <span className="block text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
                                                        {startDate.toLocaleDateString('en-US', { month: 'short' })}
                                                    </span>
                                                    <span className={`block text-xl font-bold ${isLive ? 'text-red-500' : 'text-primary'}`}>
                                                        {startDate.getDate()}
                                                    </span>
                                                </div>
                                                
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="text-base sm:text-lg font-semibold text-foreground mb-1.5 line-clamp-1 group-hover:text-primary transition-colors">
                                                        {event.name}
                                                    </h3>
                                                    <p className="text-muted-foreground text-xs sm:text-sm line-clamp-2">
                                                        {event.description || 'No description provided'}
                                                    </p>
                                                </div>
                                            </div>
                                            
                                            {/* Status & Stats */}
                                            <div className="flex flex-wrap items-center gap-2 mb-4">
                                                <Badge 
                                                    variant={isLive ? 'default' : isDraft ? 'secondary' : 'outline'}
                                                    className={`text-xs ${
                                                        isLive 
                                                            ? 'bg-red-500/10 text-red-600 border-red-500/30 animate-pulse' 
                                                            : isDraft 
                                                                ? 'bg-amber-500/10 text-amber-600 border-amber-500/30'
                                                                : isPublished
                                                                    ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30'
                                                                    : ''
                                                    }`}
                                                >
                                                    {isLive && <Zap className="h-3 w-3 mr-1" />}
                                                    {event.status}
                                                </Badge>
                                                
                                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                                    <Users className="h-3.5 w-3.5" />
                                                    <span className="font-medium text-foreground">{event.registrationCount}</span>
                                                    {event.capacity && <span>/ {event.capacity}</span>}
                                                </div>
                                                
                                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                                    <Clock className="h-3.5 w-3.5" />
                                                    <span>{startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                                                </div>
                                            </div>
                                            
                                            {/* Actions */}
                                            <div className="flex items-center gap-2 pt-3 border-t border-border/50">
                                                <Link 
                                                    to={`/events/${event.id}`} 
                                                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/10 rounded-lg transition-colors"
                                                >
                                                    <Eye className="h-3.5 w-3.5" />
                                                    View
                                                </Link>
                                                <Link 
                                                    to={`/events/${event.id}/edit`} 
                                                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/60 rounded-lg transition-colors"
                                                >
                                                    <Pencil className="h-3.5 w-3.5" />
                                                    Edit
                                                </Link>
                                                <Link 
                                                    to={`/${organization.slug}/workspaces`} 
                                                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-600 hover:bg-emerald-500/10 rounded-lg transition-colors ml-auto"
                                                >
                                                    <FolderOpen className="h-3.5 w-3.5" />
                                                    Workspace
                                                    <ArrowRight className="h-3 w-3 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                                                </Link>
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    ) : (
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="text-center py-12 sm:py-16 bg-gradient-to-br from-card to-muted/30 rounded-2xl border-2 border-dashed border-border/60"
                        >
                            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-primary/10 flex items-center justify-center">
                                <Calendar className="h-8 w-8 text-primary/60" />
                            </div>
                            <h3 className="text-lg font-semibold text-foreground mb-2">No events yet</h3>
                            <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">
                                Create your first event and start managing registrations, attendance, and more.
                            </p>
                            <Button asChild className="rounded-full gap-2">
                                <Link to={eventCreatePath}>
                                    <Plus className="h-4 w-4" />
                                    Create your first event
                                </Link>
                            </Button>
                        </motion.div>
                    )}
                </motion.div>}

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