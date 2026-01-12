import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { PageHeader } from '../PageHeader';
import { EventDetailSkeleton } from '../EventDetailSkeleton';
import { Event, EventStatus, EventMode, UserRole } from '../../../types';
import { useAuth } from '@/hooks/useAuth';
import { useEventAccess } from '@/hooks/useEventAccess';
import {
  PencilIcon,
  ShareIcon,
  ChartBarIcon,
  UsersIcon,
  CalendarIcon,
  MapPinIcon,
  GlobeAltIcon,
  CogIcon,
  PaintBrushIcon,
  Squares2X2Icon,
} from '@heroicons/react/24/outline';
import { AttendanceList } from '@/components/attendance';
import { supabase } from '@/integrations/supabase/looseClient';
import { slugify } from '@/lib/workspaceNavigation';
import { EventSettingsTab } from '@/components/events/settings';

// Extended event type for internal use
interface EventWithSlug extends Event {
  slug?: string | null;
}

interface EventDetailPageProps {
  defaultTab?: string;
}

export const EventDetailPage: React.FC<EventDetailPageProps> = ({ defaultTab = 'overview' }) => {
  const { eventId } = useParams<{ eventId: string }>();
  const [activeTab, setActiveTab] = useState(defaultTab);
  const { canView, canManage, isLoading: accessLoading } = useEventAccess(eventId);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data: event, isLoading: eventLoading, error } = useQuery<EventWithSlug | null>({
    queryKey: ['organizer-event', eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('id', eventId as string)
        .maybeSingle();

      if (error) throw error;
      if (!data) return null;

      return {
        id: data.id,
        name: data.name,
        slug: data.slug,
        description: data.description || '',
        mode: data.mode as EventMode,
        startDate: data.start_date,
        endDate: data.end_date,
        capacity: data.capacity ?? undefined,
        registrationDeadline: undefined,
        organizerId: '',
        visibility: data.visibility,
        branding: (data.branding as any) || {},
        status: data.status as EventStatus,
        landingPageUrl: `/events/${data.id}`,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      } as EventWithSlug;
    },
    enabled: !!eventId,
  });

  const isLoading = accessLoading || eventLoading;

  if (isLoading) {
    return <EventDetailSkeleton />;
  }

  if (error || !event || !canView) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Event not found or access denied</h1>
          <Link to="/console/events/list" className="text-indigo-600 hover:text-indigo-800">
            Back to events
          </Link>
        </div>
      </div>
    );
  }

  const getStatusBadge = (status: EventStatus) => {
    const statusConfig = {
      [EventStatus.DRAFT]: { color: 'bg-yellow-100 text-yellow-800', label: 'Draft' },
      [EventStatus.PUBLISHED]: { color: 'bg-green-100 text-green-800', label: 'Published' },
      [EventStatus.ONGOING]: { color: 'bg-blue-100 text-blue-800', label: 'Ongoing' },
      [EventStatus.COMPLETED]: { color: 'bg-gray-100 text-gray-800', label: 'Completed' },
      [EventStatus.CANCELLED]: { color: 'bg-red-100 text-red-800', label: 'Cancelled' },
    };

    const config = statusConfig[status];
    return (
      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${config.color}`}>
        {config.label}
      </span>
    );
  };

  const getModeBadge = (mode: EventMode) => {
    const modeConfig = {
      [EventMode.ONLINE]: { color: 'bg-blue-100 text-blue-800', label: 'Online', icon: GlobeAltIcon },
      [EventMode.OFFLINE]: { color: 'bg-purple-100 text-purple-800', label: 'Offline', icon: MapPinIcon },
      [EventMode.HYBRID]: { color: 'bg-indigo-100 text-indigo-800', label: 'Hybrid', icon: CalendarIcon },
    };

    const config = modeConfig[mode];
    const IconComponent = config.icon;

    return (
      <span
        className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${config.color}`}
      >
        <IconComponent className="h-3 w-3 mr-1" />
        {config.label}
      </span>
    );
  };

  const { orgSlug } = useParams<{ orgSlug?: string }>();
  const eventSlug = event?.slug || slugify(event?.name || '');
  // Use clean hierarchical path to workspace list (no query params needed for list view)
  const workspacePath = orgSlug ? `/${orgSlug}/workspaces/${eventSlug}` : `/dashboard`;

  const pageActions = [
    ...(canManage
      ? [
        {
          label: 'Edit Landing Page',
          action: () => navigate(`/console/events/${eventId}/page-builder`),
          icon: PaintBrushIcon,
          variant: 'primary' as const,
        },
        {
          label: 'Edit Event',
          action: () => navigate(`/console/events/${eventId}/edit`),
          icon: PencilIcon,
          variant: 'secondary' as const,
        },
        {
          label: 'View Workspaces',
          action: () => navigate(workspacePath),
          icon: Squares2X2Icon,
          variant: 'secondary' as const,
        },
      ]
      : []),
    {
      label: 'Share Event',
      action: () => window.open(event.landingPageUrl || `/events/${eventId}`, '_blank'),
      icon: ShareIcon,
      variant: 'secondary' as const,
    },
    {
      label: 'View Analytics',
      action: () => setActiveTab('analytics'),
      icon: ChartBarIcon,
      variant: 'secondary' as const,
    },
    ...(canManage
      ? [
        {
          label: 'Open Ops Console',
          action: () => navigate(`/console/events/${eventId}/ops`),
          icon: UsersIcon,
          variant: 'secondary' as const,
        },
      ]
      : []),
  ];

  const tabs = [
    {
      id: 'overview',
      label: 'Overview',
      component: OverviewTab,
    },
    {
      id: 'registrations',
      label: 'Registrations',
      badge: '156',
      component: RegistrationsTab,
    },
    ...(canManage
      ? [
        {
          id: 'analytics',
          label: 'Analytics',
          component: AnalyticsTab,
        },
        {
          id: 'attendance',
          label: 'Attendance',
          component: AttendanceTab,
        },
        {
          id: 'settings',
          label: 'Settings',
          component: SettingsTab,
        },
      ]
      : [
        {
          id: 'analytics',
          label: 'Analytics',
          component: AnalyticsTab,
        },
      ]),
  ];

  const breadcrumbs = [
    { label: 'Events', href: '/console/events/list' },
    { label: event.name, href: `/console/events/${eventId}` },
  ];

  return (
    <div className="w-full overflow-hidden">
      <div className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8 py-4 sm:py-6">
        <PageHeader
          title={event.name}
          subtitle={`Event ID: ${eventId?.slice(0, 8)}...`}
          breadcrumbs={breadcrumbs}
          actions={pageActions}
          tabs={tabs.map((tab) => ({
            id: tab.id,
            label: tab.label,
            badge: tab.badge,
            current: activeTab === tab.id,
            onClick: () => setActiveTab(tab.id),
          }))}
        />

        {!canManage && (
          <div className="mt-4 rounded-lg bg-primary/5 border border-primary/10 p-3 sm:p-4 text-xs sm:text-sm text-primary">
            You're viewing this event as a participant or viewer. Editing, attendance, and ops tools are
            available only to organizers and admins of the hosting organization.
          </div>
        )}

        {/* Event Status and Quick Info */}
        <div className="mt-4 sm:mt-6 rounded-xl bg-card border border-border p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 sm:mb-6">
            <div className="flex flex-wrap items-center gap-2">
              {getStatusBadge(event.status)}
              {getModeBadge(event.mode)}
            </div>
            <div className="text-xs sm:text-sm text-muted-foreground">
              Last updated: {new Date(event.updatedAt).toLocaleDateString()}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <div className="flex items-start sm:items-center gap-3 p-3 rounded-lg bg-muted/30">
              <div className="flex-shrink-0 p-2 rounded-lg bg-primary/10">
                <CalendarIcon className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Start Date</p>
                <p className="text-sm font-medium text-foreground truncate">
                  {new Date(event.startDate).toLocaleString(undefined, { 
                    dateStyle: 'medium', 
                    timeStyle: 'short' 
                  })}
                </p>
              </div>
            </div>

            <div className="flex items-start sm:items-center gap-3 p-3 rounded-lg bg-muted/30">
              <div className="flex-shrink-0 p-2 rounded-lg bg-primary/10">
                <CalendarIcon className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">End Date</p>
                <p className="text-sm font-medium text-foreground truncate">
                  {new Date(event.endDate).toLocaleString(undefined, { 
                    dateStyle: 'medium', 
                    timeStyle: 'short' 
                  })}
                </p>
              </div>
            </div>

            <div className="flex items-start sm:items-center gap-3 p-3 rounded-lg bg-muted/30">
              <div className="flex-shrink-0 p-2 rounded-lg bg-primary/10">
                <UsersIcon className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Capacity</p>
                <p className="text-sm font-medium text-foreground">{event.capacity || 'Unlimited'}</p>
              </div>
            </div>

            <div className="flex items-start sm:items-center gap-3 p-3 rounded-lg bg-muted/30">
              <div className="flex-shrink-0 p-2 rounded-lg bg-primary/10">
                <CogIcon className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Registration</p>
                <p className="text-sm font-medium text-foreground">
                  {event.registrationDeadline
                    ? `Until ${new Date(event.registrationDeadline).toLocaleDateString()}`
                    : 'Open'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Content */}
        <div className="mt-4 sm:mt-6">
          {tabs.map((tab) => {
            if (activeTab !== tab.id) return null;
            
            // Special handling for settings tab to pass refetch
            if (tab.id === 'settings') {
              return (
                <div key={tab.id}>
                  <EventSettingsTab 
                    event={event} 
                    onUpdate={() => queryClient.invalidateQueries({ queryKey: ['organizer-event', eventId] })} 
                  />
                </div>
              );
            }
            
            return (
              <div key={tab.id}>
                <tab.component event={event} />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// Tab Components
const OverviewTab: React.FC<{ event: Event }> = ({ event }) => (
  <div className="rounded-xl bg-card border border-border p-4 sm:p-6">
    <h3 className="text-base sm:text-lg font-semibold text-foreground mb-3 sm:mb-4">Event Description</h3>
    <p className="text-sm sm:text-base text-muted-foreground mb-6 leading-relaxed">{event.description || 'No description provided.'}</p>

    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
      <div className="rounded-lg bg-muted/30 p-4">
        <h4 className="text-sm font-semibold text-foreground mb-3">Event Details</h4>
        <dl className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
            <dt className="text-xs sm:text-sm text-muted-foreground">Event ID:</dt>
            <dd className="text-xs sm:text-sm font-mono text-foreground break-all">{event.id}</dd>
          </div>
          <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
            <dt className="text-xs sm:text-sm text-muted-foreground">Created:</dt>
            <dd className="text-xs sm:text-sm text-foreground">
              {new Date(event.createdAt).toLocaleDateString()}
            </dd>
          </div>
          <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
            <dt className="text-xs sm:text-sm text-muted-foreground">Visibility:</dt>
            <dd className="text-xs sm:text-sm text-foreground capitalize">{event.visibility?.toLowerCase()}</dd>
          </div>
        </dl>
      </div>

      <div className="rounded-lg bg-muted/30 p-4">
        <h4 className="text-sm font-semibold text-foreground mb-3">Branding & Workspace Template</h4>
        <dl className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1">
            <dt className="text-xs sm:text-sm text-muted-foreground">Primary Color:</dt>
            <dd className="flex items-center gap-2">
              <div
                className="w-5 h-5 rounded-md border border-border shadow-sm"
                style={{ backgroundColor: event.branding?.primaryColor || '#6366f1' }}
              />
              <span className="text-xs sm:text-sm font-mono text-foreground">{event.branding?.primaryColor || 'Default'}</span>
            </dd>
          </div>
          {event.branding?.logoUrl && (
            <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
              <dt className="text-xs sm:text-sm text-muted-foreground">Logo:</dt>
              <dd className="text-xs sm:text-sm text-primary hover:underline">
                <a href={event.branding.logoUrl} target="_blank" rel="noopener noreferrer">
                  View Logo
                </a>
              </dd>
            </div>
          )}
        </dl>

        {event.branding?.workspaceTemplateId && (
          <div className="mt-4 pt-3 border-t border-border">
            <p className="text-sm font-medium text-foreground">Workspace template</p>
            <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
              This event will provision a workspace using template
              <span className="font-semibold text-foreground"> {event.branding.workspaceTemplateId}</span>.
            </p>
            <p className="mt-1 text-xs text-muted-foreground/80">
              The template preconfigures team roles, task categories, communication channels, and milestone
              timeline for your organizers.
            </p>
          </div>
        )}
      </div>
    </div>
  </div>
);

const RegistrationsTab: React.FC<{ event: Event }> = ({ event }) => (
  <div className="rounded-xl bg-card border border-border p-4 sm:p-6">
    <h3 className="text-base sm:text-lg font-semibold text-foreground mb-3 sm:mb-4">Registration Management</h3>
    <p className="text-sm text-muted-foreground">Registration management functionality will be implemented in future iterations.</p>
    <p className="text-xs text-muted-foreground/70 mt-2">Event: {event.name}</p>
  </div>
);


const AnalyticsTab: React.FC<{ event: Event }> = ({ event }) => (
  <div className="rounded-xl bg-card border border-border p-4 sm:p-6">
    <h3 className="text-base sm:text-lg font-semibold text-foreground mb-3 sm:mb-4">Event Analytics</h3>
    <p className="text-sm text-muted-foreground">Event analytics and reporting will be implemented in future iterations.</p>
    <p className="text-xs text-muted-foreground/70 mt-2">Event: {event.name}</p>
  </div>
);

const AttendanceTab: React.FC<{ event: Event }> = ({ event }) => {
  const { orgSlug } = useParams<{ orgSlug?: string }>();
  const { user, isLoading } = useAuth();

  const checkInPath = orgSlug
    ? `/${orgSlug}/eventmanagement/${event.id}/check-in`
    : `/dashboard/eventmanagement/${event.id}/check-in`;

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <p className="text-sm text-gray-600">Loading attendance data...</p>
      </div>
    );
  }

  const hasAccess =
    user &&
    (user.role === UserRole.SUPER_ADMIN ||
      user.role === UserRole.ORGANIZER ||
      user.role === UserRole.VOLUNTEER);

  if (!hasAccess) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-2">Restricted Access</h3>
        <p className="text-sm text-gray-600">
          Attendance analytics are only available to organizers and volunteers for this event.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Attendance</h3>
          <p className="text-sm text-gray-600">
            Live check-in data for participants attending this event.
          </p>
        </div>
        <Link
          to={checkInPath}
          className="inline-flex items-center px-3 py-2 rounded-md text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700"
        >
          Open check-in console
        </Link>
      </div>

      <AttendanceList eventId={event.id} />
    </div>
  );
};

const SettingsTab: React.FC<{ event: Event }> = ({ event }) => (
  <div className="rounded-xl bg-card border border-border p-4 sm:p-6">
    <h3 className="text-base sm:text-lg font-semibold text-foreground mb-3 sm:mb-4">Event Settings</h3>
    <p className="text-sm text-muted-foreground">Event settings and configuration will be implemented in future iterations.</p>
    <p className="text-xs text-muted-foreground/70 mt-2">Event: {event.name}</p>
  </div>
);

export default EventDetailPage;

