import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PageHeader } from '../PageHeader';
import { Event, EventStatus, EventMode, EventTemplate } from '../../../types';
import { useEventManagementPaths } from '@/hooks/useEventManagementPaths';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/looseClient';
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

  // Load event templates from workspace_templates table
  const { data: templates = [] } = useQuery<EventTemplate[]>({
    queryKey: ['event-templates'],
    enabled: filterBy === 'templates',
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workspace_templates')
        .select('id, name, description, event_type, industry_type, metadata')
        .eq('is_public', true)
        .order('usage_count', { ascending: false })
        .limit(20);

      if (error) throw error;

      return (data || []).map((row: {
        id: string;
        name: string;
        description: string | null;
        event_type: string | null;
        industry_type: string | null;
        metadata: Record<string, unknown> | null;
      }) => ({
        id: row.id,
        name: row.name,
        description: row.description || '',
        category: row.industry_type || row.event_type || 'General',
        defaultMode: EventMode.OFFLINE,
        defaultDuration: 8,
        suggestedCapacity: (row.metadata as any)?.suggestedCapacity || 100,
      })) as EventTemplate[];
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
      [EventStatus.DRAFT]: { color: 'bg-warning/20 text-warning', label: 'Draft' },
      [EventStatus.PUBLISHED]: { color: 'bg-success/20 text-success', label: 'Published' },
      [EventStatus.ONGOING]: { color: 'bg-info/20 text-info', label: 'Ongoing' },
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
                <div className="fixed inset-0 z-20 flex items-center justify-center bg-foreground/50 px-4">
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
                          {event.capacity || '—'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <div className="flex items-center space-x-3">
                            <Link
                              to={eventDetailPath(event.id)}
                              className="text-primary hover:text-primary/80"
                              title="View"
                            >
                              <EyeIcon className="h-5 w-5" />
                            </Link>
                            <Link
                              to={eventEditPath(event.id)}
                              className="text-muted-foreground hover:text-foreground"
                              title="Edit"
                            >
                              <PencilIcon className="h-5 w-5" />
                            </Link>
                            <button
                              className="text-destructive hover:text-destructive/80"
                              title="Delete"
                            >
                              <TrashIcon className="h-5 w-5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {filteredEvents.length === 0 && (
                <div className="text-center py-12">
                  <EventHosting className="mx-auto h-32 w-32 text-muted-foreground/40 mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">No events found</h3>
                  <p className="text-muted-foreground mb-6">
                    {searchQuery || statusFilter !== 'ALL' || modeFilter !== 'ALL'
                      ? 'Try adjusting your filters.'
                      : 'Get started by creating your first event.'}
                  </p>
                  <button
                    onClick={() => navigate(createPath)}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-primary-foreground bg-primary hover:bg-primary/90"
                  >
                    <PlusIcon className="h-5 w-5 mr-2" />
                    Create Event
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredEvents.map((event) => (
                <div
                  key={event.id}
                  className="bg-card rounded-lg border border-border overflow-hidden hover:shadow-md transition-shadow"
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-medium text-foreground truncate">
                          {event.name}
                        </h3>
                        <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                          {event.description}
                        </p>
                      </div>
                      <div className="ml-3 flex flex-col gap-1">
                        {getStatusBadge(event.status)}
                        {getModeBadge(event.mode)}
                      </div>
                    </div>

                    <div className="space-y-2 text-sm text-muted-foreground mb-4">
                      <div className="flex items-center justify-between">
                        <span>Start Date</span>
                        <span className="font-medium text-foreground">
                          {new Date(event.startDate).toLocaleDateString()}
                        </span>
                      </div>
                      {event.capacity && (
                        <div className="flex items-center justify-between">
                          <span>Capacity</span>
                          <span className="font-medium text-foreground">{event.capacity}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-end space-x-2 pt-4 border-t border-border">
                      <Link
                        to={eventDetailPath(event.id)}
                        className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-primary hover:bg-primary/10 rounded-md"
                      >
                        <EyeIcon className="h-4 w-4 mr-1" />
                        View
                      </Link>
                      <Link
                        to={eventEditPath(event.id)}
                        className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-muted-foreground hover:bg-muted rounded-md"
                      >
                        <PencilIcon className="h-4 w-4 mr-1" />
                        Edit
                      </Link>
                    </div>
                  </div>
                </div>
              ))}

              {filteredEvents.length === 0 && (
                <div className="col-span-full text-center py-12">
                  <ThinkingPerson className="mx-auto h-32 w-32 text-muted-foreground/40 mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">No events found</h3>
                  <p className="text-muted-foreground mb-6">
                    {searchQuery || statusFilter !== 'ALL' || modeFilter !== 'ALL'
                      ? 'Try adjusting your filters.'
                      : 'Get started by creating your first event.'}
                  </p>
                  <button
                    onClick={() => navigate(createPath)}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-primary-foreground bg-primary hover:bg-primary/90"
                  >
                    <PlusIcon className="h-5 w-5 mr-2" />
                    Create Event
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
