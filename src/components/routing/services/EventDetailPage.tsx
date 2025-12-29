import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { PageHeader } from '../PageHeader';
import { Event, EventStatus, EventMode, UserRole, WorkspaceStatus, WorkspaceRole } from '../../../types';
import { WorkspacePermissionsBanner } from '@/components/workspace/WorkspacePermissionsBanner';
import { WorkspaceRolePermissionsTable } from '@/components/workspace/WorkspaceRolePermissionsTable';
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
} from '@heroicons/react/24/outline';
import { AttendanceList } from '@/components/attendance';
import { supabase } from '@/integrations/supabase/looseClient';
import { WorkspaceDashboard } from '@/components/workspace/WorkspaceDashboard';

interface EventDetailPageProps {
  defaultTab?: string;
}

export const EventDetailPage: React.FC<EventDetailPageProps> = ({ defaultTab = 'overview' }) => {
  const { eventId } = useParams<{ eventId: string }>();
  const [activeTab, setActiveTab] = useState(defaultTab);
  const { canView, canManage, isLoading: accessLoading } = useEventAccess(eventId);

  const { data: event, isLoading: eventLoading, error } = useQuery<Event | null>({
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
      } as Event;
    },
    enabled: !!eventId,
  });

  const isLoading = accessLoading || eventLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
      </div>
    );
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

  const pageActions = [
    ...(canManage
      ? [
        {
          label: 'Edit Event',
          action: () => (window.location.href = `/console/events/${eventId}/edit`),
          icon: PencilIcon,
          variant: 'primary' as const,
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
          action: () => (window.location.href = `/console/events/${eventId}/ops`),
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
          id: 'workspace',
          label: 'Workspace',
          component: WorkspaceTab,
        },
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
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <PageHeader
          title={event.name}
          subtitle={`Event ID: ${eventId}`}
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
          <div className="mt-4 bg-blue-50 border border-blue-100 rounded-md p-3 text-xs sm:text-sm text-blue-800">
            You’re viewing this event as a participant or viewer. Editing, attendance, and ops tools are
            available only to organizers and admins of the hosting organization.
          </div>
        )}

        {/* Event Status and Quick Info */}
        <div className="mt-6 bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              {getStatusBadge(event.status)}
              {getModeBadge(event.mode)}
            </div>
            <div className="text-sm text-gray-500">
              Last updated: {new Date(event.updatedAt).toLocaleDateString()}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="flex items-center space-x-3">
              <CalendarIcon className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm font-medium text-gray-900">Start Date</p>
                <p className="text-sm text-gray-600">
                  {new Date(event.startDate).toLocaleString()}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <CalendarIcon className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm font-medium text-gray-900">End Date</p>
                <p className="text-sm text-gray-600">
                  {new Date(event.endDate).toLocaleString()}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <UsersIcon className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm font-medium text-gray-900">Capacity</p>
                <p className="text-sm text-gray-600">{event.capacity || 'Unlimited'}</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <CogIcon className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm font-medium text-gray-900">Registration</p>
                <p className="text-sm text-gray-600">
                  {event.registrationDeadline
                    ? `Until ${new Date(event.registrationDeadline).toLocaleDateString()}`
                    : 'Open'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Content */}
        <div className="mt-6">
          {tabs.map(
            (tab) =>
              activeTab === tab.id && (
                <div key={tab.id}>
                  <tab.component event={event} />
                </div>
              ),
          )}
        </div>
      </div>
    </div>
  );
};

// Tab Components
const OverviewTab: React.FC<{ event: Event }> = ({ event }) => (
  <div className="bg-white rounded-lg border border-gray-200 p-6">
    <h3 className="text-lg font-medium text-gray-900 mb-4">Event Description</h3>
    <p className="text-gray-700 mb-6">{event.description}</p>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
        <h4 className="text-sm font-medium text-gray-900 mb-2">Event Details</h4>
        <dl className="space-y-2">
          <div className="flex justify-between">
            <dt className="text-sm text-gray-500">Event ID:</dt>
            <dd className="text-sm text-gray-900">{event.id}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-sm text-gray-500">Created:</dt>
            <dd className="text-sm text-gray-900">
              {new Date(event.createdAt).toLocaleDateString()}
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-sm text-gray-500">Visibility:</dt>
            <dd className="text-sm text-gray-900">{event.visibility}</dd>
          </div>
        </dl>
      </div>

      <div>
        <h4 className="text-sm font-medium text-gray-900 mb-2">Branding & workspace template</h4>
        <dl className="space-y-2">
          <div className="flex justify-between">
            <dt className="text-sm text-gray-500">Primary Color:</dt>
            <dd className="flex items-center space-x-2">
              <div
                className="w-4 h-4 rounded border border-gray-300"
                style={{ backgroundColor: event.branding?.primaryColor }}
              />
              <span className="text-sm text-gray-900">{event.branding?.primaryColor}</span>
            </dd>
          </div>
          {event.branding?.logoUrl && (
            <div className="flex justify-between">
              <dt className="text-sm text-gray-500">Logo:</dt>
              <dd className="text-sm text-blue-600">
                <a href={event.branding.logoUrl} target="_blank" rel="noopener noreferrer">
                  View Logo
                </a>
              </dd>
            </div>
          )}
        </dl>

        {event.branding?.workspaceTemplateId && (
          <div className="mt-4 border-t border-gray-200 pt-3">
            <p className="text-sm font-medium text-gray-900">Workspace template</p>
            <p className="mt-1 text-sm text-gray-700">
              This event will provision a workspace using template
              <span className="font-semibold"> {event.branding.workspaceTemplateId}</span>.
            </p>
            <p className="mt-1 text-xs text-gray-500">
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
  <div className="bg-white rounded-lg border border-gray-200 p-6">
    <h3 className="text-lg font-medium text-gray-900 mb-4">Registration Management</h3>
    <p className="text-gray-600">Registration management functionality will be implemented in future iterations.</p>
    <p className="text-sm text-gray-500 mt-2">Event: {event.name}</p>
  </div>
);

const WorkspaceTab: React.FC<{ event: Event }> = ({ event }) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialWorkspaceIdFromUrl = searchParams.get('workspaceId') || undefined;

  const { data: workspaces, isLoading, error } = useQuery<{
    id: string;
    name: string;
    status: WorkspaceStatus;
  }[]>({
    queryKey: ['event-workspaces', event.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workspaces')
        .select('id, name, status')
        .eq('event_id', event.id)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return (data || []) as { id: string; name: string; status: WorkspaceStatus }[];
    },
  });

  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string | null>(null);

  const canManageEventWorkspaces =
    !!user && (user.role === UserRole.ORGANIZER || user.role === UserRole.SUPER_ADMIN);

  useEffect(() => {
    if (!initialWorkspaceIdFromUrl || !workspaces || workspaces.length === 0) return;
    const exists = workspaces.find((ws) => ws.id === initialWorkspaceIdFromUrl);
    if (exists) {
      setSelectedWorkspaceId(initialWorkspaceIdFromUrl);
    }
  }, [initialWorkspaceIdFromUrl, workspaces]);

  useEffect(() => {
    if (!selectedWorkspaceId && workspaces && workspaces.length > 0) {
      setSelectedWorkspaceId(workspaces[0].id);
    }
  }, [selectedWorkspaceId, workspaces]);

  const createWorkspaceMutation = useMutation({
    mutationFn: async (workspaceLabel: string) => {
      if (!user) {
        throw new Error('You must be signed in to create a workspace');
      }

      const { data, error } = await supabase
        .from('workspaces')
        .insert({
          event_id: event.id,
          name: `${event.name} – ${workspaceLabel}`,
          organizer_id: user.id,
        })
        .select('id')
        .single();

      if (error) throw error;
      return data as { id: string };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['event-workspaces', event.id] });
      setSelectedWorkspaceId(data.id);
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        next.set('workspaceId', data.id);
        return next;
      });
    },
  });

  const selectedWorkspace =
    workspaces && selectedWorkspaceId
      ? workspaces.find((ws) => ws.id === selectedWorkspaceId)
      : undefined;

  const [workspaceNameDraft, setWorkspaceNameDraft] = useState<string>('');
  const [workspaceStatusDraft, setWorkspaceStatusDraft] = useState<WorkspaceStatus | undefined>(
    undefined,
  );

  useEffect(() => {
    if (!selectedWorkspace) return;
    setWorkspaceNameDraft(selectedWorkspace.name);
    setWorkspaceStatusDraft(selectedWorkspace.status as WorkspaceStatus);
  }, [selectedWorkspace?.id]);

  const {
    data: teamMembers,
    isLoading: isTeamMembersLoading,
  } = useQuery({
    queryKey: ['workspace-team-members', selectedWorkspaceId],
    queryFn: async () => {
      if (!selectedWorkspaceId) return [];

      const { data, error } = await supabase
        .from('workspace_team_members')
        .select('*')
        .eq('workspace_id', selectedWorkspaceId)
        .order('joined_at', { ascending: true });

      if (error) throw error;

      return (data || []).map((row: any) => ({
        id: row.id,
        userId: row.user_id,
        role: row.role,
        status: row.status,
        joinedAt: row.joined_at,
        leftAt: row.left_at || undefined,
        user: {
          id: row.user_id,
          name: 'Member',
          email: '',
        },
      }));
    },
    enabled: !!selectedWorkspaceId,
  });

  const currentMember = teamMembers?.find((member: any) => member.userId === user?.id);
  const managerWorkspaceRoles: WorkspaceRole[] = [
    WorkspaceRole.WORKSPACE_OWNER,
    WorkspaceRole.TEAM_LEAD,
    WorkspaceRole.EVENT_COORDINATOR,
  ];
  const isWorkspaceManager = currentMember
    ? managerWorkspaceRoles.includes(currentMember.role as WorkspaceRole)
    : false;

  const updateWorkspaceMutation = useMutation({
    mutationFn: async () => {
      if (!selectedWorkspace?.id) return;
      const payload: { name?: string; status?: WorkspaceStatus } = {};
      if (workspaceNameDraft && workspaceNameDraft !== selectedWorkspace.name) {
        payload.name = workspaceNameDraft;
      }
      if (workspaceStatusDraft && workspaceStatusDraft !== selectedWorkspace.status) {
        payload.status = workspaceStatusDraft;
      }
      if (Object.keys(payload).length === 0) return;

      const { error } = await supabase
        .from('workspaces')
        .update(payload)
        .eq('id', selectedWorkspace.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event-workspaces', event.id] });
    },
  });

  if (isLoading || createWorkspaceMutation.isPending) {
    return (
      <div className="bg-card rounded-lg border border-border p-6">
        <p className="text-sm text-muted-foreground">Loading workspaces…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-card rounded-lg border border-destructive/20 p-6">
        <h3 className="text-lg font-medium text-destructive mb-2">Unable to load workspaces</h3>
        <p className="text-sm text-destructive/80 mb-2">{(error as Error).message}</p>
        <p className="text-xs text-destructive/70">Check your permissions or try again later.</p>
      </div>
    );
  }

  const handleWorkspaceSelect = (workspaceId: string) => {
    setSelectedWorkspaceId(workspaceId);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('workspaceId', workspaceId);
      return next;
    });
  };

  const createWorkspace = (label: string) => {
    if (!canManageEventWorkspaces) return;
    createWorkspaceMutation.mutate(label);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      <div className="lg:col-span-1 bg-card rounded-lg border border-border p-4 space-y-4">
        <div>
          <h3 className="text-sm font-medium text-foreground">Event workspaces</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            {canManageEventWorkspaces
              ? 'Create specialized workspaces for different teams like Judging, Volunteers, or Sponsors.'
              : 'Browse existing workspaces for this event. Only organizers can create or manage workspaces.'}
          </p>
        </div>

        <div className="space-y-1">
          {workspaces && workspaces.length > 0 ? (
            workspaces.map((ws) => (
              <button
                key={ws.id}
                type="button"
                onClick={() => handleWorkspaceSelect(ws.id)}
                className={`w-full text-left px-3 py-2 rounded-md text-sm border transition-colors ${ws.id === selectedWorkspaceId
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border bg-background text-muted-foreground hover:bg-muted'
                  }`}
              >
                {ws.name}
              </button>
            ))
          ) : (
            <p className="text-xs text-muted-foreground">No workspaces yet for this event.</p>
          )}
        </div>

        {canManageEventWorkspaces && (
          <div className="pt-3 border-t border-border/60 space-y-2">
            <p className="text-xs font-medium text-muted-foreground">Create workspace</p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => createWorkspace('Operations')}
                className="inline-flex items-center justify-center px-2 py-1.5 rounded-md text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
                disabled={createWorkspaceMutation.isPending}
              >
                Operations
              </button>
              <button
                type="button"
                onClick={() => createWorkspace('Judging')}
                className="inline-flex items-center justify-center px-2 py-1.5 rounded-md text-xs font-medium bg-secondary text-secondary-foreground hover:bg-secondary/90 disabled:opacity-60"
                disabled={createWorkspaceMutation.isPending}
              >
                Judging
              </button>
              <button
                type="button"
                onClick={() => createWorkspace('Volunteers')}
                className="inline-flex items-center justify-center px-2 py-1.5 rounded-md text-xs font-medium bg-accent text-accent-foreground hover:bg-accent/90 disabled:opacity-60"
                disabled={createWorkspaceMutation.isPending}
              >
                Volunteers
              </button>
              <button
                type="button"
                onClick={() => createWorkspace('Sponsors')}
                className="inline-flex items-center justify-center px-2 py-1.5 rounded-md text-xs font-medium bg-muted text-foreground hover:bg-muted/80 disabled:opacity-60"
                disabled={createWorkspaceMutation.isPending}
              >
                Sponsors
              </button>
            </div>
            {createWorkspaceMutation.error && (
              <p className="mt-1 text-xs text-destructive">
                {(createWorkspaceMutation.error as Error).message}
              </p>
            )}
          </div>
        )}
      </div>

      <div className="lg:col-span-3 space-y-4">
        {selectedWorkspace && (
          <WorkspacePermissionsBanner
            userRole={user?.role}
            workspaceRole={currentMember?.role as WorkspaceRole}
            hasGlobalAccess={canManageEventWorkspaces}
            hasWorkspaceManagerAccess={isWorkspaceManager}
          />
        )}

        {selectedWorkspace && !isTeamMembersLoading && (
          <WorkspaceRolePermissionsTable highlightedRole={currentMember?.role as WorkspaceRole} />
        )}

        {canManageEventWorkspaces && selectedWorkspace && (
          <div className="bg-card rounded-lg border border-border p-4 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div className="w-full md:w-2/3 space-y-2">
              <label className="block text-xs font-medium text-muted-foreground">
                Workspace name
                <input
                  type="text"
                  className="mt-1 block w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring"
                  value={workspaceNameDraft}
                  onChange={(e) => setWorkspaceNameDraft(e.target.value)}
                  placeholder="Workspace name"
                />
              </label>
            </div>
            <div className="w-full md:w-1/3 space-y-2">
              <label className="block text-xs font-medium text-muted-foreground">
                Workspace status
                <select
                  className="mt-1 block w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring"
                  value={workspaceStatusDraft || WorkspaceStatus.ACTIVE}
                  onChange={(e) => setWorkspaceStatusDraft(e.target.value as WorkspaceStatus)}
                >
                  <option value={WorkspaceStatus.ACTIVE}>Active</option>
                  <option value={WorkspaceStatus.WINDING_DOWN}>Winding down</option>
                  <option value={WorkspaceStatus.DISSOLVED}>Dissolved</option>
                </select>
              </label>
              <button
                type="button"
                onClick={() => updateWorkspaceMutation.mutate()}
                className="mt-2 inline-flex items-center justify-center px-3 py-1.5 rounded-md text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-60 w-full"
                disabled={updateWorkspaceMutation.isPending}
              >
                Save changes
              </button>
            </div>
          </div>
        )}

        {selectedWorkspaceId ? (
          <WorkspaceDashboard workspaceId={selectedWorkspaceId} />
        ) : (
          <div className="bg-card rounded-lg border border-border p-6 flex items-center justify-center text-sm text-muted-foreground">
            Select a workspace on the left {canManageEventWorkspaces && 'or create a new one'} to get started.
          </div>
        )}
      </div>
    </div>
  );
};

const AnalyticsTab: React.FC<{ event: Event }> = ({ event }) => (
  <div className="bg-white rounded-lg border border-gray-200 p-6">
    <h3 className="text-lg font-medium text-gray-900 mb-4">Event Analytics</h3>
    <p className="text-gray-600">Event analytics and reporting will be implemented in future iterations.</p>
    <p className="text-sm text-gray-500 mt-2">Event: {event.name}</p>
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
  <div className="bg-white rounded-lg border border-gray-200 p-6">
    <h3 className="text-lg font-medium text-gray-900 mb-4">Event Settings</h3>
    <p className="text-gray-600">Event settings and configuration will be implemented in future iterations.</p>
    <p className="text-sm text-gray-500 mt-2">Event: {event.name}</p>
  </div>
);

export default EventDetailPage;

