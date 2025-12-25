import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { PageHeader } from '../PageHeader';
import { Event, EventStatus, EventMode } from '../../../types';
import {
  PlusIcon,
  MagnifyingGlassIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';

interface EventListPageProps {
  filterBy?: 'templates' | 'active' | 'draft' | 'completed';
}

export const EventListPage: React.FC<EventListPageProps> = ({ filterBy }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<EventStatus | 'ALL'>('ALL');
  const [modeFilter, setModeFilter] = useState<EventMode | 'ALL'>('ALL');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');

  // Mock data - in real implementation, this would come from API
  const mockEvents: Event[] = [
    {
      id: '1',
      name: 'Tech Innovation Summit 2024',
      description: 'Annual technology innovation summit featuring the latest trends in AI, blockchain, and IoT.',
      mode: EventMode.HYBRID,
      startDate: '2024-03-15T09:00:00Z',
      endDate: '2024-03-15T17:00:00Z',
      capacity: 500,
      registrationDeadline: '2024-03-10T23:59:59Z',
      organizerId: 'org1',
      visibility: 'PUBLIC' as any,
      branding: {
        primaryColor: '#3B82F6',
        logoUrl: '/logos/tech-summit.png',
      },
      status: EventStatus.PUBLISHED,
      landingPageUrl: '/events/tech-summit-2024',
      createdAt: '2024-01-15T10:00:00Z',
      updatedAt: '2024-02-01T14:30:00Z',
    },
    {
      id: '2',
      name: 'AI Workshop Series',
      description: 'Hands-on workshop series covering machine learning fundamentals and practical applications.',
      mode: EventMode.ONLINE,
      startDate: '2024-03-20T14:00:00Z',
      endDate: '2024-03-22T16:00:00Z',
      capacity: 100,
      organizerId: 'org1',
      visibility: 'PUBLIC' as any,
      branding: {
        primaryColor: '#10B981',
      },
      status: EventStatus.DRAFT,
      landingPageUrl: '/events/ai-workshop-series',
      createdAt: '2024-02-01T09:00:00Z',
      updatedAt: '2024-02-15T11:20:00Z',
    },
    {
      id: '3',
      name: 'Startup Pitch Competition',
      description: 'Annual startup pitch competition for emerging entrepreneurs and innovative business ideas.',
      mode: EventMode.OFFLINE,
      startDate: '2024-02-28T10:00:00Z',
      endDate: '2024-02-28T18:00:00Z',
      capacity: 200,
      organizerId: 'org1',
      visibility: 'PUBLIC' as any,
      branding: {
        primaryColor: '#F59E0B',
      },
      status: EventStatus.ONGOING,
      landingPageUrl: '/events/startup-pitch-2024',
      createdAt: '2024-01-10T08:00:00Z',
      updatedAt: '2024-02-25T16:45:00Z',
    },
  ];

  const filteredEvents = mockEvents.filter(event => {
    const matchesSearch = event.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         event.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || event.status === statusFilter;
    const matchesMode = modeFilter === 'ALL' || event.mode === modeFilter;
    const matchesFilterBy = !filterBy || 
                           (filterBy === 'active' && event.status === EventStatus.PUBLISHED) ||
                           (filterBy === 'draft' && event.status === EventStatus.DRAFT) ||
                           (filterBy === 'completed' && event.status === EventStatus.COMPLETED) ||
                           (filterBy === 'templates' && false); // Templates would be a separate data source

    return matchesSearch && matchesStatus && matchesMode && matchesFilterBy;
  });

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
      [EventMode.ONLINE]: { color: 'bg-blue-100 text-blue-800', label: 'Online' },
      [EventMode.OFFLINE]: { color: 'bg-purple-100 text-purple-800', label: 'Offline' },
      [EventMode.HYBRID]: { color: 'bg-indigo-100 text-indigo-800', label: 'Hybrid' },
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
      action: () => window.location.href = '/console/events/create',
      icon: PlusIcon,
      variant: 'primary' as const,
    },
  ];

  const filters = [
    {
      id: 'search',
      label: 'Search',
      type: 'search' as const,
      value: searchQuery,
      onChange: setSearchQuery,
    },
    {
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
    },
    {
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
    },
  ];

  const viewControls = [
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
          {viewMode === 'table' ? (
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Event Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Mode
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Start Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Capacity
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredEvents.map((event) => (
                      <tr key={event.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{event.name}</div>
                            <div className="text-sm text-gray-500 truncate max-w-xs">
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
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(event.startDate).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {event.capacity || 'Unlimited'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center space-x-2">
                            <Link
                              to={`/console/events/${event.id}`}
                              className="text-indigo-600 hover:text-indigo-500"
                              title="View Event"
                            >
                              <EyeIcon className="h-4 w-4" />
                            </Link>
                            <Link
                              to={`/console/events/${event.id}/edit`}
                              className="text-gray-600 hover:text-gray-500"
                              title="Edit Event"
                            >
                              <PencilIcon className="h-4 w-4" />
                            </Link>
                            <button
                              onClick={() => console.log('Delete event', event.id)}
                              className="text-red-600 hover:text-red-500"
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
                <div key={event.id} className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="text-lg font-medium text-gray-900 truncate">{event.name}</h3>
                    <div className="flex items-center space-x-2 ml-2">
                      {getStatusBadge(event.status)}
                    </div>
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">{event.description}</p>
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Mode:</span>
                      {getModeBadge(event.mode)}
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Start Date:</span>
                      <span className="text-gray-900">{new Date(event.startDate).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Capacity:</span>
                      <span className="text-gray-900">{event.capacity || 'Unlimited'}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                    <Link
                      to={`/console/events/${event.id}`}
                      className="text-indigo-600 hover:text-indigo-500 text-sm font-medium"
                    >
                      View Details
                    </Link>
                    <div className="flex items-center space-x-2">
                      <Link
                        to={`/console/events/${event.id}/edit`}
                        className="text-gray-600 hover:text-gray-500"
                        title="Edit Event"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </Link>
                      <button
                        onClick={() => console.log('Delete event', event.id)}
                        className="text-red-600 hover:text-red-500"
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
          {filteredEvents.length === 0 && (
            <div className="text-center py-12">
              <div className="mx-auto h-12 w-12 text-gray-400 mb-4">
                <MagnifyingGlassIcon />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No events found</h3>
              <p className="text-gray-500 mb-6">
                {searchQuery || statusFilter !== 'ALL' || modeFilter !== 'ALL'
                  ? 'Try adjusting your search criteria or filters.'
                  : 'Get started by creating your first event.'}
              </p>
              <Link
                to="/console/events/create"
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
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