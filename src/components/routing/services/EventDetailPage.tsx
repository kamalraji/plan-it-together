import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import { PageHeader } from '../PageHeader';
import { Event, EventStatus, EventMode, UserRole } from '../../../types';
import { useAuth } from '@/hooks/useAuth';
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

interface EventDetailPageProps {
  defaultTab?: string;
}

export const EventDetailPage: React.FC<EventDetailPageProps> = ({ defaultTab = 'overview' }) => {
  const { eventId } = useParams<{ eventId: string }>();
  const [activeTab, setActiveTab] = useState(defaultTab);

  const { data: event, isLoading, error } = useQuery<Event | null>({
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

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Event not found</h1>
          <Link to="/dashboard/eventmanagement" className="text-indigo-600 hover:text-indigo-800">
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
    {
      label: 'Edit Event',
      action: () => (window.location.href = `/dashboard/events/${eventId}/edit`),
      icon: PencilIcon,
      variant: 'primary' as const,
    },
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
  ];

  const breadcrumbs = [
    { label: 'Events', href: '/dashboard/eventmanagement' },
    { label: event.name, href: `/dashboard/eventmanagement/${eventId}` },
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

const WorkspaceTab: React.FC<{ event: Event }> = ({ event }) => (
  <div className="bg-white rounded-lg border border-gray-200 p-6">
    <h3 className="text-lg font-medium text-gray-900 mb-4">Event Workspace</h3>
    <p className="text-gray-600">Event workspace integration will be implemented in future iterations.</p>
    <p className="text-sm text-gray-500 mt-2">Event: {event.name}</p>
  </div>
);

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
  