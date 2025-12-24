import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import { PageHeader } from '../PageHeader';

/**
 * EventServiceDashboard provides the AWS-style service landing page for Event Management.
 * Features:
 * - Service overview with key metrics
 * - Quick action buttons for common tasks
 * - Recent events and activity
 * - Service-specific widgets and analytics
 */
export const EventServiceDashboard: React.FC = () => {
  const { user } = useAuth();

  // Mock data - in real implementation, this would come from API
  const dashboardData = {
    metrics: {
      totalEvents: 12,
      activeEvents: 3,
      draftEvents: 2,
      totalRegistrations: 1247,
      upcomingEvents: 5,
    },
    recentEvents: [
      {
        id: '1',
        name: 'Tech Innovation Summit 2024',
        status: 'PUBLISHED',
        startDate: '2024-03-15',
        registrations: 156,
      },
      {
        id: '2',
        name: 'AI Workshop Series',
        status: 'DRAFT',
        startDate: '2024-03-20',
        registrations: 0,
      },
      {
        id: '3',
        name: 'Startup Pitch Competition',
        status: 'ONGOING',
        startDate: '2024-02-28',
        registrations: 89,
      },
    ],
    quickActions: [
      {
        title: 'Create New Event',
        description: 'Start planning your next event',
        href: '/console/events/create',
        icon: '📅',
        primary: true,
      },
      {
        title: 'Browse Templates',
        description: 'Use pre-built event templates',
        href: '/console/events/templates',
        icon: '📋',
      },
      {
        title: 'View All Events',
        description: 'Manage your existing events',
        href: '/console/events/list',
        icon: '📊',
      },
      {
        title: 'Analytics Dashboard',
        description: 'View event performance metrics',
        href: '/console/analytics',
        icon: '📈',
      },
    ],
  };

  const pageActions = [
    {
      label: 'Create Event',
      action: () => { window.location.href = '/console/events/create'; },
      variant: 'primary' as const,
    },
    {
      label: 'Import Events',
      action: () => console.log('Import events'),
      variant: 'secondary' as const,
    },
  ];

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Page Header */}
        <PageHeader
          title="Event Management"
          subtitle="Create, manage, and analyze your events"
          actions={pageActions}
        />

        {/* Welcome Message */}
        {user && (
          <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-blue-800">
              Welcome back, <span className="font-semibold">{user.name}</span>! 
              Ready to manage your events?
            </p>
          </div>
        )}

        {/* Service Overview Metrics */}
        <div className="mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <span className="text-2xl">📅</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Events</p>
                  <p className="text-2xl font-bold text-gray-900">{dashboardData.metrics.totalEvents}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <span className="text-2xl">🟢</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Active Events</p>
                  <p className="text-2xl font-bold text-green-600">{dashboardData.metrics.activeEvents}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <span className="text-2xl">📝</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Draft Events</p>
                  <p className="text-2xl font-bold text-yellow-600">{dashboardData.metrics.draftEvents}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <span className="text-2xl">👥</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Registrations</p>
                  <p className="text-2xl font-bold text-blue-600">{dashboardData.metrics.totalRegistrations}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <span className="text-2xl">⏰</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Upcoming Events</p>
                  <p className="text-2xl font-bold text-purple-600">{dashboardData.metrics.upcomingEvents}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {dashboardData.quickActions.map((action, index) => (
              <Link
                key={index}
                to={action.href}
                className={`block p-6 rounded-lg border transition-all duration-200 hover:shadow-md ${
                  action.primary
                    ? 'border-blue-200 bg-blue-50 hover:bg-blue-100'
                    : 'border-gray-200 bg-white hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center space-x-3 mb-3">
                  <span className="text-2xl">{action.icon}</span>
                  <h4 className={`font-medium ${action.primary ? 'text-blue-900' : 'text-gray-900'}`}>
                    {action.title}
                  </h4>
                </div>
                <p className={`text-sm ${action.primary ? 'text-blue-700' : 'text-gray-600'}`}>
                  {action.description}
                </p>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent Events */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Recent Events</h3>
            <Link
              to="/console/events/list"
              className="text-sm text-blue-600 hover:text-blue-500 font-medium"
            >
              View all events →
            </Link>
          </div>
          
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
                      Start Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Registrations
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {dashboardData.recentEvents.map((event) => (
                    <tr key={event.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{event.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          event.status === 'PUBLISHED' ? 'bg-green-100 text-green-800' :
                          event.status === 'DRAFT' ? 'bg-yellow-100 text-yellow-800' :
                          event.status === 'ONGOING' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {event.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(event.startDate).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {event.registrations}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <Link
                          to={`/console/events/${event.id}`}
                          className="text-blue-600 hover:text-blue-500 mr-4"
                        >
                          View
                        </Link>
                        <Link
                          to={`/console/events/${event.id}/edit`}
                          className="text-gray-600 hover:text-gray-500"
                        >
                          Edit
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Service Information */}
        <div className="bg-blue-50 rounded-lg p-6">
          <h3 className="text-lg font-medium text-blue-900 mb-2">About Event Management Service</h3>
          <p className="text-blue-700 mb-4">
            The Event Management Service provides comprehensive tools for creating, managing, and analyzing events. 
            From initial planning to post-event analytics, manage your entire event lifecycle in one place.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <h4 className="font-medium text-blue-900 mb-1">Event Creation</h4>
              <p className="text-blue-700">Create events with customizable templates, branding, and registration forms.</p>
            </div>
            <div>
              <h4 className="font-medium text-blue-900 mb-1">Registration Management</h4>
              <p className="text-blue-700">Handle participant registration, waitlists, and communication.</p>
            </div>
            <div>
              <h4 className="font-medium text-blue-900 mb-1">Analytics & Insights</h4>
              <p className="text-blue-700">Track event performance, attendance, and participant engagement.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventServiceDashboard;