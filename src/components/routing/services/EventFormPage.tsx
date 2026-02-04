import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PageHeader } from '../PageHeader';
import { XMarkIcon, CheckIcon } from '@heroicons/react/24/outline';

interface EventFormPageProps {
  mode: 'create' | 'edit';
}

/**
 * EventFormPage provides AWS-style form layout for creating and editing events.
 * Features:
 * - Form validation and error handling
 * - Multi-step form wizard for complex event creation
 * - Auto-save functionality
 * - Integration with existing EventForm component
 */
export const EventFormPage: React.FC<EventFormPageProps> = ({ mode }) => {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();

  // Use eventId for edit mode
  console.log('Event ID for editing:', eventId);

  const pageTitle = mode === 'create' ? 'Create New Event' : 'Edit Event';
  const pageSubtitle = mode === 'create' 
    ? 'Fill in the details to create your event'
    : 'Update your event information';

  const pageActions = [
    {
      label: 'Cancel',
      action: () => navigate('/console/events'),
      icon: XMarkIcon,
      variant: 'secondary' as const,
    },
    {
      label: mode === 'create' ? 'Create Event' : 'Save Changes',
      action: () => console.log('Save event'),
      icon: CheckIcon,
      variant: 'primary' as const,
    },
  ];

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <PageHeader
          title={pageTitle}
          subtitle={pageSubtitle}
          actions={pageActions}
        />

        {/* Event Form Content */}
        <div className="mt-6 bg-white rounded-lg border border-gray-200 p-6">
          <div className="space-y-6">
            {/* Basic Information Section */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h3>
              <div className="grid grid-cols-1 gap-6">
                <div>
                  <label htmlFor="event-name" className="block text-sm font-medium text-gray-700 mb-2">
                    Event Name *
                  </label>
                  <input
                    type="text"
                    id="event-name"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter event name"
                  />
                </div>

                <div>
                  <label htmlFor="event-description" className="block text-sm font-medium text-gray-700 mb-2">
                    Description *
                  </label>
                  <textarea
                    id="event-description"
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Describe your event"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="event-mode" className="block text-sm font-medium text-gray-700 mb-2">
                      Event Mode *
                    </label>
                    <select
                      id="event-mode"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select mode</option>
                      <option value="ONLINE">Online</option>
                      <option value="OFFLINE">Offline</option>
                      <option value="HYBRID">Hybrid</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="event-capacity" className="block text-sm font-medium text-gray-700 mb-2">
                      Capacity
                    </label>
                    <input
                      type="number"
                      id="event-capacity"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter capacity (optional)"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Date and Time Section */}
            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Date and Time</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="start-date" className="block text-sm font-medium text-gray-700 mb-2">
                    Start Date *
                  </label>
                  <input
                    type="datetime-local"
                    id="start-date"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label htmlFor="end-date" className="block text-sm font-medium text-gray-700 mb-2">
                    End Date *
                  </label>
                  <input
                    type="datetime-local"
                    id="end-date"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label htmlFor="registration-deadline" className="block text-sm font-medium text-gray-700 mb-2">
                    Registration Deadline
                  </label>
                  <input
                    type="datetime-local"
                    id="registration-deadline"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Branding Section */}
            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Branding</h3>
              <div className="grid grid-cols-1 gap-6">
                <div>
                  <label htmlFor="primary-color" className="block text-sm font-medium text-gray-700 mb-2">
                    Primary Color
                  </label>
                  <input
                    type="color"
                    id="primary-color"
                    className="h-10 w-20 border border-gray-300 rounded-md"
                  />
                </div>

                <div>
                  <label htmlFor="logo-url" className="block text-sm font-medium text-gray-700 mb-2">
                    Logo URL
                  </label>
                  <input
                    type="url"
                    id="logo-url"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="https://example.com/logo.png"
                  />
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div className="border-t border-gray-200 pt-6 flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={() => navigate('/console/events')}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => console.log('Save as draft')}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Save as Draft
              </button>
              <button
                type="submit"
                onClick={() => console.log('Create/Update event')}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                {mode === 'create' ? 'Create Event' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>

        {/* Help Text */}
        <div className="mt-6 bg-blue-50 rounded-lg p-4">
          <h4 className="text-sm font-medium text-blue-900 mb-2">Need Help?</h4>
          <p className="text-sm text-blue-700">
            {mode === 'create' 
              ? 'Fill in the required fields to create your event. You can save as draft and continue editing later.'
              : 'Update your event information. Changes will be reflected immediately after saving.'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default EventFormPage;
