import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PageHeader } from '../PageHeader';
import { Event, EventStatus, EventMode, EventTemplate } from '../../../types';
import { useEventManagementPaths } from '@/hooks/useEventManagementPaths';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/looseClient';
import api from '@/lib/api';
import { useOptionalOrganization } from '@/components/organization/OrganizationContext';
import { useAuth } from '@/hooks/useAuth';
import {
  PlusIcon,
  MagnifyingGlassIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import { EventHosting, ThinkingPerson } from '@/components/illustrations';

interface EventListPageProps {
  filterBy?: 'templates' | 'active' | 'draft' | 'completed';
}

export const EventListPage: React.FC<EventListPageProps> = ({ filterBy }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const organization = useOptionalOrganization();
  const { createPath, eventDetailPath, eventEditPath } = useEventManagementPaths();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<EventStatus | 'ALL'>('ALL');
  const [modeFilter, setModeFilter] = useState<EventMode | 'ALL'>('ALL');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [selectedTemplate, setSelectedTemplate] = useState<EventTemplate | null>(null);
  const [ownershipFilter, setOwnershipFilter] = useState<'all' | 'mine'>('all');

  // Load events scoped by organization or user's personal events
  const { data: events = [] } = useQuery<Event[]>({
    queryKey: ['organizer-events', filterBy, organization?.id ?? 'personal', user?.id, ownershipFilter],
    queryFn: async () => {
      let query = supabase
        .from('events')
        .select(
          'id, name, description, mode, start_date, end_date, capacity, visibility, status, created_at, updated_at, organization_id, owner_id',
        )
        .order('start_date', { ascending: true });

      // Filter by organization if in org context, otherwise show user's personal events
      if (organization?.id) {
        query = query.eq('organization_id', organization.id);
        // Apply ownership filter only in org context
        if (ownershipFilter === 'mine') {
          query = query.eq('owner_id', user?.id ?? '');
        }
      } else {
        // Personal events: owned by user and no organization
        query = query.is('organization_id', null).eq('owner_id', user?.id ?? '');
      }

      const { data, error } = await query;

      if (error) throw error;

      return (data as any[]).map(
        (row) =>
          ({
            id: row.id,
            name: row.name,
            description: row.description || '',
            mode: row.mode as EventMode,
            startDate: row.start_date,
            endDate: row.end_date,
            capacity: row.capacity ?? undefined,
            registrationDeadline: undefined,
            organizerId: '',
            visibility: row.visibility,
            branding: {},
            status: row.status as EventStatus,
            landingPageUrl: `/events/${row.id}`,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
          } as Event),
      );
    },
    enabled: filterBy !== 'templates',
  });

  // Load event templates for the gallery view
  const { data: templates = [] } = useQuery<EventTemplate[]>({
    queryKey: ['event-templates'],
    enabled: filterBy === 'templates',
    queryFn: async () => {
      const response = await api.get('/events/templates');
      return response.data.templates as EventTemplate[];
    },
  });

  const filteredEvents = events.filter((event) => {
    const matchesSearch =
      event.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || event.status === statusFilter;
    const matchesMode = modeFilter === 'ALL' || event.mode === modeFilter;
    const matchesFilterBy =
      !filterBy ||
      (filterBy === 'active' && event.status === EventStatus.PUBLISHED) ||
      (filterBy === 'draft' && event.status === EventStatus.DRAFT) ||
      (filterBy === 'completed' && event.status === EventStatus.COMPLETED);

    return matchesSearch && matchesStatus && matchesMode && matchesFilterBy;
  });

  const filteredTemplates =
    filterBy === 'templates'
      ? templates.filter((template) => {
          const query = searchQuery.toLowerCase();
          return (
            template.name.toLowerCase().includes(query) ||
            template.description.toLowerCase().includes(query) ||
            template.category.toLowerCase().includes(query)
          );
        })
      : [];

  const getStatusBadge = (status: EventStatus) => {
    const statusConfig = {
      [EventStatus.DRAFT]: { color: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400', label: 'Draft' },
      [EventStatus.PUBLISHED]: { color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400', label: 'Published' },
      [EventStatus.ONGOING]: { color: 'bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-400', label: 'Ongoing' },
      [EventStatus.COMPLETED]: { color: 'bg-muted text-muted-foreground', label: 'Completed' },
      [EventStatus.CANCELLED]: { color: 'bg-destructive/10 text-destructive', label: 'Cancelled' },
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
      [EventMode.ONLINE]: { color: 'bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-400', label: 'Online' },
      [EventMode.OFFLINE]: { color: 'bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-400', label: 'Offline' },
      [EventMode.HYBRID]: { color: 'bg-primary/10 text-primary', label: 'Hybrid' },
    };

    const config = modeConfig[mode];
    return (
      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${config.color}`}>
        {config.label}
      </span>
    );
  };

  const pageTitle = filterBy === 'templates' ? 'Event Templates' : 'Events';
  const pageSubtitle = filterBy === 'templates' 
    ? 'Browse and use pre-built event templates'
    : 'Manage your events and track their performance';

  const pageActions = [
    {
      label: filterBy === 'templates' ? 'Create Template' : 'Create Event',
      action: () => navigate(createPath),
      icon: PlusIcon,
      variant: 'primary' as const,
    },
  ];

  const searchFilter = {
    id: 'search',
    label: 'Search',
    type: 'search' as const,
    value: searchQuery,
    onChange: setSearchQuery,
  };

  const statusFilterConfig = {
    id: 'status',
    label: 'Status',
    type: 'select' as const,
    value: statusFilter,
    options: [
      { label: 'All Statuses', value: 'ALL' },
      { label: 'Draft', value: EventStatus.DRAFT },
      { label: 'Published', value: EventStatus.PUBLISHED },
      { label: 'Ongoing', value: EventStatus.ONGOING },
      { label: 'Completed', value: EventStatus.COMPLETED },
      { label: 'Cancelled', value: EventStatus.CANCELLED },
    ],
    onChange: setStatusFilter,
  };

  const modeFilterConfig = {
    id: 'mode',
    label: 'Mode',
    type: 'select' as const,
    value: modeFilter,
    options: [
      { label: 'All Modes', value: 'ALL' },
      { label: 'Online', value: EventMode.ONLINE },
      { label: 'Offline', value: EventMode.OFFLINE },
      { label: 'Hybrid', value: EventMode.HYBRID },
    ],
    onChange: setModeFilter,
  };

  const ownershipFilterConfig = {
    id: 'ownership',
    label: 'Events',
    type: 'select' as const,
    value: ownershipFilter,
    options: [
      { label: 'All Events', value: 'all' },
      { label: 'My Events', value: 'mine' },
    ],
    onChange: setOwnershipFilter,
  };

  // Only show ownership filter when in org context
  const baseFilters = [searchFilter, statusFilterConfig, modeFilterConfig];
  const filters =
    filterBy === 'templates'
      ? [searchFilter]
      : organization?.id
        ? [...baseFilters, ownershipFilterConfig]
        : baseFilters;

  const viewControls =
    filterBy === 'templates'
      ? []
      : [
          {
            type: 'table' as const,
            active: viewMode === 'table',
            onChange: () => setViewMode('table'),
          },
          {
            type: 'cards' as const,
            active: viewMode === 'cards',
            onChange: () => setViewMode('cards'),
          },
        ];

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <PageHeader
          title={pageTitle}
          subtitle={pageSubtitle}
          actions={pageActions}
          filters={filters}
          viewControls={viewControls}
        />

        {/* Content */}
        <div className="mt-6">
          {filterBy === 'templates' ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredTemplates.map((template) => (
                  <button
                    key={template.id}
                    type="button"
                    onClick={() => setSelectedTemplate(template)}
                    className="text-left bg-card rounded-lg border border-border p-6 hover:shadow-md transition-shadow focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-lg font-medium text-foreground truncate">{template.name}</h3>
                        <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                          {template.description}
                        </p>
                      </div>
                      <span className="ml-3 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                        {template.category}
                      </span>
                    </div>
                    <div className="space-y-1 text-sm text-muted-foreground">
                      <div className="flex items-center justify-between">
                        <span>Default mode</span>
                        <span className="font-medium text-foreground">{template.defaultMode}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Duration</span>
                        <span className="font-medium text-foreground">{template.defaultDuration} hours</span>
                      </div>
                      {template.suggestedCapacity && (
                        <div className="flex items-center justify-between">
                          <span>Suggested capacity</span>
                          <span className="font-medium text-foreground">{template.suggestedCapacity}</span>
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>

              {filteredTemplates.length === 0 && (
                <div className="text-center py-12">
                  <div className="mx-auto h-12 w-12 text-muted-foreground mb-4">
                    <MagnifyingGlassIcon />
                  </div>
                  <h3 className="text-lg font-medium text-foreground mb-2">No templates found</h3>
                  <p className="text-muted-foreground mb-6">
                    {searchQuery
                      ? 'Try adjusting your search term.'
                      : 'Templates will appear here once they are available.'}
                  </p>
                </div>
              )}

              {selectedTemplate && (
                <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/50 px-4">
                  <div className="max-w-lg w-full bg-card rounded-lg shadow-lg p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-xl font-semibold text-foreground">
                          {selectedTemplate.name}
                        </h3>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {selectedTemplate.description}
                        </p>
                      </div>
                      <button
                        onClick={() => setSelectedTemplate(null)}
                        className="ml-4 text-muted-foreground hover:text-foreground"
                        aria-label="Close preview"
                      >
                        ✕
                      </button>
                    </div>

                    <div className="space-y-3 text-sm text-foreground">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Category</span>
                        <span className="font-medium">{selectedTemplate.category}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Default mode</span>
                        <span className="font-medium">{selectedTemplate.defaultMode}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Default duration</span>
                        <span className="font-medium">{selectedTemplate.defaultDuration} hours</span>
                      </div>
                      {selectedTemplate.suggestedCapacity && (
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Suggested capacity</span>
                          <span className="font-medium">{selectedTemplate.suggestedCapacity}</span>
                        </div>
                      )}
                    </div>

                    <div className="mt-6 flex justify-end space-x-3">
                      <button
                        type="button"
                        className="px-4 py-2 rounded-md border border-border text-sm font-medium text-foreground hover:bg-muted"
                        onClick={() => setSelectedTemplate(null)}
                      >
                        Close
                      </button>
                      <button
                        type="button"
                        className="px-4 py-2 rounded-md border border-transparent text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90"
                        onClick={() => {
                          navigate(createPath + `?templateId=${selectedTemplate.id}`);
                        }}
                      >
                        Use this template
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : viewMode === 'table' ? (
            <div className="bg-card rounded-lg border border-border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-border">
                  <thead className="bg-muted">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Event Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Mode
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Start Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Capacity
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-background divide-y divide-border">
                    {filteredEvents.map((event) => (
                      <tr key={event.id} className="hover:bg-muted/50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-foreground">{event.name}</div>
                            <div className="text-sm text-muted-foreground truncate max-w-xs">
                              {event.description}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(event.status)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getModeBadge(event.mode)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                          {new Date(event.startDate).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                          {event.capacity || 'Unlimited'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center space-x-2">
                            <Link
                              to={eventDetailPath(event.id)}
                              className="text-primary hover:text-primary/80"
                              title="View Event"
                            >
                              <EyeIcon className="h-4 w-4" />
                            </Link>
                            <Link
                              to={eventEditPath(event.id)}
                              className="text-muted-foreground hover:text-foreground"
                              title="Edit Event"
                            >
                              <PencilIcon className="h-4 w-4" />
                            </Link>
                            <button
                              onClick={() => { /* TODO: Implement delete event */ }}
                              className="text-destructive hover:text-destructive/80"
                              title="Delete Event"
                            >
                              <TrashIcon className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredEvents.map((event) => (
                <div
                  key={event.id}
                  className="bg-card rounded-lg border border-border p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="text-lg font-medium text-foreground truncate">{event.name}</h3>
                    <div className="flex items-center space-x-2 ml-2">
                      {getStatusBadge(event.status)}
                    </div>
                  </div>

                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{event.description}</p>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Mode:</span>
                      {getModeBadge(event.mode)}
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Start Date:</span>
                      <span className="text-foreground">
                        {new Date(event.startDate).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Capacity:</span>
                      <span className="text-foreground">{event.capacity || 'Unlimited'}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-border">
                    <Link
                      to={`/console/events/${event.id}`}
                      className="text-primary hover:text-primary/80 text-sm font-medium"
                    >
                      View Details
                    </Link>
                    <div className="flex items-center space-x-2">
                      <Link
                        to={`/console/events/${event.id}/edit`}
                        className="text-muted-foreground hover:text-foreground"
                        title="Edit Event"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </Link>
                      <button
                        onClick={() => { /* TODO: Implement delete event */ }}
                        className="text-destructive hover:text-destructive/80"
                        title="Delete Event"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Empty State */}
          {filterBy !== 'templates' && filteredEvents.length === 0 && (
            <div className="text-center py-12 flex flex-col items-center">
              {searchQuery || statusFilter !== 'ALL' || modeFilter !== 'ALL' ? (
                <ThinkingPerson size="sm" showBackground={false} />
              ) : (
                <EventHosting size="sm" showBackground={false} />
              )}
              <h3 className="text-lg font-medium text-foreground mb-2 mt-4">No events found</h3>
              <p className="text-muted-foreground mb-6">
                {searchQuery || statusFilter !== 'ALL' || modeFilter !== 'ALL'
                  ? 'Try adjusting your search criteria or filters.'
                  : 'Get started by creating your first event.'}
              </p>
              <Link
                to={createPath}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-primary-foreground bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Create Event
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EventListPage;